using System.Globalization;
using Canamed.Application.Abstractions;
using Canamed.Application.Auditing;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.Clinics;

namespace Canamed.Application.Clinics;

/// <summary>
/// Gestão operacional da clínica (SPEC-0006): convênios, salas, horário de funcionamento e feriados.
/// </summary>
public sealed class ClinicOperationService(
    IClinicOperationRepository repository,
    IAuditRepository auditRepository,
    IUnitOfWork unitOfWork,
    ICurrentActorAccessor actorAccessor,
    TimeProvider timeProvider)
{
    // ---------- Convênios ----------

    /// <summary>Lista os convênios da clínica.</summary>
    public async Task<IReadOnlyList<HealthPlanResponse>> ListHealthPlansAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var plans = await repository.ListHealthPlansAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);

        return [.. plans.Select(MapHealthPlan)];
    }

    /// <summary>Cria um convênio (RN-001).</summary>
    public async Task<HealthPlanResponse> CreateHealthPlanAsync(
        CreateHealthPlanRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name, "Informe o nome do convênio.");

        await EnsureNameIsFreeAsync(
            () => repository.HealthPlanNameExistsAsync(actor.ClinicId, name, null, cancellationToken)).ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        var healthPlan = HealthPlan.Create(actor.ClinicId, name, request.AnsCode, now);

        repository.AddHealthPlan(healthPlan);

        await CommitAsync(
            actor,
            healthPlan.Id,
            AuditActions.HealthPlanCreated,
            AuditResources.HealthPlans,
            now,
            cancellationToken).ConfigureAwait(false);

        return MapHealthPlan(healthPlan);
    }

    /// <summary>Altera um convênio.</summary>
    public async Task<HealthPlanResponse> UpdateHealthPlanAsync(
        Guid healthPlanId,
        UpdateHealthPlanRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var healthPlan = await RequireHealthPlanAsync(actor.ClinicId, healthPlanId, cancellationToken).ConfigureAwait(false);
        var name = RequireName(request.Name, "Informe o nome do convênio.");

        await EnsureNameIsFreeAsync(
            () => repository.HealthPlanNameExistsAsync(actor.ClinicId, name, healthPlanId, cancellationToken))
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();

        healthPlan.Update(name, request.AnsCode, now);

        await CommitAsync(
            actor,
            healthPlan.Id,
            AuditActions.HealthPlanUpdated,
            AuditResources.HealthPlans,
            now,
            cancellationToken).ConfigureAwait(false);

        return MapHealthPlan(healthPlan);
    }

    /// <summary>Desativa um convênio (RN-003).</summary>
    public async Task DeactivateHealthPlanAsync(Guid healthPlanId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var healthPlan = await RequireHealthPlanAsync(actor.ClinicId, healthPlanId, cancellationToken).ConfigureAwait(false);

        if (await repository
                .HealthPlanHasActivePatientsAsync(actor.ClinicId, healthPlanId, cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Convênio em uso",
                "Há pacientes ativos vinculados a este convênio. Desvincule antes de desativá-lo.",
                "health-plan-in-use");
        }

        var now = timeProvider.GetUtcNow();

        healthPlan.Deactivate(now);

        await CommitAsync(
            actor,
            healthPlan.Id,
            AuditActions.HealthPlanDeactivated,
            AuditResources.HealthPlans,
            now,
            cancellationToken).ConfigureAwait(false);
    }

    /// <summary>Reativa um convênio.</summary>
    public async Task ActivateHealthPlanAsync(Guid healthPlanId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var healthPlan = await RequireHealthPlanAsync(actor.ClinicId, healthPlanId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        healthPlan.Activate(now);

        await CommitAsync(
            actor,
            healthPlan.Id,
            AuditActions.HealthPlanActivated,
            AuditResources.HealthPlans,
            now,
            cancellationToken).ConfigureAwait(false);
    }

    // ---------- Salas ----------

    /// <summary>Lista as salas da clínica.</summary>
    public async Task<IReadOnlyList<RoomResponse>> ListRoomsAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var rooms = await repository.ListRoomsAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);

        return [.. rooms.Select(MapRoom)];
    }

    /// <summary>Cria uma sala (RN-002).</summary>
    public async Task<RoomResponse> CreateRoomAsync(CreateRoomRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var name = RequireName(request.Name, "Informe o nome da sala.");

        await EnsureNameIsFreeAsync(
            () => repository.RoomNameExistsAsync(actor.ClinicId, name, null, cancellationToken)).ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();
        var room = Room.Create(actor.ClinicId, name, now);

        repository.AddRoom(room);

        await CommitAsync(actor, room.Id, AuditActions.RoomCreated, AuditResources.Rooms, now, cancellationToken)
            .ConfigureAwait(false);

        return MapRoom(room);
    }

    /// <summary>Renomeia uma sala.</summary>
    public async Task<RoomResponse> RenameRoomAsync(
        Guid roomId,
        RenameRoomRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var room = await RequireRoomAsync(actor.ClinicId, roomId, cancellationToken).ConfigureAwait(false);
        var name = RequireName(request.Name, "Informe o nome da sala.");

        await EnsureNameIsFreeAsync(() => repository.RoomNameExistsAsync(actor.ClinicId, name, roomId, cancellationToken))
            .ConfigureAwait(false);

        var now = timeProvider.GetUtcNow();

        room.Rename(name, now);

        await CommitAsync(actor, room.Id, AuditActions.RoomUpdated, AuditResources.Rooms, now, cancellationToken)
            .ConfigureAwait(false);

        return MapRoom(room);
    }

    /// <summary>Desativa uma sala (RN-004).</summary>
    public async Task DeactivateRoomAsync(Guid roomId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var room = await RequireRoomAsync(actor.ClinicId, roomId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        if (await repository
                .RoomHasFutureAppointmentsAsync(actor.ClinicId, roomId, now, cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Sala em uso",
                "Esta sala possui agendamentos futuros. Remarque ou cancele antes de desativá-la.",
                "room-in-use");
        }

        room.Deactivate(now);

        await CommitAsync(actor, room.Id, AuditActions.RoomDeactivated, AuditResources.Rooms, now, cancellationToken)
            .ConfigureAwait(false);
    }

    /// <summary>Reativa uma sala.</summary>
    public async Task ActivateRoomAsync(Guid roomId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var room = await RequireRoomAsync(actor.ClinicId, roomId, cancellationToken).ConfigureAwait(false);
        var now = timeProvider.GetUtcNow();

        room.Activate(now);

        await CommitAsync(actor, room.Id, AuditActions.RoomActivated, AuditResources.Rooms, now, cancellationToken)
            .ConfigureAwait(false);
    }

    // ---------- Funcionamento ----------

    /// <summary>Lista o horário de funcionamento da clínica.</summary>
    public async Task<IReadOnlyList<OperatingHourResponse>> ListOperatingHoursAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var hours = await repository.ListOperatingHoursAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);

        return [.. hours.OrderBy(hour => hour.DayOfWeek).ThenBy(hour => hour.StartsAt).Select(MapOperatingHour)];
    }

    /// <summary>Substitui todo o funcionamento da clínica, validando sobreposição (RN-005).</summary>
    public async Task<IReadOnlyList<OperatingHourResponse>> ReplaceOperatingHoursAsync(
        ReplaceOperatingHoursRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var now = timeProvider.GetUtcNow();
        var windows = ParseWindows(request.Hours);
        var newHours = windows
            .Select(window => OperatingHour.Create(actor.ClinicId, window.DayOfWeek, window.StartsAt, window.EndsAt, now))
            .ToArray();

        try
        {
            ClinicOperatingRules.EnsureNoOverlap(newHours);
        }
        catch (OperatingHoursOverlapException exception)
        {
            throw InvalidOperatingHours(exception.Message);
        }

        var existing = await repository.ListOperatingHoursAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);

        repository.RemoveOperatingHours(existing);

        foreach (var hour in newHours)
        {
            repository.AddOperatingHour(hour);
        }

        await CommitAsync(
            actor,
            actor.ClinicId,
            AuditActions.OperatingHoursReplaced,
            AuditResources.OperatingHours,
            now,
            cancellationToken).ConfigureAwait(false);

        return
        [
            .. newHours
                .OrderBy(hour => hour.DayOfWeek)
                .ThenBy(hour => hour.StartsAt)
                .Select(MapOperatingHour),
        ];
    }

    // ---------- Feriados ----------

    /// <summary>Lista os feriados/exceções da clínica.</summary>
    public async Task<IReadOnlyList<ClinicClosureResponse>> ListClosuresAsync(CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var closures = await repository.ListClosuresAsync(actor.ClinicId, cancellationToken).ConfigureAwait(false);

        return [.. closures.OrderBy(closure => closure.Date).Select(MapClosure)];
    }

    /// <summary>Cria um feriado/exceção (RN-006).</summary>
    public async Task<ClinicClosureResponse> CreateClosureAsync(
        CreateClinicClosureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var actor = actorAccessor.RequireActor();
        var description = RequireName(request.Description, "Informe a descrição do feriado.");

        if (await repository
                .ClosureDateExistsAsync(actor.ClinicId, request.Date, cancellationToken)
                .ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Data já cadastrada",
                "Já existe um feriado ou exceção nesta data.",
                "duplicated-name");
        }

        var now = timeProvider.GetUtcNow();
        var closure = ClinicClosure.Create(actor.ClinicId, request.Date, description, now);

        repository.AddClosure(closure);

        await CommitAsync(
            actor,
            closure.Id,
            AuditActions.ClinicClosureCreated,
            AuditResources.ClinicClosures,
            now,
            cancellationToken).ConfigureAwait(false);

        return MapClosure(closure);
    }

    /// <summary>Remove um feriado/exceção.</summary>
    public async Task RemoveClosureAsync(Guid closureId, CancellationToken cancellationToken)
    {
        var actor = actorAccessor.RequireActor();
        var closure = await repository.FindClosureAsync(actor.ClinicId, closureId, cancellationToken).ConfigureAwait(false)
            ?? throw NotFound();
        var now = timeProvider.GetUtcNow();

        repository.RemoveClosure(closure);

        await CommitAsync(
            actor,
            closure.Id,
            AuditActions.ClinicClosureRemoved,
            AuditResources.ClinicClosures,
            now,
            cancellationToken).ConfigureAwait(false);
    }

    // ---------- Auxiliares ----------

    private static List<OperatingWindow> ParseWindows(IReadOnlyList<OperatingHourRequest>? hours)
    {
        if (hours is null || hours.Count is 0)
        {
            return [];
        }

        var parsed = new List<OperatingWindow>(hours.Count);

        foreach (var item in hours)
        {
            if (item.DayOfWeek is < 0 or > 6)
            {
                throw InvalidOperatingHours("O dia da semana deve estar entre 0 (domingo) e 6 (sábado).");
            }

            if (!TryParseTime(item.StartsAt, out var startsAt) || !TryParseTime(item.EndsAt, out var endsAt))
            {
                throw InvalidOperatingHours("Informe os horários no formato HH:mm.");
            }

            if (endsAt <= startsAt)
            {
                throw InvalidOperatingHours("O fim do funcionamento deve ser posterior ao início.");
            }

            parsed.Add(new OperatingWindow((DayOfWeek)item.DayOfWeek, startsAt, endsAt));
        }

        return parsed;
    }

    private readonly record struct OperatingWindow(DayOfWeek DayOfWeek, TimeOnly StartsAt, TimeOnly EndsAt);

    private static bool TryParseTime(string? value, out TimeOnly time) =>
        TimeOnly.TryParseExact(value?.Trim(), "HH:mm", CultureInfo.InvariantCulture, DateTimeStyles.None, out time);

    private async Task CommitAsync(
        CurrentActor actor,
        Guid resourceId,
        string action,
        string resourceType,
        DateTimeOffset now,
        CancellationToken cancellationToken) =>
        await unitOfWork.ExecuteInTransactionAsync<object?>(
            async token =>
            {
                auditRepository.Add(AuditEvent.Record(
                    actor.ClinicId,
                    actor.UserId,
                    actor.Name,
                    action,
                    resourceType,
                    resourceId.ToString(),
                    now));

                await repository.SaveChangesAsync(token).ConfigureAwait(false);

                return null;
            },
            cancellationToken).ConfigureAwait(false);

    private async Task<HealthPlan> RequireHealthPlanAsync(
        Guid clinicId,
        Guid healthPlanId,
        CancellationToken cancellationToken) =>
        await repository.FindHealthPlanAsync(clinicId, healthPlanId, cancellationToken).ConfigureAwait(false)
        ?? throw NotFound();

    private async Task<Room> RequireRoomAsync(Guid clinicId, Guid roomId, CancellationToken cancellationToken) =>
        await repository.FindRoomAsync(clinicId, roomId, cancellationToken).ConfigureAwait(false)
        ?? throw NotFound();

    private static async Task EnsureNameIsFreeAsync(Func<Task<bool>> existsAsync)
    {
        if (await existsAsync().ConfigureAwait(false))
        {
            throw new CanamedException(
                ProblemKind.Conflict,
                "Nome já cadastrado",
                "Já existe um registro com este nome.",
                "duplicated-name");
        }
    }

    private static string RequireName(string? name, string message)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new CanamedException(ProblemKind.Validation, "Nome obrigatório", message, "name-required");
        }

        return name.Trim();
    }

    private static CanamedException InvalidOperatingHours(string detail) =>
        new(ProblemKind.Validation, "Funcionamento inválido", detail, "invalid-operating-hours");

    private static CanamedException NotFound() =>
        new(ProblemKind.NotFound, "Registro não encontrado", "Registro não encontrado.", "resource-not-found");

    private static HealthPlanResponse MapHealthPlan(HealthPlan healthPlan) =>
        new(healthPlan.Id, healthPlan.Name, healthPlan.AnsCode, healthPlan.IsActive);

    private static RoomResponse MapRoom(Room room) => new(room.Id, room.Name, room.IsActive);

    private static OperatingHourResponse MapOperatingHour(OperatingHour hour) =>
        new(hour.Id, hour.DayOfWeek, hour.StartsAt.ToString("HH:mm", CultureInfo.InvariantCulture),
            hour.EndsAt.ToString("HH:mm", CultureInfo.InvariantCulture));

    private static ClinicClosureResponse MapClosure(ClinicClosure closure) =>
        new(closure.Id, closure.Date, closure.Description);
}
