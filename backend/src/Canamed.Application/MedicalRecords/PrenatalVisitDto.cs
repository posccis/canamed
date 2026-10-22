namespace Canamed.Application.MedicalRecords;

public sealed record PrenatalVisitDto(
    Guid Id,
    Guid ClinicId,
    Guid PatientId,
    Guid MedicalRecordId,
    DateOnly VisitDate,
    int GestationalAgeWeeks,
    int GestationalAgeDays,
    double WeightKg,
    double? Bmi,
    string BloodPressure,
    double? UterineHeightCm,
    int? FetalHeartRateBpm,
    bool? FetalMovementPresent,
    string? EdemaClassification,
    string? FetalPresentation,
    string? ClinicalNotes,
    DateTimeOffset CreatedAt);

public sealed record CreatePrenatalVisitRequest(
    DateOnly VisitDate,
    int GestationalAgeWeeks,
    int GestationalAgeDays,
    double WeightKg,
    double? Bmi,
    string BloodPressure,
    double? UterineHeightCm,
    int? FetalHeartRateBpm,
    bool? FetalMovementPresent,
    string? EdemaClassification,
    string? FetalPresentation,
    string? ClinicalNotes);
