using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

/// <summary>
/// Anexo de exame realizado anteriormente trazido pela paciente (SPEC-0028).
/// Garante integridade probatória via hash SHA-256 e rastreabilidade (Lei nº 13.787/2018 e LGPD Art. 11).
/// </summary>
public sealed class PatientExamAttachment : Entity
{
    public static readonly IReadOnlyList<string> ValidExamTypes =
    [
        "mamografia",
        "usg_transvaginal",
        "usg_pelvica",
        "usg_mamas",
        "citopatologico",
        "colposcopia",
        "laboratorial",
        "anatomopatologico",
        "densitometria",
        "outros"
    ];

    private PatientExamAttachment()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid PatientId { get; private set; }
    public Guid? MedicalRecordId { get; private set; }

    public string Title { get; private set; } = null!;
    public string ExamType { get; private set; } = null!;
    public DateOnly ExamDate { get; private set; }
    public string? LabFacility { get; private set; }
    public string? Notes { get; private set; }

    public string FileName { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long FileSizeBytes { get; private set; }
    public string FileHash { get; private set; } = null!;
    public string StoragePath { get; private set; } = null!;

    public string UploadedByUserId { get; private set; } = null!;
    public string UploadedByName { get; private set; } = null!;
    public bool IsActive { get; private set; } = true;

    public static PatientExamAttachment Create(
        Guid clinicId,
        Guid patientId,
        Guid? medicalRecordId,
        string title,
        string examType,
        DateOnly examDate,
        string? labFacility,
        string? notes,
        string fileName,
        string contentType,
        long fileSizeBytes,
        string fileHash,
        string storagePath,
        string uploadedByUserId,
        string uploadedByName,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("O título/identificação do exame é obrigatório.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(examType))
        {
            throw new ArgumentException("O tipo de exame é obrigatório.", nameof(examType));
        }

        var normalizedType = examType.Trim().ToLowerInvariant();
        if (!ValidExamTypes.Contains(normalizedType))
        {
            throw new ArgumentException($"Tipo de exame '{examType}' não é válido para a especialidade.", nameof(examType));
        }

        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("O nome do arquivo é obrigatório.", nameof(fileName));
        }

        if (string.IsNullOrWhiteSpace(contentType))
        {
            throw new ArgumentException("O tipo de conteúdo (MIME) é obrigatório.", nameof(contentType));
        }

        if (fileSizeBytes <= 0)
        {
            throw new ArgumentException("O arquivo não pode ser vazio.", nameof(fileSizeBytes));
        }

        if (string.IsNullOrWhiteSpace(fileHash))
        {
            throw new ArgumentException("O hash criptográfico do arquivo é obrigatório.", nameof(fileHash));
        }

        if (string.IsNullOrWhiteSpace(storagePath))
        {
            throw new ArgumentException("O caminho de armazenamento é obrigatório.", nameof(storagePath));
        }

        if (string.IsNullOrWhiteSpace(uploadedByUserId))
        {
            throw new ArgumentException("O usuário responsável pelo upload é obrigatório.", nameof(uploadedByUserId));
        }

        var attachment = new PatientExamAttachment
        {
            ClinicId = clinicId,
            PatientId = patientId,
            MedicalRecordId = medicalRecordId,
            Title = title.Trim(),
            ExamType = normalizedType,
            ExamDate = examDate,
            LabFacility = string.IsNullOrWhiteSpace(labFacility) ? null : labFacility.Trim(),
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            FileName = fileName.Trim(),
            ContentType = contentType.Trim().ToLowerInvariant(),
            FileSizeBytes = fileSizeBytes,
            FileHash = fileHash.Trim().ToLowerInvariant(),
            StoragePath = storagePath.Trim(),
            UploadedByUserId = uploadedByUserId.Trim(),
            UploadedByName = string.IsNullOrWhiteSpace(uploadedByName) ? "Profissional" : uploadedByName.Trim(),
            IsActive = true
        };

        attachment.MarkCreated(now);
        return attachment;
    }

    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }
}
