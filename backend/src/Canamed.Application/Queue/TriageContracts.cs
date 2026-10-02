namespace Canamed.Application.Queue;

public sealed record RecordTriageRequest(
    string RiskClassification,
    string? BloodPressure = null,
    int? HeartRate = null,
    decimal? Temperature = null,
    int? OxygenSaturation = null,
    int? Glucose = null,
    decimal? WeightKg = null,
    decimal? HeightCm = null,
    string? ChiefComplaint = null,
    string? Allergies = null);

public sealed record TriageRecordResponse(
    Guid Id,
    Guid QueueEntryId,
    Guid PatientId,
    Guid ClinicId,
    string RiskClassification,
    string? BloodPressure,
    int? HeartRate,
    decimal? Temperature,
    int? OxygenSaturation,
    int? Glucose,
    decimal? WeightKg,
    decimal? HeightCm,
    decimal? CalculatedBmi,
    string? ChiefComplaint,
    string? Allergies,
    DateTimeOffset RecordedAt,
    string OperatorName);
