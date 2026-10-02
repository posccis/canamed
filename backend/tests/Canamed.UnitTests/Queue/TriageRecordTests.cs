using Canamed.Domain.Queue;

namespace Canamed.UnitTests.Queue;

public sealed class TriageRecordTests
{
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _queueEntryId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly Guid _operatorId = Guid.NewGuid();
    private readonly DateTimeOffset _now = new(2026, 10, 1, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Record_ValidTriageData_CalculatesBmiCorrectly()
    {
        var record = TriageRecord.Record(
            _clinicId,
            _queueEntryId,
            _patientId,
            _operatorId,
            "Enf. Mariana",
            RiskClassifications.Yellow,
            _now,
            bloodPressure: "120/80",
            heartRate: 78,
            temperature: 36.8m,
            oxygenSaturation: 98,
            glucose: 92,
            weightKg: 70m,
            heightCm: 175m,
            chiefComplaint: "Cefaleia e náuseas",
            allergies: "Nenhuma");

        Assert.Equal(_clinicId, record.ClinicId);
        Assert.Equal(_queueEntryId, record.QueueEntryId);
        Assert.Equal(RiskClassifications.Yellow, record.RiskClassification);
        Assert.Equal("120/80", record.BloodPressure);
        Assert.Equal(78, record.HeartRate);
        Assert.Equal(36.8m, record.Temperature);
        Assert.Equal(98, record.OxygenSaturation);
        // IMC = 70 / (1.75 * 1.75) = 70 / 3.0625 = 22.86
        Assert.Equal(22.86m, record.CalculatedBmi);
        Assert.Equal("Cefaleia e náuseas", record.ChiefComplaint);
    }

    [Theory]
    [InlineData(29.9)]
    [InlineData(45.1)]
    public void Record_TemperatureOutOfRange_ThrowsArgumentException(decimal temp)
    {
        Assert.Throws<ArgumentException>(() =>
            TriageRecord.Record(
                _clinicId,
                _queueEntryId,
                _patientId,
                _operatorId,
                "Enf. Mariana",
                RiskClassifications.Green,
                _now,
                temperature: temp));
    }

    [Theory]
    [InlineData(49)]
    [InlineData(101)]
    public void Record_OxygenSaturationOutOfRange_ThrowsArgumentException(int sat)
    {
        Assert.Throws<ArgumentException>(() =>
            TriageRecord.Record(
                _clinicId,
                _queueEntryId,
                _patientId,
                _operatorId,
                "Enf. Mariana",
                RiskClassifications.Green,
                _now,
                oxygenSaturation: sat));
    }

    [Fact]
    public void Record_InvalidRiskClassification_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            TriageRecord.Record(
                _clinicId,
                _queueEntryId,
                _patientId,
                _operatorId,
                "Enf. Mariana",
                "roxo",
                _now));
    }

    [Fact]
    public void Update_ModifiesPropertiesAndRecalculatesBmi()
    {
        var record = TriageRecord.Record(
            _clinicId,
            _queueEntryId,
            _patientId,
            _operatorId,
            "Enf. Mariana",
            RiskClassifications.Green,
            _now,
            weightKg: 80m,
            heightCm: 180m);

        // IMC = 80 / (1.80 * 1.80) = 24.69
        Assert.Equal(24.69m, record.CalculatedBmi);

        record.Update(
            _operatorId,
            "Dr. Roberto",
            RiskClassifications.Orange,
            _now.AddMinutes(5),
            bloodPressure: "150/95",
            heartRate: 110,
            weightKg: 85m,
            heightCm: 180m);

        Assert.Equal(RiskClassifications.Orange, record.RiskClassification);
        Assert.Equal("150/95", record.BloodPressure);
        Assert.Equal(110, record.HeartRate);
        // IMC = 85 / (1.80 * 1.80) = 26.23
        Assert.Equal(26.23m, record.CalculatedBmi);
    }
}
