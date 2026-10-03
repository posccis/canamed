namespace Canamed.Application.MedicalDocuments;

public sealed record CreateMedicalDocumentRequest(
    Guid PatientId,
    Guid? MedicalRecordId,
    string DocumentType,
    string ContentPayload,
    string? Cid10Code,
    bool PatientConsentedCid);

public sealed record UpdateMedicalDocumentRequest(
    string ContentPayload,
    string? Cid10Code,
    bool PatientConsentedCid);

public sealed record CancelMedicalDocumentRequest(
    string Reason);

public sealed record MedicalDocumentResponse(
    Guid Id,
    Guid ClinicId,
    Guid PatientId,
    Guid DoctorId,
    Guid? MedicalRecordId,
    string DocumentType,
    string Status,
    string ContentPayload,
    string? Cid10Code,
    bool PatientConsentedCid,
    string? SignatureHash,
    string PublicToken,
    string? CancellationReason,
    DateTimeOffset? SignedAt,
    DateTimeOffset? CancelledAt,
    DateTimeOffset CreatedAt);

public sealed record PublicDocumentValidationResponse(
    bool IsValid,
    string Status,
    string DocumentType,
    DateTimeOffset? IssuedAt,
    string DoctorName,
    string ClinicName,
    string PatientInitials,
    string? CancellationReason);
