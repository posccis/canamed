using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;

namespace Canamed.Application.Queue;

/// <summary>
/// Fila de espera e ciclo de atendimento (SPEC-0005): check-in, chamada, início, conclusão e
/// desistência, sempre no escopo da clínica e do profissional do usuário.
/// </summary>
public sealed class QueueService(
    IQueueRepository queueRepository,
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    IAuditRepository auditRepository,
    IAuditTrail auditTrail,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    /// <summary>F-001 e F-003 — registra a chegada do paciente na fila do dia.</summary>
    public async Task<QueueEntryResponse> CheckInAsync(
        CheckInRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var now = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(now).DateTime);
        var priority = ParsePriority(request.Priority);

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                Guid professionalId;
                Guid patientId;
                Guid? appointmentId = null;

                if (request.AppointmentId is not null)
                {
                    var appointment = await agendaRepository
                        .FindAppointmentAsync(request.AppointmentId.Value, actor.ClinicId, token)
                        .ConfigureAwait(false);

                    if (appointment is null)
                    {
                        throw await NotFoundAsync(actor, AuditResources.Appointments, request.AppointmentId.Value, token)
                            .ConfigureAwait(false);
                    }

                    var appointmentDay = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(appointment.StartsAt).DateTime);

                    // RN-010: a fila é do dia.
                    if (appointmentDay != today)
                    {
                        throw new CanamedException(
                            ProblemKind.Validation,
                            "Check-in fora do dia",
                            "O check-in é sempre para o dia de hoje.",
                            "queue-not-today");
                    }

                    if (await queueRepository
                            .FindOpenByAppointmentAsync(actor.ClinicId, appointment.Id, token)
                            .ConfigureAwait(false) is not null)
                    {
                        throw new CanamedException(
                            ProblemKind.Conflict,
                            "Paciente já está na fila",
                            "Este agendamento já está na fila.",
                            "queue-entry-conflict");
                    }

                    EnsureProfessionalScope(actor, appointment.ProfessionalId);

                    professionalId = appointment.ProfessionalId;
                    patientId = appointment.PatientId;
                    appointmentId = appointment.Id;
                }
                else
                {
                    if (request.PatientId is null || request.ProfessionalId is null)
                    {
                        throw new CanamedException(
                            ProblemKind.Validation,
                            "Encaixe incompleto",
                            "Informe o paciente e o profissional.",
                            "missing-check-in-data");
                    }

                    EnsureProfessionalScope(actor, request.ProfessionalId.Value);

                    var professional = await catalogRepository
                        .FindProfessionalAsync(actor.ClinicId, request.ProfessionalId.Value, token)
                        .ConfigureAwait(false);

                    if (professional is null || !professional.IsActive)
                    {
                        throw await NotFoundAsync(actor, AuditResources.Professionals, request.ProfessionalId.Value, token)
                            .ConfigureAwait(false);
                    }

                    var patient = await catalogRepository
                        .FindPatientAsync(request.PatientId.Value, actor.ClinicId, token)
                        .ConfigureAwait(false);

                    if (patient is null || !patient.IsActive)
                    {
                        throw await NotFoundAsync(actor, AuditResources.Patients, request.PatientId.Value, token)
                            .ConfigureAwait(false);
                    }

                    professionalId = professional.Id;
                    patientId = patient.Id;
                }

                var entry = QueueEntry.CheckIn(
                    actor.ClinicId,
                    professionalId,
                    patientId,
                    appointmentId,
                    today,
                    priority,
                    now);

                queueRepository.Add(entry);
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.QueueCheckedIn,
                    AuditResources.QueueEntries,
                    entry.Id.ToString(),
                    now,
                    $"{{\"professionalId\":\"{entry.ProfessionalId}\",\"priority\":\"{entry.Priority.ToStoredValue()}\"}}"));

                // RN-003 também no banco: o repositório traduz a violação do índice único parcial
                // (duas entradas abertas para o mesmo agendamento) em conflito de negócio.
                await queueRepository.SaveChangesAsync(token).ConfigureAwait(false);

                var entries = await queueRepository
                    .ListAsync(actor.ClinicId, today, null, token)
                    .ConfigureAwait(false);

                var references = await LoadReferencesAsync(entry.ClinicId, [entry], token).ConfigureAwait(false);

                return Map(entry, QueueOrdering.PositionOf(QueueOrdering.Sort(entries), entry), references, now);
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>F-002 e F-004 — lista a fila do dia ordenada por prioridade e chegada.</summary>
    public async Task<QueueDayResponse> ListAsync(
        DateOnly? date,
        Guid? professionalId,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var targetDate = date ?? DateOnly.FromDateTime(AgendaTimeZone.ToLocal(timeProvider.GetUtcNow()).DateTime);
        var effectiveProfessionalId = ResolveProfessionalScope(actor, professionalId);

        var entries = await queueRepository
            .ListAsync(actor.ClinicId, targetDate, effectiveProfessionalId, cancellationToken)
            .ConfigureAwait(false);

        var ordered = QueueOrdering.Sort(entries);
        var references = await LoadReferencesAsync(actor.ClinicId, ordered, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        return new QueueDayResponse(
            targetDate,
            effectiveProfessionalId,
            [.. ordered.Select(entry => Map(entry, QueueOrdering.PositionOf(ordered, entry), references, now))]);
    }

    /// <summary>Chama o próximo paciente (RN-005).</summary>
    public Task<QueueEntryResponse> CallAsync(Guid entryId, CancellationToken cancellationToken) =>
        TransitionAsync(entryId, static (entry, now) => entry.Call(now), AuditActions.QueueCalled, cancellationToken);

    /// <summary>Inicia o atendimento (RN-005).</summary>
    public Task<QueueEntryResponse> StartAsync(Guid entryId, CancellationToken cancellationToken) =>
        TransitionAsync(entryId, static (entry, now) => entry.Start(now), AuditActions.QueueStarted, cancellationToken);

    /// <summary>
    /// Conclui o atendimento na fila e marca o agendamento vinculado como atendido (RN-006), na mesma
    /// transação.
    /// </summary>
    public Task<QueueEntryResponse> CompleteAsync(Guid entryId, CancellationToken cancellationToken) =>
        TransitionAsync(
            entryId,
            static (entry, now) => entry.Complete(now),
            AuditActions.QueueCompleted,
            cancellationToken,
            completeAppointment: true);

    /// <summary>Registra a desistência do paciente (F-004).</summary>
    public Task<QueueEntryResponse> LeaveAsync(Guid entryId, CancellationToken cancellationToken) =>
        TransitionAsync(entryId, static (entry, now) => entry.Leave(now), AuditActions.QueueLeft, cancellationToken);

    private async Task<QueueEntryResponse> TransitionAsync(
        Guid entryId,
        Action<QueueEntry, DateTimeOffset> transition,
        string auditAction,
        CancellationToken cancellationToken,
        bool completeAppointment = false)
    {
        var actor = actorAccessor.RequireActor();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var entry = await queueRepository.FindAsync(actor.ClinicId, entryId, token).ConfigureAwait(false)
                    ?? throw await NotFoundAsync(actor, AuditResources.QueueEntries, entryId, token).ConfigureAwait(false);

                EnsureProfessionalScope(actor, entry.ProfessionalId);

                var now = timeProvider.GetUtcNow();

                try
                {
                    transition(entry, now);
                }
                catch (QueueTransitionException exception)
                {
                    throw new CanamedException(
                        ProblemKind.Conflict,
                        "Transição inválida",
                        exception.Message,
                        "queue-invalid-state");
                }

                if (completeAppointment && entry.AppointmentId is not null)
                {
                    var appointment = await agendaRepository
                        .FindAppointmentAsync(entry.AppointmentId.Value, actor.ClinicId, token)
                        .ConfigureAwait(false);

                    if (appointment is not null
                        && appointment.Status is AppointmentStatus.Scheduled or AppointmentStatus.Confirmed)
                    {
                        appointment.MarkAttended(now);

                        auditRepository.Add(AuditEvent.Record(
                            actor.ClinicId,
                            actor.UserId,
                            actor.Name,
                            AuditActions.AppointmentAttended,
                            AuditResources.Appointments,
                            appointment.Id.ToString(),
                            now,
                            "{\"origin\":\"queue\"}"));
                    }
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    auditAction,
                    AuditResources.QueueEntries,
                    entry.Id.ToString(),
                    now,
                    $"{{\"status\":\"{entry.Status.ToStoredValue()}\"}}"));

                await queueRepository.SaveChangesAsync(token).ConfigureAwait(false);

                var entries = await queueRepository
                    .ListAsync(actor.ClinicId, entry.QueueDate, null, token)
                    .ConfigureAwait(false);

                var position = QueueOrdering.PositionOf(QueueOrdering.Sort(entries), entry);
                var references = await LoadReferencesAsync(actor.ClinicId, [entry], token).ConfigureAwait(false);

                return Map(entry, position, references, now);
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Carrega nomes de pacientes e horários dos agendamentos vinculados em poucas consultas.</summary>
    private async Task<QueueReferences> LoadReferencesAsync(
        Guid clinicId,
        IReadOnlyList<QueueEntry> entries,
        CancellationToken cancellationToken)
    {
        if (entries.Count is 0)
        {
            return QueueReferences.Empty;
        }

        var patientIds = entries.Select(static entry => entry.PatientId).Distinct().ToArray();

        var patients = await catalogRepository
            .ListPatientsByIdsAsync(clinicId, patientIds, cancellationToken)
            .ConfigureAwait(false);

        var appointmentIds = entries
            .Where(static entry => entry.AppointmentId is not null)
            .Select(static entry => entry.AppointmentId!.Value)
            .Distinct()
            .ToArray();

        var appointments = await agendaRepository
            .ListAppointmentsByIdsAsync(clinicId, appointmentIds, cancellationToken)
            .ConfigureAwait(false);

        return new QueueReferences(
            patients.ToDictionary(static patient => patient.Id, static patient => patient.Name),
            appointments.ToDictionary(static appointment => appointment.Id, static appointment => appointment.StartsAt));
    }

    private static QueueEntryResponse Map(
        QueueEntry entry,
        int? position,
        QueueReferences references,
        DateTimeOffset now) =>
        new(
            entry.Id,
            entry.AppointmentId,
            entry.PatientId,
            references.PatientNames.TryGetValue(entry.PatientId, out var name) ? name : "Paciente",
            entry.ProfessionalId,
            entry.Priority.ToStoredValue(),
            entry.Status.ToStoredValue(),
            position,
            entry.ArrivedAt,
            entry.CalledAt,
            entry.StartedAt,
            entry.FinishedAt,
            (int)entry.WaitingTime(now).TotalMinutes,
            entry.ServiceTime is { } service ? (int)service.TotalMinutes : null,
            entry.AppointmentId is not null && references.AppointmentStarts.TryGetValue(entry.AppointmentId.Value, out var startsAt)
                ? startsAt
                : null);

    private static QueuePriority ParsePriority(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return QueuePriority.Normal;
        }

        try
        {
            return QueueMap.PriorityFromStoredValue(value.Trim().ToLowerInvariant());
        }
        catch (ArgumentOutOfRangeException)
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Prioridade inválida",
                $"A prioridade deve ser {string.Join(" ou ", QueueMap.PriorityValues)}.",
                "invalid-priority");
        }
    }

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

    private Guid? ResolveProfessionalScope(CurrentActor actor, Guid? requestedProfessionalId)
    {
        if (actor.Has(Permissions.AgendaRead) || actor.Has(Permissions.AgendaWrite))
        {
            return requestedProfessionalId;
        }

        if (actor.ProfessionalId is null)
        {
            throw new CanamedException(
                ProblemKind.Forbidden,
                "Acesso negado",
                "Você não tem permissão para consultar a fila.",
                "permission-denied");
        }

        EnsureProfessionalScope(actor, requestedProfessionalId ?? actor.ProfessionalId.Value);

        return actor.ProfessionalId;
    }

    private static void EnsureProfessionalScope(CurrentActor actor, Guid professionalId)
    {
        if (actor.Has(Permissions.AgendaRead) || actor.Has(Permissions.AgendaWrite))
        {
            return;
        }

        if (actor.Has(Permissions.AgendaReadOwn) && actor.ProfessionalId == professionalId)
        {
            return;
        }

        throw new CanamedException(
            ProblemKind.Forbidden,
            "Acesso negado",
            "Você não tem permissão para acessar a fila deste profissional.",
            "permission-denied");
    }

    /// <summary>Dados de referência usados nas respostas da fila.</summary>
    private sealed record QueueReferences(
        IReadOnlyDictionary<Guid, string> PatientNames,
        IReadOnlyDictionary<Guid, DateTimeOffset> AppointmentStarts)
    {
        public static QueueReferences Empty { get; } = new(
            new Dictionary<Guid, string>(),
            new Dictionary<Guid, DateTimeOffset>());
    }
}
