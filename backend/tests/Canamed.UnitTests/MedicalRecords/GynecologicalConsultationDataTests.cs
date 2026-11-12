using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class GynecologicalConsultationDataTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _recordId = Guid.NewGuid();

    [Fact]
    public void Create_InitializesSegmentsAsNotEvaluated_WithoutSilentlyDefaultingToNormal()
    {
        var data = GynecologicalConsultationData.Create(_recordId, _now);

        Assert.Null(data.BreastsStatus);
        Assert.Null(data.AbdomenStatus);
        Assert.Null(data.ExternalGenitaliaStatus);
        Assert.Null(data.SpeculumExamStatus);
        Assert.Null(data.BimanualPalpationStatus);

        Assert.False(data.BreastsIsNormal);
        Assert.False(data.AbdomenIsNormal);
        Assert.False(data.ExternalGenitaliaIsNormal);
        Assert.False(data.SpeculumExamIsNormal);
        Assert.False(data.BimanualPalpationIsNormal);
    }

    [Fact]
    public void Update_WithAbnormalSegmentAndEmptyFindings_ThrowsArgumentException()
    {
        var data = GynecologicalConsultationData.Create(_recordId, _now);

        var ex = Assert.Throws<ArgumentException>(() =>
            data.UpdateTriState(
                dum: null,
                isDumUncertain: false,
                isMenopausal: false,
                chiefComplaint: "Dor pélvica",
                hma: "Dor há 2 semanas",
                isSexuallyActive: true,
                dyspareunia: "ausente",
                breastsStatus: "Abnormal",
                breastsFindings: null,
                abdomenStatus: "Normal",
                abdomenFindings: null,
                externalGenitaliaStatus: "Normal",
                externalGenitaliaFindings: null,
                speculumExamStatus: "Normal",
                speculumExamFindings: null,
                bimanualPalpationStatus: "Normal",
                bimanualPalpationFindings: null,
                procedurePerformed: null,
                procedureBatch: null,
                procedureNotes: null,
                diagnosesJson: null,
                prescriptionNotes: null,
                generalOrientationNotes: null,
                _now));

        Assert.Contains("Por favor, detalhe as alterações encontradas no segmento marcado como alterado.", ex.Message);
    }

    [Fact]
    public void Update_WithAbnormalSegmentAndValidFindings_PersistsFindingsCorrectly()
    {
        var data = GynecologicalConsultationData.Create(_recordId, _now);

        data.UpdateTriState(
            dum: null,
            isDumUncertain: false,
            isMenopausal: false,
            chiefComplaint: "Rotina",
            hma: "Assintomática",
            isSexuallyActive: true,
            dyspareunia: "ausente",
            breastsStatus: "Abnormal",
            breastsFindings: "Nódulo palpável em QSE de mama direita",
            abdomenStatus: "Normal",
            abdomenFindings: null,
            externalGenitaliaStatus: "Normal",
            externalGenitaliaFindings: null,
            speculumExamStatus: "Normal",
            speculumExamFindings: null,
            bimanualPalpationStatus: "Normal",
            bimanualPalpationFindings: null,
            procedurePerformed: null,
            procedureBatch: null,
            procedureNotes: null,
            diagnosesJson: null,
            prescriptionNotes: null,
            generalOrientationNotes: null,
            _now);

        Assert.Equal("Abnormal", data.BreastsStatus);
        Assert.Equal("Nódulo palpável em QSE de mama direita", data.BreastsFindings);
        Assert.Equal("Normal", data.AbdomenStatus);
        Assert.Null(data.AbdomenFindings);
    }
    [Fact]
    public void UpdateTriState_WithFirstUltrasoundAndCategorizedDiagnoses_PersistsAllDataCorrectly()
    {
        var data = GynecologicalConsultationData.Create(_recordId, _now);
        var usgDate = new DateOnly(2026, 8, 10);
        var diagnosesJson = "[{\"code\":\"N86\",\"description\":\"Erosão do colo\",\"category\":\"confirmed\"},{\"code\":\"N72\",\"description\":\"Suspeita de cervicite\",\"category\":\"hypothesis\"}]";

        data.UpdateTriState(
            dum: new DateOnly(2026, 7, 1),
            isDumUncertain: false,
            isMenopausal: false,
            chiefComplaint: "Acompanhamento obstétrico inicial",
            hma: "Gestante no 1º trimestre",
            isSexuallyActive: true,
            dyspareunia: "ausente",
            breastsStatus: "Normal",
            breastsFindings: null,
            abdomenStatus: "Normal",
            abdomenFindings: null,
            externalGenitaliaStatus: "Normal",
            externalGenitaliaFindings: null,
            speculumExamStatus: "Normal",
            speculumExamFindings: null,
            bimanualPalpationStatus: "Normal",
            bimanualPalpationFindings: null,
            procedurePerformed: null,
            procedureBatch: null,
            procedureNotes: null,
            diagnosesJson: diagnosesJson,
            prescriptionNotes: "Ácido fólico 5mg/dia",
            generalOrientationNotes: "Retorno com exames de 1º trimestre",
            now: _now,
            firstUltrasoundDate: usgDate,
            firstUltrasoundWeeks: 8,
            firstUltrasoundDays: 3,
            firstUltrasoundCcnMm: 19.5,
            preferredGestationalReference: GestationalAgeReference.FirstUltrasound);

        Assert.Equal(usgDate, data.FirstUltrasoundDate);
        Assert.Equal(8, data.FirstUltrasoundWeeks);
        Assert.Equal(3, data.FirstUltrasoundDays);
        Assert.Equal(19.5, data.FirstUltrasoundCcnMm);
        Assert.Equal(GestationalAgeReference.FirstUltrasound, data.PreferredGestationalReference);
        Assert.Equal(diagnosesJson, data.DiagnosesJson);
    }
    [Fact]
    public void UpdateTriState_WithCervicalClockFindings_PersistsJsonCorrectly()
    {
        var data = GynecologicalConsultationData.Create(_recordId, _now);
        var clockJson = "{\"hours\":[6],\"finding\":\"Epitélio acetobranco denso\",\"transformationZone\":\"ZT2\"}";

        data.UpdateTriState(
            dum: null,
            isDumUncertain: false,
            isMenopausal: false,
            chiefComplaint: "Colposcopia",
            hma: "Preventivo alterado prévio",
            isSexuallyActive: true,
            dyspareunia: "ausente",
            breastsStatus: "Normal",
            breastsFindings: null,
            abdomenStatus: "Normal",
            abdomenFindings: null,
            externalGenitaliaStatus: "Normal",
            externalGenitaliaFindings: null,
            speculumExamStatus: "Abnormal",
            speculumExamFindings: "Ectopia periorificial às 6h",
            bimanualPalpationStatus: "Normal",
            bimanualPalpationFindings: null,
            procedurePerformed: "colposcopia",
            procedureBatch: null,
            procedureNotes: null,
            diagnosesJson: null,
            prescriptionNotes: null,
            generalOrientationNotes: null,
            now: _now,
            cervicalClockFindingsJson: clockJson);

        Assert.Equal("Abnormal", data.SpeculumExamStatus);
        Assert.Equal("Ectopia periorificial às 6h", data.SpeculumExamFindings);
        Assert.Equal(clockJson, data.CervicalClockFindingsJson);
    }
}
