namespace Canamed.Application.Agenda;

/// <summary>Pedido de criação de agendamento.</summary>
public sealed record CreateAppointmentRequest(
    Guid ProfessionalId,
    Guid PatientId,
    Guid AppointmentTypeId,
    DateTimeOffset StartsAt,
    Guid? RoomId = null);

/// <summary>Pedido de remarcação. <c>RoomId</c> nulo mantém a sala atual (SPEC-0006).</summary>
public sealed record RescheduleAppointmentRequest(DateTimeOffset StartsAt, Guid? RoomId = null);

/// <summary>Pedido de cancelamento. O motivo é obrigatório (RN-006).</summary>
public sealed record CancelAppointmentRequest(string Reason);

/// <summary>Pedido de bloqueio de agenda do profissional.</summary>
public sealed record CreateBlockRequest(DateTimeOffset StartsAt, DateTimeOffset EndsAt, string? Reason);

/// <summary>Agendamento retornado pela API. Datas em UTC; a conversão para exibição é do cliente (RN-010).</summary>
public sealed record AppointmentResponse(
    Guid Id,
    Guid ProfessionalId,
    Guid PatientId,
    string PatientName,
    Guid AppointmentTypeId,
    string AppointmentTypeName,
    string Category,
    string Coverage,
    string? SpecialtyName,
    Guid? RoomId,
    string? RoomName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int DurationMinutes,
    string Status,
    string? CancellationReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

/// <summary>
/// Bloqueio de agenda retornado pela API. O motivo não é exposto na consulta da agenda
/// (F-004, item 3): ele permanece apenas na trilha de auditoria, evitando revelar informação clínica.
/// </summary>
public sealed record BlockResponse(
    Guid Id,
    Guid ProfessionalId,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt);

/// <summary>Agenda de um dia, com agendamentos e bloqueios do profissional.</summary>
public sealed record AgendaDayResponse(
    DateOnly Date,
    Guid? ProfessionalId,
    IReadOnlyList<AppointmentResponse> Appointments,
    IReadOnlyList<BlockResponse> Blocks);
