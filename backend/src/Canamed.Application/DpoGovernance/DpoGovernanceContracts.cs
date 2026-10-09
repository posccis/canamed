using Canamed.Domain.Privacy;

namespace Canamed.Application.DpoGovernance;

public sealed record DpoProcessRequestCommand(
    Guid RequestId,
    Guid ClinicId,
    string Status, // completed, rejected
    string ResponseNotes);

public sealed record DpoRequestItemDto(
    Guid Id,
    string Protocol,
    Guid ClinicId,
    Guid PatientId,
    string RequestType,
    string? Details,
    string Status,
    string? ResponseNotes,
    DateTimeOffset DueDate,
    DateTimeOffset? CompletedAt,
    DateTimeOffset CreatedAt,
    int RemainingDays,
    string UrgencyLevel); // normal, warning, critical, overdue

public sealed record RopaActivityDto(
    string ProcessName,
    string Purpose,
    string LegalBasis,
    string DataCategories,
    string RetentionPeriod,
    string SecurityMeasures);

public sealed record DpoOverviewDto(
    Guid ClinicId,
    int TotalPendingRequests,
    int OverdueRequests,
    IReadOnlyList<DpoRequestItemDto> Requests,
    IReadOnlyList<RopaActivityDto> RopaActivities);
