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
            NextDueDate = nextDueDate
        };

        screening.MarkCreated(now);
        return screening;
    }
}
