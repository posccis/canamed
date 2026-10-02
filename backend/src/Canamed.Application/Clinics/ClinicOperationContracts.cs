namespace Canamed.Application.Clinics;

/// <summary>Convênio da clínica (SPEC-0006).</summary>
public sealed record HealthPlanResponse(Guid Id, string Name, string? AnsCode, bool IsActive);

/// <summary>Criação de convênio.</summary>
public sealed record CreateHealthPlanRequest(string Name, string? AnsCode);

/// <summary>Alteração de convênio.</summary>
public sealed record UpdateHealthPlanRequest(string Name, string? AnsCode);

/// <summary>Sala da clínica.</summary>
public sealed record RoomResponse(Guid Id, string Name, bool IsActive);

/// <summary>Criação de sala.</summary>
public sealed record CreateRoomRequest(string Name);

/// <summary>Renomeação de sala.</summary>
public sealed record RenameRoomRequest(string Name);

/// <summary>Intervalo de funcionamento (horários como <c>HH:mm</c>).</summary>
public sealed record OperatingHourResponse(Guid Id, int DayOfWeek, string StartsAt, string EndsAt);

/// <summary>Intervalo informado na substituição do funcionamento.</summary>
public sealed record OperatingHourRequest(int DayOfWeek, string StartsAt, string EndsAt);

/// <summary>Substituição completa do funcionamento da clínica.</summary>
public sealed record ReplaceOperatingHoursRequest(IReadOnlyList<OperatingHourRequest>? Hours);

/// <summary>Feriado/exceção da clínica.</summary>
public sealed record ClinicClosureResponse(Guid Id, DateOnly Date, string Description);

/// <summary>Criação de feriado/exceção.</summary>
public sealed record CreateClinicClosureRequest(DateOnly Date, string Description);
