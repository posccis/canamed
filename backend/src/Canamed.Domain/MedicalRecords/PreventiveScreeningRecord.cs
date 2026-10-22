using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

public sealed class PreventiveScreeningRecord : Entity
{
    private PreventiveScreeningRecord()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid PatientId { get; private set; }
    public Guid? MedicalRecordId { get; private set; }
    public string ExamType { get; private set; } = null!;
    public DateOnly PerformedAt { get; private set; }
    public string ResultSummary { get; private set; } = null!;
    public string? Classification { get; private set; }
    public string? BethesdaClassification { get; private set; }
    public string? HpvDnaResult { get; private set; }
    public string? BiRadsCategory { get; private set; }
    public string? ClinicalConductNotes { get; private set; }
    public DateOnly? NextDueDate { get; private set; }

    public static PreventiveScreeningRecord Create(
        Guid clinicId,
        Guid patientId,
        Guid? medicalRecordId,
        string examType,
        DateOnly performedAt,
        string resultSummary,
        string? classification,
        DateOnly? nextDueDate,
        DateTimeOffset now,
        string? bethesdaClassification = null,
        string? hpvDnaResult = null,
        string? biRadsCategory = null,
        string? clinicalConductNotes = null)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        if (string.IsNullOrWhiteSpace(examType))
        {
            throw new ArgumentException("O tipo de exame preventivo é obrigatório.", nameof(examType));
        }

        if (string.IsNullOrWhiteSpace(resultSummary))
        {
            throw new ArgumentException("O resumo do resultado é obrigatório.", nameof(resultSummary));
        }

        var screening = new PreventiveScreeningRecord
        {
            ClinicId = clinicId,
            PatientId = patientId,
            MedicalRecordId = medicalRecordId,
            ExamType = examType.Trim().ToLowerInvariant(),
            PerformedAt = performedAt,
            ResultSummary = resultSummary.Trim(),
            Classification = classification?.Trim(),
            NextDueDate = nextDueDate,
            BethesdaClassification = bethesdaClassification?.Trim(),
            HpvDnaResult = hpvDnaResult?.Trim(),
            BiRadsCategory = biRadsCategory?.Trim(),
            ClinicalConductNotes = clinicalConductNotes?.Trim()
        };

        screening.MarkCreated(now);
        return screening;
    }
}
