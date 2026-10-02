using Canamed.Domain.Common;

namespace Canamed.Domain.Queue;

public static class RiskClassifications
{
    public const string Red = "vermelho";
    public const string Orange = "laranja";
    public const string Yellow = "amarelo";
    public const string Green = "verde";
    public const string Blue = "azul";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Red,
        Orange,
        Yellow,
        Green,
        Blue
    };
}

public sealed class TriageRecord : Entity
{
    private TriageRecord()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid QueueEntryId { get; private set; }

    public Guid PatientId { get; private set; }

    public string? BloodPressure { get; private set; }

    public int? HeartRate { get; private set; }

    public decimal? Temperature { get; private set; }

    public int? OxygenSaturation { get; private set; }

    public int? Glucose { get; private set; }

    public decimal? WeightKg { get; private set; }

    public decimal? HeightCm { get; private set; }

    public decimal? CalculatedBmi { get; private set; }

    public string? ChiefComplaint { get; private set; }

    public string? Allergies { get; private set; }

    public string RiskClassification { get; private set; } = RiskClassifications.Green;

    public DateTimeOffset RecordedAt { get; private set; }

    public Guid OperatorId { get; private set; }

    public string OperatorName { get; private set; } = string.Empty;

    public static TriageRecord Record(
        Guid clinicId,
        Guid queueEntryId,
        Guid patientId,
        Guid operatorId,
        string operatorName,
        string riskClassification,
        DateTimeOffset now,
        string? bloodPressure = null,
        int? heartRate = null,
        decimal? temperature = null,
        int? oxygenSaturation = null,
        int? glucose = null,
        decimal? weightKg = null,
        decimal? heightCm = null,
        string? chiefComplaint = null,
        string? allergies = null)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (queueEntryId == Guid.Empty)
        {
            throw new ArgumentException("A entrada na fila é obrigatória.", nameof(queueEntryId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        var normalizedRisk = riskClassification?.Trim().ToLowerInvariant() ?? RiskClassifications.Green;
        if (!RiskClassifications.All.Contains(normalizedRisk))
        {
            throw new ArgumentException($"Classificação de risco inválida: '{riskClassification}'.", nameof(riskClassification));
        }

        if (temperature is { } temp && (temp < 30m || temp > 45m))
        {
            throw new ArgumentException("A temperatura deve estar entre 30°C e 45°C.", nameof(temperature));
        }

        if (oxygenSaturation is { } sat && (sat < 50 || sat > 100))
        {
            throw new ArgumentException("A saturação de O2 deve estar entre 50% e 100%.", nameof(oxygenSaturation));
        }

        decimal? bmi = null;
        if (weightKg is > 0 && heightCm is > 0)
        {
            var heightMeters = heightCm.Value / 100m;
            bmi = decimal.Round(weightKg.Value / (heightMeters * heightMeters), 2);
        }

        var record = new TriageRecord
        {
            ClinicId = clinicId,
            QueueEntryId = queueEntryId,
            PatientId = patientId,
            OperatorId = operatorId,
            OperatorName = string.IsNullOrWhiteSpace(operatorName) ? "Operador" : operatorName.Trim(),
            RiskClassification = normalizedRisk,
            BloodPressure = string.IsNullOrWhiteSpace(bloodPressure) ? null : bloodPressure.Trim(),
            HeartRate = heartRate,
            Temperature = temperature,
            OxygenSaturation = oxygenSaturation,
            Glucose = glucose,
            WeightKg = weightKg,
            HeightCm = heightCm,
            CalculatedBmi = bmi,
            ChiefComplaint = string.IsNullOrWhiteSpace(chiefComplaint) ? null : chiefComplaint.Trim(),
            Allergies = string.IsNullOrWhiteSpace(allergies) ? null : allergies.Trim(),
            RecordedAt = now.ToUniversalTime()
        };

        record.MarkCreated(now);
        return record;
    }

    public void Update(
        Guid operatorId,
        string operatorName,
        string riskClassification,
        DateTimeOffset now,
        string? bloodPressure = null,
        int? heartRate = null,
        decimal? temperature = null,
        int? oxygenSaturation = null,
        int? glucose = null,
        decimal? weightKg = null,
        decimal? heightCm = null,
        string? chiefComplaint = null,
        string? allergies = null)
    {
        var normalizedRisk = riskClassification?.Trim().ToLowerInvariant() ?? RiskClassifications.Green;
        if (!RiskClassifications.All.Contains(normalizedRisk))
        {
            throw new ArgumentException($"Classificação de risco inválida: '{riskClassification}'.", nameof(riskClassification));
        }

        if (temperature is { } temp && (temp < 30m || temp > 45m))
        {
            throw new ArgumentException("A temperatura deve estar entre 30°C e 45°C.", nameof(temperature));
        }

        if (oxygenSaturation is { } sat && (sat < 50 || sat > 100))
        {
            throw new ArgumentException("A saturação de O2 deve estar entre 50% e 100%.", nameof(oxygenSaturation));
        }

        decimal? bmi = null;
        if (weightKg is > 0 && heightCm is > 0)
        {
            var heightMeters = heightCm.Value / 100m;
            bmi = decimal.Round(weightKg.Value / (heightMeters * heightMeters), 2);
        }

        OperatorId = operatorId;
        OperatorName = string.IsNullOrWhiteSpace(operatorName) ? OperatorName : operatorName.Trim();
        RiskClassification = normalizedRisk;
        BloodPressure = string.IsNullOrWhiteSpace(bloodPressure) ? null : bloodPressure.Trim();
        HeartRate = heartRate;
        Temperature = temperature;
        OxygenSaturation = oxygenSaturation;
        Glucose = glucose;
        WeightKg = weightKg;
        HeightCm = heightCm;
        CalculatedBmi = bmi;
        ChiefComplaint = string.IsNullOrWhiteSpace(chiefComplaint) ? null : chiefComplaint.Trim();
        Allergies = string.IsNullOrWhiteSpace(allergies) ? null : allergies.Trim();
        RecordedAt = now.ToUniversalTime();
        MarkUpdated(now);
    }
}
