namespace Canamed.Application.Privacy;

public sealed record CreatePrivacyRequestInput(
    Guid ClinicId,
    string RequestType, // data_access, rectification, deletion, consent_revocation
    string? Details);

public sealed record PrivacyRequestResponse(
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
    DateTimeOffset CreatedAt);

public sealed record DpoRespondPrivacyRequestInput(
    string ResponseNotes,
    string Status); // completed, rejected

public sealed record PatientDataExportDto(
    Guid PatientId,
    string Name,
    string? Cpf,
    string Phone,
    string? Email,
    DateOnly? BirthDate,
    DateTimeOffset CreatedAt,
    IReadOnlyList<PatientAppointmentHistoryItem> Appointments,
    string LegalNotice);

public sealed record PatientAppointmentHistoryItem(
    Guid Id,
    DateTimeOffset StartsAt,
    string Status,
    string ProfessionalName);

public sealed record ConsentItemDto(
    Guid Id,
    string ConsentType,
    string PolicyVersion,
    bool IsGranted,
    DateTimeOffset GrantedAt);

public sealed record UpdateConsentInput(
    string ConsentType,
    bool IsGranted);
