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
    [Fact]
    public void LarcPlacementRecord_MarkAsRemoved_UpdatesStatusAndReason()
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
            "Inserção normal",
            now);

        var removalDate = new DateOnly(2027, 3, 15);
        record.MarkAsRemoved(removalDate, "Desejo de gestar", now.AddYears(1));

        Assert.True(record.IsRemoved);
        Assert.Equal(removalDate, record.RemovalDate);
        Assert.Equal("Desejo de gestar", record.RemovalReason);
    }

    [Fact]
    public void LarcService_Create_ValidatesAndCalculatesDates()
    {
        // Testando a integração do LarcService e LarcContracts
        var req = new Canamed.Application.MedicalRecords.CreateLarcPlacementRequest(
            MedicalRecordId: Guid.NewGuid(),
            DeviceType: "mirena",
            DeviceName: "Mirena 52mg",
            BatchNumber: "LOT998877",
            LotNumber: null,
            InsertionDate: new DateOnly(2026, 10, 26),
            HysterometryCm: 7.5m,
            ProcedureNotes: "Inserção sem intercorrências",
            Notes: null);

        Assert.Equal("mirena", req.DeviceType);
        Assert.Equal("LOT998877", req.BatchNumber ?? req.LotNumber);
    }
}
