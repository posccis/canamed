using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class LarcPlacementRecordTests
{
    [Theory]
    [InlineData("implanon", 3)]
    [InlineData("diu_cobre", 10)]
    [InlineData("diu_prata", 5)]
    [InlineData("kyleena", 5)]
    [InlineData("mirena", 8)]
    public void CalculateExpirationDate_DeveCalcularValidadeCorretaPorTipoDeDispositivo(string deviceType, int expectedYears)
    {
        var insertionDate = new DateOnly(2026, 3, 15);
        var expiration = LarcDeviceCalculator.CalculateExpirationDate(deviceType, insertionDate);

        var expectedDate = insertionDate.AddYears(expectedYears);
        Assert.Equal(expectedDate, expiration);
    }

    [Fact]
    public void CalculateControlUltrasoundDate_DeveSugerirControleEm30DiasAposInsercao()
    {
        var insertionDate = new DateOnly(2026, 3, 15);
        var usgDate = LarcDeviceCalculator.CalculateControlUltrasoundDate(insertionDate);

        Assert.Equal(new DateOnly(2026, 4, 14), usgDate);
    }

    [Fact]
    public void LarcPlacementRecord_Create_ValidaCamposObrigatorios()
    {
        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var insertionDate = new DateOnly(2026, 3, 15);
        var now = DateTimeOffset.UtcNow;

        var record = LarcPlacementRecord.Create(
            clinicId,
            patientId,
            null,
            "mirena",
            "Mirena 52mg",
            "LOT-2026-X12",
            insertionDate,
            7.5m,
            "Inserção sob anestesia local sem intercorrências",
            now);

        Assert.NotNull(record);
        Assert.Equal("mirena", record.DeviceType);
        Assert.Equal("LOT-2026-X12", record.BatchNumber);
        Assert.Equal(7.5m, record.HysterometryCm);
        Assert.Equal(new DateOnly(2034, 3, 15), record.ExpirationDate);
        Assert.Equal(new DateOnly(2026, 4, 14), record.ControlUltrasoundDate);
        Assert.False(record.IsRemoved);
    }
}
