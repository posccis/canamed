using System.Text.Json;
using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;

namespace Canamed.Application.Agenda;

/// <summary>
/// Casos de uso da agenda de consultas (SPEC-0002): criação, consulta, remarcação, cancelamento e
/// bloqueio, sempre no escopo da clínica do usuário autenticado.
/// </summary>
public sealed class AgendaService(
    IAgendaRepository agendaRepository,
    ICatalogRepository catalogRepository,
    IClinicOperationRepository clinicOperationRepository,
    IQueueRepository queueRepository,
    IAuditRepository auditRepository,
    IAuditTrail auditTrail,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    private const string ConflictTypeAppointmentOverlap = "appointment-overlap";
    private const string ConflictTypeProfessionalBlocked = "professional-blocked";
    private const string ConflictTypeInvalidState = "appointment-state";

    /// <summary>F-001 — cria um agendamento validando conflito e bloqueio (RN-001, RN-003, RN-011).</summary>
    public async Task<AppointmentResponse> CreateAsync(
        CreateAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var appointmentType = await catalogRepository
                    .FindAppointmentTypeAsync(actor.ClinicId, request.AppointmentTypeId, token)
                    .ConfigureAwait(false);

                if (appointmentType is null)
                {
                    throw await NotFoundAsync(actor, "appointment_types", request.AppointmentTypeId, token)
                        .ConfigureAwait(false);
                }

                // RN-003 da SPEC-0004: tipo inativo não pode ser usado em novos agendamentos.
                if (!appointmentType.IsActive)
                {
                    throw await NotFoundAsync(actor, "appointment_types", request.AppointmentTypeId, token)
                        .ConfigureAwait(false);
                }

                await EnsureProfessionalExistsAsync(actor, request.ProfessionalId, token).ConfigureAwait(false);
                await EnsurePatientExistsAsync(actor, request.PatientId, token).ConfigureAwait(false);

                await agendaRepository
                    .LockProfessionalAgendaAsync(request.ProfessionalId, token)
                    .ConfigureAwait(false);

                var startsAt = request.StartsAt.ToUniversalTime();
                var range = TimeRange.FromStartAndMinutes(startsAt, appointmentType.DurationMinutes);

                var busy = await LoadBusyAgendaAsync(
                    actor.ClinicId,
                    request.ProfessionalId,
                    range.StartsAt,
                    range.EndsAt,
                    excludedAppointmentId: null,
                    token).ConfigureAwait(false);

                EnsureNotInPast(range);

                // As regras de sala e calendário são avaliadas antes do conflito de profissional para que
                // uma sala ocupada (RN-011) seja reportada como conflito de sala, e não de agenda.
                await EnsureSchedulingAllowedAsync(
                    actor,
                    range,
                    request.RoomId,
                    excludedAppointmentId: null,
                    token).ConfigureAwait(false);

                EnsureRangeIsFree(range, busy);

                var appointment = Appointment.Schedule(
                    actor.ClinicId,
                    request.ProfessionalId,
                    request.PatientId,
                    appointmentType.Id,
                    startsAt,
                    appointmentType.DurationMinutes,
                    timeProvider.GetUtcNow(),
                    request.RoomId);

                agendaRepository.AddAppointment(appointment);
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.AppointmentCreated,
                    AuditResources.Appointments,
                    appointment.Id.ToString(),
                    timeProvider.GetUtcNow(),
                    Details(("professionalId", appointment.ProfessionalId), ("startsAt", appointment.StartsAt))));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(appointment, await LoadNamesAsync(actor.ClinicId, [appointment], token).ConfigureAwait(false));
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>F-004 — consulta a agenda de um dia, opcionalmente de um profissional.</summary>
    public async Task<AgendaDayResponse> ListDayAsync(
        DateOnly date,
        Guid? professionalId,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var effectiveProfessionalId = ResolveProfessionalScope(actor, professionalId);
        var (fromUtc, toUtc) = AgendaTimeZone.LocalDayToUtcRange(date);

        var appointments = await agendaRepository
            .ListAppointmentsAsync(actor.ClinicId, effectiveProfessionalId, fromUtc, toUtc, cancellationToken)
            .ConfigureAwait(false);

        var blocks = await agendaRepository
            .ListBlocksAsync(actor.ClinicId, effectiveProfessionalId, fromUtc, toUtc, cancellationToken)
            .ConfigureAwait(false);

        var names = await LoadNamesAsync(actor.ClinicId, appointments, cancellationToken).ConfigureAwait(false);

        return new AgendaDayResponse(
            date,
            effectiveProfessionalId,
            [.. appointments.Select(appointment => Map(appointment, names))],
            [.. blocks.Select(MapBlock)]);
    }

    /// <summary>Detalha um agendamento do escopo da clínica.</summary>
    public async Task<AppointmentResponse> GetAsync(Guid appointmentId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var appointment = await FindOrFailAsync(actor, appointmentId, cancellationToken).ConfigureAwait(false);

        EnsureProfessionalScope(actor, appointment.ProfessionalId);

        return Map(appointment, await LoadNamesAsync(actor.ClinicId, [appointment], cancellationToken).ConfigureAwait(false));
    }

    /// <summary>F-002 — remarca o agendamento para um novo horário livre (RN-007, RN-008).</summary>
    public async Task<AppointmentResponse> RescheduleAsync(
        Guid appointmentId,
        RescheduleAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var appointment = await FindOrFailAsync(actor, appointmentId, token).ConfigureAwait(false);
                EnsureProfessionalScope(actor, appointment.ProfessionalId);

                if (!appointment.OccupiesAgenda)
                {
                    throw new CanamedException(
                        ProblemKind.Conflict,
                        "Agendamento não pode ser alterado",
                        "Este agendamento não pode mais ser alterado.",
                        ConflictTypeInvalidState);
                }

                var previousStartsAt = appointment.StartsAt;
                var newStartsAt = request.StartsAt.ToUniversalTime();
                var range = TimeRange.FromStartAndMinutes(newStartsAt, appointment.DurationMinutes);

                await agendaRepository
                    .LockProfessionalAgendaAsync(appointment.ProfessionalId, token)
                    .ConfigureAwait(false);

                var busy = await LoadBusyAgendaAsync(
                    actor.ClinicId,
                    appointment.ProfessionalId,
                    range.StartsAt,
                    range.EndsAt,
                    appointment.Id,
                    token).ConfigureAwait(false);

                EnsureNotInPast(range);

                await EnsureSchedulingAllowedAsync(
                    actor,
                    range,
                    request.RoomId ?? appointment.RoomId,
                    appointment.Id,
                    token).ConfigureAwait(false);

                EnsureRangeIsFree(range, busy);

                appointment.Reschedule(newStartsAt, timeProvider.GetUtcNow());

                // SPEC-0006: a sala pode ser trocada na remarcação; nula mantém a atual.
                if (request.RoomId is not null && request.RoomId != appointment.RoomId)
                {
                    appointment.ChangeRoom(request.RoomId, timeProvider.GetUtcNow());
                }

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.AppointmentRescheduled,
                    AuditResources.Appointments,
                    appointment.Id.ToString(),
                    timeProvider.GetUtcNow(),
                    Details(("previousStartsAt", previousStartsAt), ("startsAt", appointment.StartsAt))));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(appointment, await LoadNamesAsync(actor.ClinicId, [appointment], token).ConfigureAwait(false));
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>F-003 — cancela com motivo obrigatório, liberando o horário (RN-006, RN-008).</summary>
    public async Task<AppointmentResponse> CancelAsync(
        Guid appointmentId,
        CancelAppointmentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var appointment = await FindOrFailAsync(actor, appointmentId, token).ConfigureAwait(false);
                EnsureProfessionalScope(actor, appointment.ProfessionalId);

                if (string.IsNullOrWhiteSpace(request.Reason))
                {
                    throw new CanamedException(
                        ProblemKind.Validation,
                        "Motivo obrigatório",
                        "Informe o motivo do cancelamento.",
                        "cancellation-reason-required");
                }

                if (!appointment.OccupiesAgenda)
                {
                    throw new CanamedException(
                        ProblemKind.Conflict,
                        "Agendamento não pode ser alterado",
                        "Este agendamento não pode mais ser alterado.",
                        ConflictTypeInvalidState);
                }

                await agendaRepository
                    .LockProfessionalAgendaAsync(appointment.ProfessionalId, token)
                    .ConfigureAwait(false);

                appointment.Cancel(request.Reason, timeProvider.GetUtcNow());

                await CloseLinkedQueueEntryAsync(
                    actor,
                    appointment.Id,
                    QueueOutcome.Canceled,
                    timeProvider.GetUtcNow(),
                    token).ConfigureAwait(false);

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.AppointmentCancelled,
                    AuditResources.Appointments,
                    appointment.Id.ToString(),
                    timeProvider.GetUtcNow(),
                    Details(("reason", appointment.CancellationReason))));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(appointment, await LoadNamesAsync(actor.ClinicId, [appointment], token).ConfigureAwait(false));
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Bloqueia um intervalo da agenda do profissional (RN-011).</summary>
    public async Task<BlockResponse> CreateBlockAsync(
        Guid professionalId,
        CreateBlockRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                await EnsureProfessionalExistsAsync(actor, professionalId, token).ConfigureAwait(false);
                EnsureProfessionalScope(actor, professionalId);

                var startsAt = request.StartsAt.ToUniversalTime();
                var endsAt = request.EndsAt.ToUniversalTime();

                if (endsAt <= startsAt)
                {
                    throw new CanamedException(
                        ProblemKind.Validation,
                        "Intervalo inválido",
                        "O fim do bloqueio deve ser posterior ao início.",
                        "invalid-block-range");
                }

                var range = new TimeRange(startsAt, endsAt);

                await agendaRepository.LockProfessionalAgendaAsync(professionalId, token).ConfigureAwait(false);

                var overlapping = await agendaRepository
                    .ListAppointmentsAsync(actor.ClinicId, professionalId, range.StartsAt, range.EndsAt, token)
                    .ConfigureAwait(false);

                if (overlapping.Any(appointment => appointment.OccupiesAgenda && range.Overlaps(appointment.TimeRange)))
                {
                    throw new CanamedException(
                        ProblemKind.Conflict,
                        "Horário com agendamento",
                        "Já existem agendamentos neste intervalo. Cancele ou remarque antes de bloquear.",
                        ConflictTypeAppointmentOverlap);
                }

                var block = ProfessionalBlock.Create(
                    actor.ClinicId,
                    professionalId,
                    range.StartsAt,
                    range.EndsAt,
                    request.Reason,
                    timeProvider.GetUtcNow());

                agendaRepository.AddBlock(block);

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.ProfessionalBlockCreated,
                    AuditResources.ProfessionalBlocks,
                    block.Id.ToString(),
                    timeProvider.GetUtcNow(),
                    Details(
                        ("professionalId", block.ProfessionalId),
                        ("startsAt", block.StartsAt),
                        ("endsAt", block.EndsAt))));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return MapBlock(block);
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Registra que o paciente foi atendido (RN-005, RN-008).</summary>
    public Task<AppointmentResponse> MarkAttendedAsync(Guid appointmentId, CancellationToken cancellationToken) =>
        ChangeLifecycleAsync(
            appointmentId,
            static (appointment, now) => appointment.MarkAttended(now),
            AuditActions.AppointmentAttended,
            cancellationToken);

    /// <summary>Registra a falta do paciente (RN-005, RN-008).</summary>
    public Task<AppointmentResponse> MarkNoShowAsync(Guid appointmentId, CancellationToken cancellationToken) =>
        ChangeLifecycleAsync(
            appointmentId,
            static (appointment, now) => appointment.MarkNoShow(now),
            AuditActions.AppointmentNoShow,
            cancellationToken);

    private async Task<AppointmentResponse> ChangeLifecycleAsync(
        Guid appointmentId,
        Action<Appointment, DateTimeOffset> transition,
        string auditAction,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();

        return await unitOfWork.ExecuteInTransactionAsync(
            async token =>
            {
                var appointment = await FindOrFailAsync(actor, appointmentId, token).ConfigureAwait(false);
                EnsureProfessionalScope(actor, appointment.ProfessionalId);

                await agendaRepository
                    .LockProfessionalAgendaAsync(appointment.ProfessionalId, token)
                    .ConfigureAwait(false);

                var now = timeProvider.GetUtcNow();

                try
                {
                    transition(appointment, now);
                }
                catch (AppointmentStatusTransitionException)
                {
                    throw new CanamedException(
                        ProblemKind.Conflict,
                        "Agendamento não pode ser alterado",
                        "Este agendamento não pode mais ser alterado.",
                        ConflictTypeInvalidState);
                }

                // RN-007 da SPEC-0005: o desfecho na agenda fecha a entrada de fila correspondente.
                await CloseLinkedQueueEntryAsync(
                    actor,
                    appointment.Id,
                    auditAction == AuditActions.AppointmentAttended ? QueueOutcome.Attended : QueueOutcome.Left,
                    now,
                    token).ConfigureAwait(false);

                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    auditAction,
                    AuditResources.Appointments,
                    appointment.Id.ToString(),
                    now,
                    Details(("startsAt", appointment.StartsAt))));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return Map(
                    appointment,
                    await LoadNamesAsync(actor.ClinicId, [appointment], token).ConfigureAwait(false));
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Lista os bloqueios de agenda de um dia.</summary>
    public async Task<IReadOnlyList<BlockResponse>> ListBlocksAsync(
        Guid professionalId,
        DateOnly date,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        EnsureProfessionalScope(actor, professionalId);

        var (fromUtc, toUtc) = AgendaTimeZone.LocalDayToUtcRange(date);

        var blocks = await agendaRepository
            .ListBlocksAsync(actor.ClinicId, professionalId, fromUtc, toUtc, cancellationToken)
            .ConfigureAwait(false);

        return [.. blocks.Select(MapBlock)];
    }

    /// <summary>Desbloqueia um intervalo da agenda (RN-007 da SPEC-0004).</summary>
    public async Task RemoveBlockAsync(
        Guid professionalId,
        Guid blockId,
        CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        EnsureProfessionalScope(actor, professionalId);

        var block = await agendaRepository
            .FindBlockAsync(actor.ClinicId, professionalId, blockId, cancellationToken)
            .ConfigureAwait(false);

        if (block is null)
        {
            throw await NotFoundAsync(actor, AuditResources.ProfessionalBlocks, blockId, cancellationToken)
                .ConfigureAwait(false);
        }

        var now = timeProvider.GetUtcNow();

        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                agendaRepository.RemoveBlock(block);
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    AuditActions.ProfessionalBlockRemoved,
                    AuditResources.ProfessionalBlocks,
                    block.Id.ToString(),
                    now,
                    Details(
                        ("professionalId", block.ProfessionalId),
                        ("startsAt", block.StartsAt),
                        ("endsAt", block.EndsAt))));

                await agendaRepository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Carrega os intervalos ocupados de um profissional, separando agendamentos e bloqueios.</summary>
    private async Task<BusyAgenda> LoadBusyAgendaAsync(
        Guid clinicId,
        Guid professionalId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        Guid? excludedAppointmentId,
        CancellationToken cancellationToken)
    {
        var appointments = await agendaRepository
            .ListAppointmentsAsync(clinicId, professionalId, fromUtc, toUtc, cancellationToken)
            .ConfigureAwait(false);

        var blocks = await agendaRepository
            .ListBlocksAsync(clinicId, professionalId, fromUtc, toUtc, cancellationToken)
            .ConfigureAwait(false);

        var appointmentRanges = appointments
            .Where(static appointment => appointment.OccupiesAgenda)
            .Where(appointment => excludedAppointmentId is null || appointment.Id != excludedAppointmentId)
            .Select(static appointment => appointment.TimeRange)
            .ToArray();

        return new BusyAgenda(appointmentRanges, [.. blocks.Select(static block => block.TimeRange)]);
    }

    /// <summary>RN-001: não é possível agendar em data passada.</summary>
    private void EnsureNotInPast(TimeRange range)
    {
        if (range.StartsAt < timeProvider.GetUtcNow())
        {
            throw new CanamedException(
                ProblemKind.Validation,
                "Data no passado",
                "Não é possível agendar em data passada.",
                "past-scheduling");
        }
    }

    /// <summary>Aplica RN-003 e RN-011 e converte as violações em Problem Details de conflito.</summary>
    private void EnsureRangeIsFree(TimeRange range, BusyAgenda busy)
    {
        try
        {
            AgendaRules.EnsureNoOverlap(range, busy.Appointments);
        }
        catch (AppointmentConflictException exception)
        {
            throw ConflictWithSuggestions(
                "Horário ocupado",
                exception.Message,
                ConflictTypeAppointmentOverlap,
                range,
                busy.All);
        }

        try
        {
            AgendaRules.EnsureNotBlocked(range, busy.Blocks);
        }
        catch (ScheduleBlockedException exception)
        {
            throw ConflictWithSuggestions(
                "Profissional indisponível",
                exception.Message,
                ConflictTypeProfessionalBlocked,
                range,
                busy.All);
        }
    }

    private static CanamedException ConflictWithSuggestions(
        string title,
        string detail,
        string problemType,
        TimeRange range,
        IReadOnlyList<TimeRange> busyRanges) =>
        new(
            ProblemKind.Conflict,
            title,
            detail,
            problemType,
            new Dictionary<string, object?>
            {
                ["requestedStartsAt"] = range.StartsAt,
                ["suggestions"] = AgendaRules.SuggestFreeSlots(
                    range.StartsAt,
                    (int)range.Duration.TotalMinutes,
                    busyRanges),
            });

    /// <summary>
    /// Aplica as regras operacionais da SPEC-0006 ao horário candidato: sala válida (RN-010), feriado
    /// (RN-008), funcionamento da clínica (RN-007/RN-009) e conflito de sala (RN-011).
    /// </summary>
    private async Task EnsureSchedulingAllowedAsync(
        CurrentActor actor,
        TimeRange range,
        Guid? roomId,
        Guid? excludedAppointmentId,
        CancellationToken cancellationToken)
    {
        if (roomId is not null)
        {
            var room = await clinicOperationRepository
                .FindRoomAsync(actor.ClinicId, roomId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (room is null || !room.IsActive)
            {
                throw new CanamedException(
                    ProblemKind.Validation,
                    "Sala inválida",
                    "A sala informada não está disponível nesta clínica.",
                    "invalid-room");
            }
        }

        var localStart = AgendaTimeZone.ToLocal(range.StartsAt);
        var localEnd = AgendaTimeZone.ToLocal(range.EndsAt);
        var date = DateOnly.FromDateTime(localStart.DateTime);

        if (await clinicOperationRepository
                .ClosureDateExistsAsync(actor.ClinicId, date, cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Clínica fechada",
                "A clínica não funciona nesta data. Escolha outro dia.",
                "clinic-closed");
        }

        var operatingHours = await clinicOperationRepository
            .ListOperatingHoursAsync(actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        var hoursOfDay = operatingHours
            .Where(hour => hour.DayOfWeek == (int)localStart.DayOfWeek)
            .ToArray();

        if (hoursOfDay.Length > 0)
        {
            var sameLocalDay = localEnd.Date == localStart.Date;
            var withinHours = sameLocalDay && ClinicOperatingRules.IsWithinOperatingHours(
                TimeOnly.FromDateTime(localStart.DateTime),
                TimeOnly.FromDateTime(localEnd.DateTime),
                hoursOfDay);

            if (!withinHours)
            {
                throw new CanamedException(
                    ProblemKind.Conflict,
                    "Fora do horário de funcionamento",
                    "Este horário está fora do funcionamento da clínica.",
                    "outside-operating-hours");
            }
        }

        if (roomId is not null && await agendaRepository
                .RoomHasOverlappingAppointmentAsync(
                    actor.ClinicId,
                    roomId.Value,
                    range.StartsAt,
                    range.EndsAt,
                    excludedAppointmentId,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Sala ocupada",
                "Esta sala já está ocupada neste horário. Escolha outra sala ou outro horário.",
                "room-conflict");
        }
    }

    private async Task EnsureProfessionalExistsAsync(
        CurrentActor actor,
        Guid professionalId,
        CancellationToken cancellationToken)
    {
        var professional = await catalogRepository
            .FindProfessionalAsync(actor.ClinicId, professionalId, cancellationToken)
            .ConfigureAwait(false);

        // RN-005 da SPEC-0004: profissional inativo não recebe novos agendamentos nem bloqueios.
        if (professional is null || !professional.IsActive)
        {
            throw await NotFoundAsync(actor, "professionals", professionalId, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task EnsurePatientExistsAsync(
        CurrentActor actor,
        Guid patientId,
        CancellationToken cancellationToken)
    {
        var patient = await catalogRepository
            .FindPatientAsync(patientId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        // RN-006 da SPEC-0004: paciente inativo não recebe novos agendamentos.
        if (patient is null || !patient.IsActive)
        {
            throw await NotFoundAsync(actor, "patients", patientId, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task<Appointment> FindOrFailAsync(
        CurrentActor actor,
        Guid appointmentId,
        CancellationToken cancellationToken)
    {
        var appointment = await agendaRepository
            .FindAppointmentAsync(appointmentId, actor.ClinicId, cancellationToken)
            .ConfigureAwait(false);

        return appointment
            ?? throw await NotFoundAsync(actor, AuditResources.Appointments, appointmentId, cancellationToken)
                .ConfigureAwait(false);
    }

    /// <summary>
    /// ER-005: recurso de outra clínica responde 404 sem revelar a existência do registro, e a
    /// tentativa é registrada como evento de segurança.
    /// </summary>
    private async Task<CanamedException> NotFoundAsync(
        CurrentActor actor,
        string resourceType,
        Guid resourceId,
        CancellationToken cancellationToken)
    {
        // Escrito fora da transação: o rollback da operação não pode apagar o registro de segurança.
        await auditTrail.RecordAsync(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            AuditActions.ClinicAccessDenied,
            resourceType,
            resourceId.ToString(),
            timeProvider.GetUtcNow(),
            "{\"reason\":\"registro fora do escopo da clínica\"}"), cancellationToken).ConfigureAwait(false);

        return new CanamedException(
            ProblemKind.NotFound,
            "Registro não encontrado",
            "Registro não encontrado.",
            "resource-not-found");
    }

    /// <summary>
    /// Carrega os dados de referência usados na resposta (nomes de paciente, classificação do tipo de
    /// consulta e especialidade) em poucas consultas, sem N+1.
    /// </summary>
    private async Task<AgendaNames> LoadNamesAsync(
        Guid clinicId,
        IReadOnlyList<Appointment> appointments,
        CancellationToken cancellationToken)
    {
        if (appointments.Count is 0)
        {
            return AgendaNames.Empty;
        }

        var patientIds = appointments.Select(static appointment => appointment.PatientId).Distinct().ToArray();
        var typeIds = appointments.Select(static appointment => appointment.AppointmentTypeId).Distinct().ToArray();

        var patients = await catalogRepository
            .ListPatientsByIdsAsync(clinicId, patientIds, cancellationToken)
            .ConfigureAwait(false);

        var types = await catalogRepository
            .ListAppointmentTypesByIdsAsync(clinicId, typeIds, cancellationToken)
            .ConfigureAwait(false);

        var specialtyIds = types
            .Where(static type => type.SpecialtyId is not null)
            .Select(static type => type.SpecialtyId!.Value)
            .Distinct()
            .ToArray();

        var specialties = await catalogRepository
            .ListSpecialtiesByIdsAsync(clinicId, specialtyIds, cancellationToken)
            .ConfigureAwait(false);

        var specialtyNames = specialties.ToDictionary(static specialty => specialty.Id, static specialty => specialty.Name);

        var roomIds = appointments
            .Where(static appointment => appointment.RoomId is not null)
            .Select(static appointment => appointment.RoomId!.Value)
            .Distinct()
            .ToArray();

        var roomNames = new Dictionary<Guid, string>();

        if (roomIds.Length > 0)
        {
            var rooms = await clinicOperationRepository
                .ListRoomsAsync(clinicId, cancellationToken)
                .ConfigureAwait(false);

            roomNames = rooms
                .Where(room => roomIds.Contains(room.Id))
                .ToDictionary(static room => room.Id, static room => room.Name);
        }

        return new AgendaNames(
            patients.ToDictionary(static patient => patient.Id, static patient => patient.Name),
            types.ToDictionary(
                static type => type.Id,
                type => new AppointmentTypeDescriptor(
                    type.Name,
                    type.Category.ToStoredValue(),
                    type.Coverage.ToStoredValue(),
                    type.SpecialtyId is not null && specialtyNames.TryGetValue(type.SpecialtyId.Value, out var specialtyName)
                        ? specialtyName
                        : null)),
            roomNames);
    }

    private static AppointmentResponse Map(Appointment appointment, AgendaNames names)
    {
        var type = names.AppointmentTypes.TryGetValue(appointment.AppointmentTypeId, out var descriptor)
            ? descriptor
            : new AppointmentTypeDescriptor("Atendimento", "avulsa", "particular", null);

        return new AppointmentResponse(
            appointment.Id,
            appointment.ProfessionalId,
            appointment.PatientId,
            names.Patients.TryGetValue(appointment.PatientId, out var patientName) ? patientName : "Paciente",
            appointment.AppointmentTypeId,
            type.Name,
            type.Category,
            type.Coverage,
            type.SpecialtyName,
            appointment.RoomId,
            appointment.RoomId is not null && names.Rooms.TryGetValue(appointment.RoomId.Value, out var roomName)
                ? roomName
                : null,
            appointment.StartsAt,
            appointment.EndsAt,
            appointment.DurationMinutes,
            appointment.Status.ToStoredValue(),
            appointment.CancellationReason,
            appointment.CreatedAt,
            appointment.UpdatedAt);
    }

    private static BlockResponse MapBlock(ProfessionalBlock block) =>
        new(block.Id, block.ProfessionalId, block.StartsAt, block.EndsAt);

    private static string Details(params (string Key, object? Value)[] values) =>
        JsonSerializer.Serialize(values.ToDictionary(item => item.Key, item => item.Value));

    private Guid? ResolveProfessionalScope(CurrentActor actor, Guid? requestedProfessionalId)
    {
        if (actor.Has(Permissions.AgendaRead))
        {
            return requestedProfessionalId;
        }

        if (actor.ProfessionalId is null)
        {
            throw new CanamedException(
                ProblemKind.Forbidden,
                "Acesso negado",
                "Você não tem permissão para consultar a agenda.",
                "permission-denied");
        }

        EnsureProfessionalScope(actor, requestedProfessionalId ?? actor.ProfessionalId.Value);

        return actor.ProfessionalId;
    }

    /// <summary>
    /// Isolamento por profissional: quem tem <c>agenda:read</c> (gestor, recepção) enxerga toda a
    /// clínica; quem tem apenas <c>agenda:read:own</c> acessa somente a própria agenda.
    /// </summary>
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
            "Você não tem permissão para acessar a agenda deste profissional.",
            "permission-denied");
    }

    /// <summary>
    /// Fecha a entrada de fila vinculada ao agendamento quando a agenda define o desfecho
    /// (RN-007 da SPEC-0005). Sem entrada aberta, nada acontece.
    /// </summary>
    private async Task CloseLinkedQueueEntryAsync(
        CurrentActor actor,
        Guid appointmentId,
        QueueOutcome outcome,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var entry = await queueRepository
            .FindOpenByAppointmentAsync(actor.ClinicId, appointmentId, cancellationToken)
            .ConfigureAwait(false);

        if (entry is null)
        {
            return;
        }

        var auditAction = outcome switch
        {
            QueueOutcome.Attended => AuditActions.QueueCompleted,
            QueueOutcome.Left => AuditActions.QueueLeft,
            _ => AuditActions.QueueCanceled,
        };

        switch (outcome)
        {
            case QueueOutcome.Attended:
                entry.CompleteFromAgenda(now);
                break;
            case QueueOutcome.Left:
                entry.LeaveFromAgenda(now);
                break;
            default:
                entry.CancelFromAgenda(now);
                break;
        }

        auditRepository.Add(AuditEvent.Record(
            actor.ClinicId,
            actor.UserId,
            actor.Name,
            auditAction,
            AuditResources.QueueEntries,
            entry.Id.ToString(),
            now,
            "{\"origin\":\"agenda\"}"));
    }

    /// <summary>Desfecho da agenda que fecha a entrada de fila vinculada.</summary>
    private enum QueueOutcome
    {
        Attended,
        Left,
        Canceled,
    }

    /// <summary>Nomes resolvidos para a montagem das respostas.</summary>
    private sealed record AgendaNames(
        IReadOnlyDictionary<Guid, string> Patients,
        IReadOnlyDictionary<Guid, AppointmentTypeDescriptor> AppointmentTypes,
        IReadOnlyDictionary<Guid, string> Rooms)
    {
        public static AgendaNames Empty { get; } = new(
            new Dictionary<Guid, string>(),
            new Dictionary<Guid, AppointmentTypeDescriptor>(),
            new Dictionary<Guid, string>());
    }

    /// <summary>Classificação vigente do tipo de consulta usada na resposta do agendamento.</summary>
    private sealed record AppointmentTypeDescriptor(
        string Name,
        string Category,
        string Coverage,
        string? SpecialtyName);

    /// <summary>Intervalos ocupados de um profissional no período consultado.</summary>
    private sealed record BusyAgenda(IReadOnlyList<TimeRange> Appointments, IReadOnlyList<TimeRange> Blocks)
    {
        public IReadOnlyList<TimeRange> All { get; } = [.. Appointments, .. Blocks];
    }
}
