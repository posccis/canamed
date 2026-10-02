using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;

namespace Canamed.Application.Queue;

/// <summary>
/// Fechamento do dia da agenda (RN-012 a RN-014 da SPEC-0005): marca como falta os agendamentos ativos
/// cujo horário já passou e como desistência as entradas de fila ainda em espera, informando o que
/// continua em atendimento.
/// </summary>
public sealed class DayClosingService(
    IAgendaRepository agendaRepository,
    IQueueRepository queueRepository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    /// <summary>Fecha o dia informado e devolve o resumo do que foi alterado.</summary>
    public async Task<CloseDayResponse> CloseAsync(CloseDayRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var today = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(timeProvider.GetUtcNow()).DateTime);

        // RN-014: não é possível fechar um dia que ainda não aconteceu.
        if (request.Date > today)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Dia futuro",
                "Não é possível fechar um dia que ainda não aconteceu.",
                "future-day-close");
        }

        var (fromUtc, toUtc) = AgendaTimeZone.LocalDayToUtcRange(request.Date);

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var appointments = await agendaRepository
                    .ListAppointmentsForUpdateAsync(actor.ClinicId, request.ProfessionalId, fromUtc, toUtc, token)
                    .ConfigureAwait(false);

                var entries = await queueRepository
                    .ListAsync(actor.ClinicId, request.Date, request.ProfessionalId, token)
                    .ConfigureAwait(false);

                var now = timeProvider.GetUtcNow();
                var noShowIds = new List<Guid>();

                // Agendamentos ativos cujo horário já passou viram falta (RN-012).
                foreach (var appointment in appointments.ToArray())
                {
                    if (appointment.Status is not (AppointmentStatus.Scheduled or AppointmentStatus.Confirmed)
                        || appointment.EndsAt >= now)
                    {
                        continue;
                    }

                    appointment.MarkNoShow(now);
                    noShowIds.Add(appointment.Id);

                    auditRepository.Add(AuditEvent.Record(
                        actor.ClinicId,
                        actor.UserId,
                        actor.Name,
                        AuditActions.AppointmentNoShow,
                        AuditResources.Appointments,
                        appointment.Id.ToString(),
                        now,
                        "{\"origin\":\"day-close\"}"));
                }

                var leftCount = 0;
                var appointmentEnds = appointments.ToDictionary(
                    static appointment => appointment.Id,
                    static appointment => appointment.EndsAt);

                foreach (var entry in entries)
                {
                    // RN-012: só é marcado como desistência quem ainda aguardava **e** cujo
                    // agendamento vinculado já terminou. Encaixes sem agendamento, chamadas e
                    // atendimentos em andamento continuam abertos e aparecem no resumo — fechar o dia
                    // não pode descartar quem ainda espera por um atendimento de hoje.
                    if (entry.Status != QueueStatus.Waiting
                        || entry.AppointmentId is null
                        || !appointmentEnds.TryGetValue(entry.AppointmentId.Value, out var endsAt)
                        || endsAt >= now)
                    {
                        continue;
                    }

                    entry.Leave(now);
                    leftCount++;

                    auditRepository.Add(AuditEvent.Record(
                        actor.ClinicId,
                        actor.UserId,
                        actor.Name,
                        AuditActions.QueueLeft,
                        AuditResources.QueueEntries,
                        entry.Id.ToString(),
                        now,
                        "{\"reason\":\"day-close\"}"));
                }

                var stillInService = entries.Count(entry => entry.Status is QueueStatus.Called or QueueStatus.InService);

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.AgendaDayClosed,
                    AuditResources.Agenda,
                    $"{request.Date:yyyy-MM-dd}",
                    now,
                    $"{{\"noShowAppointments\":{noShowIds.Count},\"leftQueueEntries\":{leftCount},\"stillInService\":{stillInService}}}"));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return new CloseDayResponse(request.Date, noShowIds.Count, leftCount, stillInService, noShowIds);
            },
            cancellationToken).ConfigureAwait(false);
    }
}
