using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

/// <summary>
/// Registro estruturado de consulta de pré-natal (RN-007 da SPEC-0035 / Épico 2).
/// Atende às diretrizes do Ministério da Saúde / FEBRASGO para o Cartão da Gestante.
/// </summary>
public sealed class PrenatalVisitRecord : Entity
{
    private PrenatalVisitRecord()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid PatientId { get; private set; }
    public Guid MedicalRecordId { get; private set; }
    public DateOnly VisitDate { get; private set; }
    public int GestationalAgeWeeks { get; private set; }
    public int GestationalAgeDays { get; private set; }
    public double WeightKg { get; private set; }
    public string BloodPressure { get; private set; } = string.Empty;
    public double? UterineHeightCm { get; private set; }
    public int? FetalHeartRateBpm { get; private set; }
    public bool? FetalMovementPresent { get; private set; }
    public string? EdemaClassification { get; private set; }
    public string? FetalPresentation { get; private set; }
    public string? ClinicalNotes { get; private set; }

    public static PrenatalVisitRecord Create(
        Guid clinicId,
        Guid patientId,
        Guid medicalRecordId,
        DateOnly visitDate,
        int gestationalAgeWeeks,
        int gestationalAgeDays,
        double weightKg,
        string bloodPressure,
        double? uterineHeightCm,
        int? fetalHeartRateBpm,
        bool? fetalMovementPresent,
        string? edemaClassification,
        string? fetalPresentation,
        string? clinicalNotes,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty) throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        if (patientId == Guid.Empty) throw new ArgumentException("A paciente é obrigatória.", nameof(patientId));
        if (medicalRecordId == Guid.Empty) throw new ArgumentException("O prontuário é obrigatório.", nameof(medicalRecordId));
        if (gestationalAgeWeeks < 0 || gestationalAgeWeeks > 44) throw new ArgumentException("Idade gestacional em semanas inválida.", nameof(gestationalAgeWeeks));
        if (gestationalAgeDays < 0 || gestationalAgeDays > 6) throw new ArgumentException("Idade gestacional em dias inválida.", nameof(gestationalAgeDays));
        if (weightKg <= 20 || weightKg >= 300) throw new ArgumentException("Peso corporal inválido.", nameof(weightKg));
        if (string.IsNullOrWhiteSpace(bloodPressure)) throw new ArgumentException("A pressão arterial é obrigatória.", nameof(bloodPressure));

        var record = new PrenatalVisitRecord
        {
            ClinicId = clinicId,
            PatientId = patientId,
            MedicalRecordId = medicalRecordId,
            VisitDate = visitDate,
            GestationalAgeWeeks = gestationalAgeWeeks,
            GestationalAgeDays = gestationalAgeDays,
            WeightKg = weightKg,
            BloodPressure = bloodPressure.Trim(),
            UterineHeightCm = uterineHeightCm,
            FetalHeartRateBpm = fetalHeartRateBpm,
            FetalMovementPresent = fetalMovementPresent,
            EdemaClassification = edemaClassification?.Trim(),
            FetalPresentation = fetalPresentation?.Trim(),
            ClinicalNotes = clinicalNotes?.Trim()
        };

        record.MarkCreated(now);
        return record;
    }
}
