using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class GynecologicalProfileTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();

    [Fact]
    public void Create_InitializesDefaults_WithZeroGpa()
    {
        var profile = GynecologicalProfile.Create(_clinicId, _patientId, _now);

        Assert.Equal(_clinicId, profile.ClinicId);
        Assert.Equal(_patientId, profile.PatientId);
        Assert.Equal(0, profile.Gravida);
        Assert.Equal(0, profile.Para);
        Assert.Equal(0, profile.Cesareans);
        Assert.Equal(0, profile.Abortions);
        Assert.Equal(0, profile.LivingChildren);
        Assert.Equal(0, profile.EctopicPregnancies);
        Assert.Null(profile.MenarcheAge);
        Assert.Null(profile.SexarcheAge);
        Assert.Null(profile.CurrentMethod);
    }

    [Fact]
    public void Update_SetsValidData_Correctly()
    {
        var profile = GynecologicalProfile.Create(_clinicId, _patientId, _now);

        profile.Update(
            menarcheAge: 12,
            sexarcheAge: 17,
            cycleIntervalDays: 28,
            cycleDurationDays: 4,
            isCycleRegular: true,
            flowIntensity: "moderado",
            dysmenorrhea: "leve",
            hasPms: true,
            pmsSymptoms: "Cefaleia e mastalgia",
            menopauseStatus: "menacme",
            menopauseAge: null,
            hrtInUse: false,
            gravida: 2,
            para: 1,
            cesareans: 1,
            abortions: 0,
            livingChildren: 1,
            ectopicPregnancies: 0,
            obstetricNotes: "Cesárea anterior por desproporção céfalo-pélvica",
            currentMethod: "diu_cobre",
            currentMethodUsageMonths: 18,
            previousMethods: "ACO oral",
            reproductivePlan: "sem_desejo",
            pelvicSurgeries: "Nenhuma",
            stiHistory: "Nega",
            familyCancerHistory: "Mãe com CA de mama aos 60 anos",
            _now.AddHours(1));

        Assert.Equal(12, profile.MenarcheAge);
        Assert.Equal(17, profile.SexarcheAge);
        Assert.Equal(28, profile.CycleIntervalDays);
        Assert.Equal(4, profile.CycleDurationDays);
        Assert.True(profile.IsCycleRegular);
        Assert.Equal("moderado", profile.FlowIntensity);
        Assert.Equal(2, profile.Gravida);
        Assert.Equal(1, profile.Para);
        Assert.Equal(1, profile.Cesareans);
        Assert.Equal(1, profile.LivingChildren);
        Assert.Equal("diu_cobre", profile.CurrentMethod);
        Assert.Equal(18, profile.CurrentMethodUsageMonths);
    }

    [Fact]
    public void Update_Throws_WhenMenarcheIsImplausible()
    {
        var profile = GynecologicalProfile.Create(_clinicId, _patientId, _now);

        Assert.Throws<ArgumentException>(() =>
            profile.Update(
                menarcheAge: 3, // implausível
                sexarcheAge: 16,
                cycleIntervalDays: 28,
                cycleDurationDays: 4,
                isCycleRegular: true,
                flowIntensity: null,
                dysmenorrhea: null,
                hasPms: false,
                pmsSymptoms: null,
                menopauseStatus: null,
                menopauseAge: null,
                hrtInUse: false,
                gravida: 0,
                para: 0,
                cesareans: 0,
                abortions: 0,
                livingChildren: 0,
                ectopicPregnancies: 0,
                obstetricNotes: null,
                currentMethod: null,
                currentMethodUsageMonths: null,
                previousMethods: null,
                reproductivePlan: null,
                pelvicSurgeries: null,
                stiHistory: null,
                familyCancerHistory: null,
                _now));
    }

    [Fact]
    public void Update_Throws_WhenNegativeGpa()
    {
        var profile = GynecologicalProfile.Create(_clinicId, _patientId, _now);

        Assert.Throws<ArgumentException>(() =>
            profile.Update(
                menarcheAge: 13,
                sexarcheAge: 18,
                cycleIntervalDays: 30,
                cycleDurationDays: 5,
                isCycleRegular: true,
                flowIntensity: null,
                dysmenorrhea: null,
                hasPms: false,
                pmsSymptoms: null,
                menopauseStatus: null,
                menopauseAge: null,
                hrtInUse: false,
                gravida: -1, // negativo
                para: 0,
                cesareans: 0,
                abortions: 0,
                livingChildren: 0,
                ectopicPregnancies: 0,
                obstetricNotes: null,
                currentMethod: null,
                currentMethodUsageMonths: null,
                previousMethods: null,
                reproductivePlan: null,
                pelvicSurgeries: null,
                stiHistory: null,
                familyCancerHistory: null,
                _now));
    }

    [Fact]
    public void PreventiveScreeningRecord_Create_ValidatesFields()
    {
        var screening = PreventiveScreeningRecord.Create(
            _clinicId,
            _patientId,
            medicalRecordId: null,
            examType: "pesquisa_hpv",
            performedAt: new DateOnly(2026, 5, 10),
            resultSummary: "Não detectado para tipos 16 e 18",
            classification: "Negativo",
            nextDueDate: new DateOnly(2031, 5, 10),
            _now);

        Assert.Equal("pesquisa_hpv", screening.ExamType);
        Assert.Equal("Não detectado para tipos 16 e 18", screening.ResultSummary);
        Assert.Equal("Negativo", screening.Classification);
        Assert.Equal(new DateOnly(2031, 5, 10), screening.NextDueDate);
    }

    [Fact]
    public void GynecologicalConsultationData_CreateAndUpdate_StructuresPhysicalExamAndPrescription()
    {
        var recordId = Guid.NewGuid();
        var data = GynecologicalConsultationData.Create(recordId, _now);

        Assert.True(data.BreastsIsNormal);
        Assert.True(data.AbdomenIsNormal);
        Assert.True(data.SpeculumExamIsNormal);

        data.Update(
            dum: new DateOnly(2026, 10, 1),
            isDumUncertain: false,
            isMenopausal: false,
            chiefComplaint: "Rotina ginecológica e preventivo",
            hma: "Paciente assintomática em uso de DIU há 2 anos",
            isSexuallyActive: true,
            dyspareunia: "ausente",
            breastsIsNormal: true,
            breastsFindings: null,
            abdomenIsNormal: true,
            abdomenFindings: null,
            externalGenitaliaIsNormal: false,
            externalGenitaliaFindings: "Pequena fissura em fúrcula vulvar posterior",
            speculumExamIsNormal: true,
            speculumExamFindings: null,
            bimanualPalpationIsNormal: true,
            bimanualPalpationFindings: null,
            procedurePerformed: "coleta_citopatologico",
            procedureBatch: "LOTE-2026",
            procedureNotes: "Coleta ecto e endocervical sem intercorrências",
            diagnosesJson: "[{\"code\":\"Z01.4\",\"description\":\"Exame ginecológico geral\",\"isHypothesis\":false}]",
            prescriptionNotes: "Creme cicatrizante na fúrcula vulvar 1x à noite por 7 dias",
            generalOrientationNotes: "Evitar atrito local durante o tratamento. Retorno com resultado do preventivo.",
            _now.AddMinutes(20));

        Assert.Equal(new DateOnly(2026, 10, 1), data.Dum);
        Assert.False(data.IsMenopausal);
        Assert.True(data.BreastsIsNormal);
        Assert.False(data.ExternalGenitaliaIsNormal);
        Assert.Equal("Pequena fissura em fúrcula vulvar posterior", data.ExternalGenitaliaFindings);
        Assert.Equal("coleta_citopatologico", data.ProcedurePerformed);
        Assert.Equal("Creme cicatrizante na fúrcula vulvar 1x à noite por 7 dias", data.PrescriptionNotes);
        Assert.Equal("Evitar atrito local durante o tratamento. Retorno com resultado do preventivo.", data.GeneralOrientationNotes);
    }
}
