namespace Canamed.Application.Queue;

/// <summary>
/// Check-in: informe <c>AppointmentId</c> (chegada com hora marcada) **ou** <c>PatientId</c> e
/// <c>ProfessionalId</c> (encaixe sem agendamento), conforme RN-002 da SPEC-0005.
/// </summary>
public sealed record CheckInRequest(
    Guid? AppointmentId,
    Guid? PatientId,
    Guid? ProfessionalId,
    string? Priority);

/// <summary>Entrada da fila com posição e tempos calculados (RN-009).</summary>
public sealed record QueueEntryResponse(
    Guid Id,
    Guid? AppointmentId,
    Guid PatientId,
    string PatientName,
    Guid ProfessionalId,
    string Priority,
    string Status,
    int? Position,
    DateTimeOffset ArrivedAt,
    DateTimeOffset? CalledAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? FinishedAt,
    int WaitingMinutes,
    int? ServiceMinutes,
    DateTimeOffset? AppointmentStartsAt);

/// <summary>Fila de um dia, já ordenada por prioridade e chegada (RN-004).</summary>
public sealed record QueueDayResponse(
    DateOnly Date,
    Guid? ProfessionalId,
    IReadOnlyList<QueueEntryResponse> Entries);

/// <summary>Fechamento do dia da agenda (RN-012 a RN-014).</summary>
public sealed record CloseDayRequest(DateOnly Date, Guid? ProfessionalId);

/// <summary>Resumo do fechamento do dia.</summary>
public sealed record CloseDayResponse(
    DateOnly Date,
    int NoShowAppointments,
    int LeftQueueEntries,
    int StillInService,
    IReadOnlyList<Guid> NoShowAppointmentIds);
