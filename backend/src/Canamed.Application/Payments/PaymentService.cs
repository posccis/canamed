using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.Payments;

namespace Canamed.Application.Payments;

public sealed class PaymentService(
    IPaymentRepository paymentRepository,
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    IAuditRepository auditRepository,
    IAuditTrail auditTrail,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    public async Task<PaymentTransactionResponse> RecordPaymentAsync(
        RecordPaymentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.PaymentsWrite))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para registrar pagamentos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var appointment = await agendaRepository
                    .FindAppointmentAsync(request.AppointmentId, actor.ClinicId, token)
                    .ConfigureAwait(false);

                if (appointment is null)
                {
                    throw await NotFoundAsync(actor, AuditResources.Appointments, request.AppointmentId, token)
                        .ConfigureAwait(false);
                }

                var patient = await catalogRepository
                    .FindPatientAsync(appointment.PatientId, actor.ClinicId, token)
                    .ConfigureAwait(false);

                var patientName = patient?.Name ?? "Paciente";

                if (!Guid.TryParse(actor.UserId, out var operatorId) || operatorId == Guid.Empty)
                {
                    operatorId = Guid.NewGuid();
                }

                PaymentTransaction transaction;
                try
                {
                    transaction = PaymentTransaction.Record(
                        actor.ClinicId,
                        appointment.Id,
                        appointment.PatientId,
                        request.Amount,
                        request.PaymentMethod,
                        operatorId,
                        now,
                        request.CardBrand,
                        request.CardLastFourDigits,
                        request.Notes);
                }
                catch (ArgumentException ex)
                {
                    throw new CanamedException(
                        ProblemKind.Validation,
                        "Dados de pagamento inválidos",
                        ex.Message,
                        "invalid-payment-data");
                }

                await paymentRepository.AddAsync(transaction, token).ConfigureAwait(false);

                if (request.PaymentMethod == PaymentMethods.HealthPlanBilled && request.Amount == 0)
                {
                    appointment.MarkExempt(now);
                }
                else
                {
                    appointment.MarkPaid(now);
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.PaymentReceived,
                    AuditResources.Payments,
                    transaction.Id.ToString(),
                    now,
                    $"{{\"amount\":{transaction.Amount.ToString(System.Globalization.CultureInfo.InvariantCulture)},\"method\":\"{transaction.Method}\",\"appointmentId\":\"{appointment.Id}\"}}"));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(transaction, patientName);
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<PaymentTransactionResponse> RefundPaymentAsync(
        Guid paymentId,
        RefundPaymentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.PaymentsRefund))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para estornar pagamentos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var transaction = await paymentRepository
                    .GetByIdAsync(paymentId, actor.ClinicId, token)
                    .ConfigureAwait(false);

                if (transaction is null)
                {
                    throw await NotFoundAsync(actor, AuditResources.Payments, paymentId, token)
                        .ConfigureAwait(false);
                }

                if (!Guid.TryParse(actor.UserId, out var operatorId) || operatorId == Guid.Empty)
                {
                    operatorId = Guid.NewGuid();
                }

                try
                {
                    transaction.Refund(operatorId, request.Reason, now);
                }
                catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
                {
                    throw new CanamedException(
                        ProblemKind.Validation,
                        "Não foi possível estornar o pagamento",
                        ex.Message,
                        "refund-invalid");
                }

                await paymentRepository.UpdateAsync(transaction, token).ConfigureAwait(false);

                var appointment = await agendaRepository
                    .FindAppointmentAsync(transaction.AppointmentId, actor.ClinicId, token)
                    .ConfigureAwait(false);

                if (appointment is not null)
                {
                    appointment.MarkPaymentRefunded(now);
                }

                var patient = await catalogRepository
                    .FindPatientAsync(transaction.PatientId, actor.ClinicId, token)
                    .ConfigureAwait(false);

                var patientName = patient?.Name ?? "Paciente";

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.PaymentRefunded,
                    AuditResources.Payments,
                    transaction.Id.ToString(),
                    now,
                    $"{{\"reason\":\"{transaction.RefundReason}\",\"appointmentId\":\"{transaction.AppointmentId}\"}}"));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(transaction, patientName);
            },
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<PaymentTransactionResponse>> ListByAppointmentAsync(
        Guid appointmentId,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.PaymentsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para consultar pagamentos.", "permission-denied");
        }

        var appointment = await agendaRepository
            .FindAppointmentAsync(appointmentId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        if (appointment is null)
        {
            throw await NotFoundAsync(actor, AuditResources.Appointments, appointmentId, cancellationToken)
                .ConfigureAwait(false);
        }

        var patient = await catalogRepository
            .FindPatientAsync(appointment.PatientId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var patientName = patient?.Name ?? "Paciente";

        var transactions = await paymentRepository
            .ListByAppointmentAsync(appointmentId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        return [.. transactions.Select(t => Map(t, patientName))];
    }

    public async Task<DailyPaymentSummaryResponse> GetDailySummaryAsync(
        DateOnly? date,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        if (!actor.Has(Permissions.PaymentsRead))
        {
            throw new CanamedException(ProblemKind.Forbidden, "Acesso negado", "Você não tem permissão para consultar o resumo de pagamentos.", "permission-denied");
        }

        var now = timeProvider.GetUtcNow();
        var targetDate = date ?? DateOnly.FromDateTime(AgendaTimeZone.ToLocal(now).DateTime);

        var transactions = await paymentRepository
            .ListByDateAsync(targetDate, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var paidTransactions = transactions.Where(t => t.Status == PaymentStatuses.Paid).ToList();
        var refundCount = transactions.Count(t => t.Status == PaymentStatuses.Refunded);

        var cashTotal = paidTransactions.Where(t => t.Method == PaymentMethods.Cash).Sum(t => t.Amount);
        var pixTotal = paidTransactions.Where(t => t.Method == PaymentMethods.Pix).Sum(t => t.Amount);
        var debitTotal = paidTransactions.Where(t => t.Method == PaymentMethods.DebitCard).Sum(t => t.Amount);
        var creditTotal = paidTransactions.Where(t => t.Method == PaymentMethods.CreditCard).Sum(t => t.Amount);
        var healthPlanTotal = paidTransactions.Where(t => t.Method == PaymentMethods.HealthPlanBilled).Sum(t => t.Amount);
        var totalReceived = paidTransactions.Sum(t => t.Amount);

        return new DailyPaymentSummaryResponse(
            targetDate,
            totalReceived,
            cashTotal,
            pixTotal,
            debitTotal,
            creditTotal,
            healthPlanTotal,
            paidTransactions.Count,
            refundCount);
    }

    private static PaymentTransactionResponse Map(PaymentTransaction transaction, string patientName) =>
        new(
            transaction.Id,
            transaction.ClinicId,
            transaction.AppointmentId,
            transaction.PatientId,
            patientName,
            transaction.Amount,
            transaction.Method,
            transaction.Status,
            transaction.CardBrand,
            transaction.CardLastFourDigits,
            transaction.PaidAt,
            transaction.OperatorId,
            transaction.Notes,
            transaction.RefundedAt,
            transaction.RefundReason);

    private async Task<CanamedException> NotFoundAsync(
        CurrentActor actor,
        string resourceType,
        Guid resourceId,
        CancellationToken cancellationToken)
    {
        await auditTrail.RecordAsync(
            AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name,
                AuditActions.ClinicAccessDenied,
                resourceType,
                resourceId.ToString(),
                timeProvider.GetUtcNow(),
                "{\"reason\":\"registro fora do escopo da clínica\"}"),
            cancellationToken).ConfigureAwait(false);

        return new CanamedException(
            ProblemKind.NotFound,
            "Registro não encontrado",
            "Registro não encontrado.",
            "resource-not-found");
    }
}
