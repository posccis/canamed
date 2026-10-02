namespace Canamed.Application.Dashboard;

/// <summary>Métrica operacional consolidada por profissional (SPEC-0007).</summary>
public sealed record ProfessionalMetricResponse(
    Guid ProfessionalId,
    string ProfessionalName,
    int TotalAppointments,
    int AttendedCount,
    int NoShowCount);

/// <summary>Métrica de ocupação de sala no dia (SPEC-0007).</summary>
public sealed record RoomMetricResponse(
    Guid RoomId,
    string RoomName,
    int AppointmentsCount);

/// <summary>Próximo agendamento do dia para exibição rápida no dashboard (SPEC-0007).</summary>
public sealed record UpcomingAppointmentResponse(
    Guid Id,
    string PatientName,
    string ProfessionalName,
    string AppointmentTypeName,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    string? RoomName,
    string Status);

/// <summary>Resumo consolidado dos indicadores operacionais da clínica (SPEC-0007).</summary>
public sealed record DashboardSummaryResponse(
    DateOnly Date,
    int TotalAppointments,
    int ScheduledCount,
    int ConfirmedCount,
    int AttendedCount,
    int NoShowCount,
    int CancelledCount,
    double AttendanceRate,
    int QueueWaitingCount,
    int QueueInServiceCount,
    int QueueCompletedCount,
    double AverageWaitMinutes,
    IReadOnlyList<ProfessionalMetricResponse> Professionals,
    IReadOnlyList<RoomMetricResponse> Rooms,
    IReadOnlyList<UpcomingAppointmentResponse> UpcomingAppointments);
