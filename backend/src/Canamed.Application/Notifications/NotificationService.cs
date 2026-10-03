using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Notifications;

namespace Canamed.Application.Notifications;

public sealed class NotificationService(
    INotificationRepository notificationRepository,
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    ISmsWhatsAppProvider provider,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork)
{
    public async Task<ProcessRemindersResult> ProcessPendingRemindersAsync(
        Guid clinicId,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        // RN-002: Janela de horário ético (08h00 às 20h00 local Brasília)
        var localTime = now.ToOffset(TimeSpan.FromHours(-3));
        if (localTime.Hour < 8 || localTime.Hour >= 20)
        {
            return new ProcessRemindersResult(0, 0, 0, 0);
        }

        var startWindow = now.AddHours(1);
        var endWindow = now.AddHours(48);

        var appointments = await agendaRepository.ListAppointmentsAsync(clinicId, null, startWindow, endWindow, cancellationToken);

        int processed = 0;
        int sent = 0;
        int skippedOptOut = 0;
        int failed = 0;

        foreach (var apt in appointments)
        {
            if (apt.Status is not AppointmentStatus.Scheduled)
                continue;

            var timeUntil = apt.StartsAt - now;
            NotificationTriggerType triggerType;

            if (timeUntil.TotalHours <= 26 && timeUntil.TotalHours >= 20)
            {
                triggerType = NotificationTriggerType.Reminder24h;
            }
            else if (timeUntil.TotalHours <= 50 && timeUntil.TotalHours >= 44)
            {
                triggerType = NotificationTriggerType.Reminder48h;
            }
            else
            {
                continue;
            }

            processed++;

            var idempotencyKey = $"{apt.Id:N}_{triggerType}_{NotificationChannel.WhatsApp}";
            var existing = await notificationRepository.GetByIdempotencyKeyAsync(idempotencyKey, cancellationToken);
            if (existing is not null)
                continue;

            var patient = await catalogRepository.FindPatientAsync(clinicId, apt.PatientId, cancellationToken);
            if (patient is null || string.IsNullOrWhiteSpace(patient.Phone))
            {
                failed++;
                continue;
            }

            var preference = await notificationRepository.GetPreferenceByPatientIdAsync(apt.PatientId, cancellationToken);
            if (preference is not null && (!preference.WhatsAppEnabled || preference.OptedOutAt is not null))
            {
                skippedOptOut++;
                continue;
            }

            var localDateStr = apt.StartsAt.ToOffset(TimeSpan.FromHours(-3)).ToString("dd/MM/yyyy às HH:mm");
            var messageBody = $"Olá, {patient.Name}! Lembrando da sua consulta no CANAMED agendada para {localDateStr}.\n\nPara CONFIRMAR sua presença, responda 1.\nPara CANCELAR ou reagendar, responda 2.\n\n(Caso não queira mais receber lembretes, responda SAIR).";

            var notification = AppointmentNotification.Create(
                clinicId,
                apt.Id,
                apt.PatientId,
                NotificationChannel.WhatsApp,
                patient.Phone,
                triggerType,
                messageBody,
                now);

            var sendResult = await provider.SendMessageAsync(patient.Phone, NotificationChannel.WhatsApp, messageBody, cancellationToken);
            if (sendResult.Success)
            {
                notification.MarkAsSent(now);
                sent++;
            }
            else
            {
                notification.MarkAsFailed(sendResult.ErrorMessage ?? "Erro no provedor.");
                failed++;
            }

            await unitOfWork.ExecuteInTransactionAsync(async token =>
            {
                await notificationRepository.AddNotificationAsync(notification, token);

                auditRepository.Add(AuditEvent.Record(
                    clinicId,
                    "system_worker",
                    "Worker de Notificações",
                    "NotificationSent",
                    "appointment_notifications",
                    notification.Id.ToString(),
                    now,
                    $"{{\"triggerType\":\"{triggerType}\",\"patientId\":\"{apt.PatientId}\",\"success\":{sendResult.Success.ToString().ToLowerInvariant()}}}"));

                return true;
            }, cancellationToken);
        }

        return new ProcessRemindersResult(processed, sent, skippedOptOut, failed);
    }

    public async Task<IncomingWebhookResult> HandleIncomingReplyAsync(
        string fromPhone,
        string messageText,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fromPhone) || string.IsNullOrWhiteSpace(messageText))
        {
            return new IncomingWebhookResult(false, "Ignored", "Número de telefone ou texto vazio.");
        }

        var sanitizedText = messageText.Trim().ToLowerInvariant();

        // 1. Opt-out
        if (sanitizedText is "sair" or "stop" or "cancelar lembretes" or "descadastrar")
        {
            var pref = await notificationRepository.GetPreferenceByPhoneAsync(fromPhone, cancellationToken);
            if (pref is not null)
            {
                pref.OptOut("Solicitado via WhatsApp", now);
                await unitOfWork.ExecuteInTransactionAsync(async token =>
                {
                    await notificationRepository.SavePreferenceAsync(pref, token);
                    return true;
                }, cancellationToken);
            }

            return new IncomingWebhookResult(true, "OptOutRegistered", "Paciente optou por sair de notificações.");
        }

        // 2. Busca agendamento recente para o telefone
        var digitsOnly = new string(fromPhone.Where(char.IsDigit).ToArray());
        var pendingNotification = (await notificationRepository.GetPendingNotificationsAsync(now, cancellationToken))
            .Where(n => new string(n.RecipientPhone.Where(char.IsDigit).ToArray()).EndsWith(digitsOnly) || digitsOnly.EndsWith(new string(n.RecipientPhone.Where(char.IsDigit).ToArray())))
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefault();

        if (pendingNotification is null)
        {
            return new IncomingWebhookResult(false, "NoActiveNotification", "Nenhum lembrete recente localizado para este número.");
        }

        var appointment = await agendaRepository.FindAppointmentAsync(pendingNotification.AppointmentId, pendingNotification.ClinicId, cancellationToken);
        if (appointment is null)
        {
            return new IncomingWebhookResult(false, "AppointmentNotFound", "Agendamento correspondente não encontrado.");
        }

        if (sanitizedText is "1" or "sim" or "confirmo" or "confirmar")
        {
            await unitOfWork.ExecuteInTransactionAsync(async token =>
            {
                appointment.Confirm(now);
                pendingNotification.MarkAsReplied(messageText, now);
                await notificationRepository.UpdateNotificationAsync(pendingNotification, token);

                auditRepository.Add(AuditEvent.Record(
                    appointment.ClinicId,
                    "patient_webhook",
                    "Paciente (WhatsApp)",
                    "AppointmentConfirmedByPatient",
                    "appointments",
                    appointment.Id.ToString(),
                    now,
                    $"{{\"reply\":\"{messageText}\"}}"));

                return true;
            }, cancellationToken);

            return new IncomingWebhookResult(true, "Confirmed", "Consulta confirmada pelo paciente com sucesso.");
        }

        if (sanitizedText is "2" or "nao" or "não" or "cancelar" or "desmarcar")
        {
            await unitOfWork.ExecuteInTransactionAsync(async token =>
            {
                appointment.Cancel("Cancelado pelo paciente via WhatsApp", now);
                pendingNotification.MarkAsReplied(messageText, now);
                await notificationRepository.UpdateNotificationAsync(pendingNotification, token);

                auditRepository.Add(AuditEvent.Record(
                    appointment.ClinicId,
                    "patient_webhook",
                    "Paciente (WhatsApp)",
                    "AppointmentCancelledByPatient",
                    "appointments",
                    appointment.Id.ToString(),
                    now,
                    $"{{\"reply\":\"{messageText}\"}}"));

                return true;
            }, cancellationToken);

            return new IncomingWebhookResult(true, "Cancelled", "Consulta cancelada pelo paciente e horário liberado.");
        }

        return new IncomingWebhookResult(true, "UnrecognizedText", "Mensagem recebida sem ação correspondente.");
    }

    public async Task<IReadOnlyList<AppointmentNotificationResponse>> GetAppointmentHistoryAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default)
    {
        var items = await notificationRepository.GetByAppointmentIdAsync(appointmentId, cancellationToken);
        return items.Select(MapResponse).ToList();
    }

    private static AppointmentNotificationResponse MapResponse(AppointmentNotification n) =>
        new(
            n.Id,
            n.AppointmentId,
            n.PatientId,
            n.Channel.ToString().ToLowerInvariant(),
            n.RecipientPhone,
            n.TriggerType.ToString(),
            n.Status.ToString().ToLowerInvariant(),
            n.MessageBody,
            n.ResponsePayload,
            n.SentAt,
            n.RepliedAt,
            n.FailureReason,
            n.CreatedAt);
}
