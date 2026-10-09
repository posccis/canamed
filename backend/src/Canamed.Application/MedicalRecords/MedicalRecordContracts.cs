namespace Canamed.Application.MedicalRecords;

public sealed record StartMedicalRecordRequest(
    Guid PatientId,
    Guid? AppointmentId);

public sealed record UpdateDraftMedicalRecordRequest(
    string? Subjective,
    string? Objective,
    string? Assessment,
    string? Plan,
    string? ClinicalNotes);

public sealed record AddAddendumRequest(
    string Justification,
    string Notes);

public sealed record MedicalRecordAddendumResponse(
    Guid Id,
    Guid MedicalRecordId,
    Guid DoctorId,
    string Justification,
    string Notes,
    DateTimeOffset CreatedAt);

public sealed record MedicalRecordResponse(
    Guid Id,
    Guid ClinicId,
    Guid PatientId,
    Guid DoctorId,
    Guid? AppointmentId,
    string Status,
    string? Subjective,
    string? Objective,
    string? Assessment,
    string? Plan,
    string? ClinicalNotes,
    DateTimeOffset? FinalizedAt,
    Guid? FinalizedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<MedicalRecordAddendumResponse> Addenda);
