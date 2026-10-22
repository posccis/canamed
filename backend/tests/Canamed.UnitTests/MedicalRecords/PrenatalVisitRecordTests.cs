using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class PrenatalVisitRecordTests
{
    [Fact]
    public void Create_ComParametrosValidos_CriaRegistroCorretamente()
    {
        var clinicId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var medicalRecordId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var visitDate = DateOnly.FromDateTime(DateTime.UtcNow);

        var visit = PrenatalVisitRecord.Create(
            clinicId,
            patientId,
            medicalRecordId,
            visitDate,
            gestationalAgeWeeks: 24,
            gestationalAgeDays: 3,
            weightKg: 68.5,
            bloodPressure: "120/80",
            uterineHeightCm: 24.0,
            fetalHeartRateBpm: 144,
            fetalMovementPresent: true,
            edemaClassification: "Ausente",
            fetalPresentation: "Cefálica",
            clinicalNotes: "Movimentação fetal ativa, sem queixas.",
            now: now);

        Assert.Equal(clinicId, visit.ClinicId);
        Assert.Equal(patientId, visit.PatientId);
        Assert.Equal(medicalRecordId, visit.MedicalRecordId);
        Assert.Equal(24, visit.GestationalAgeWeeks);
        Assert.Equal(3, visit.GestationalAgeDays);
        Assert.Equal(68.5, visit.WeightKg);
        Assert.Equal("120/80", visit.BloodPressure);
        Assert.Equal(24.0, visit.UterineHeightCm);
        Assert.Equal(144, visit.FetalHeartRateBpm);
        Assert.True(visit.FetalMovementPresent);
        Assert.Equal("Ausente", visit.EdemaClassification);
        Assert.Equal("Cefálica", visit.FetalPresentation);
    }

    [Fact]
    public void Create_ComIdsVaziosOuCamposInvalidos_LancaExcecao()
    {
        var now = DateTimeOffset.UtcNow;
        var visitDate = DateOnly.FromDateTime(DateTime.UtcNow);

        Assert.Throws<ArgumentException>(() => PrenatalVisitRecord.Create(
            Guid.Empty,
            Guid.NewGuid(),
            Guid.NewGuid(),
            visitDate,
            12, 0, 60.0, "120/80", null, null, null, null, null, null, now));

        Assert.Throws<ArgumentException>(() => PrenatalVisitRecord.Create(
            Guid.NewGuid(),
            Guid.Empty,
            Guid.NewGuid(),
            visitDate,
            12, 0, 60.0, "120/80", null, null, null, null, null, null, now));

        Assert.Throws<ArgumentException>(() => PrenatalVisitRecord.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            visitDate,
            -1, 0, 60.0, "120/80", null, null, null, null, null, null, now));
    }
}
