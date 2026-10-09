namespace Canamed.Application.MedicalRecords;

public sealed record PatientExamAttachmentResponse(
    Guid Id,
    Guid ClinicId,
    Guid PatientId,
    Guid? MedicalRecordId,
    string Title,
    string ExamType,
    DateOnly ExamDate,
    string? LabFacility,
    string? Notes,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string FileHash,
    string UploadedByUserId,
    string UploadedByName,
    bool IsActive,
    DateTimeOffset CreatedAt);

public sealed record CreateExamAttachmentMetadata(
    string Title,
    string ExamType,
    DateOnly ExamDate,
    string? LabFacility,
    string? Notes,
    Guid? MedicalRecordId);
