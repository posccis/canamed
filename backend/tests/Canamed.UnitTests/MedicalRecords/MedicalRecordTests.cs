using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class MedicalRecordTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly Guid _doctorId = Guid.NewGuid();

    [Fact]
    public void Create_InitializesRecord_WithEmAndamentoStatus()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);

        Assert.Equal(MedicalRecordStatus.EmAndamento, record.Status);
        Assert.Equal(_clinicId, record.ClinicId);
        Assert.Equal(_patientId, record.PatientId);
        Assert.Equal(_doctorId, record.DoctorId);
        Assert.Null(record.FinalizedAt);
        Assert.Empty(record.Addenda);
    }

    [Fact]
    public void UpdateDraft_UpdatesSoapFields_WhenStatusIsEmAndamento()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);

        record.UpdateDraft(
            subjective: "Paciente relata dor lombar",
            objective: "Dor à palpação L4-L5",
            assessment: "Lombalgia aguda",
            plan: "Repouso e analgesia",
            clinicalNotes: "Retorno se persistir dor",
            _now.AddMinutes(5));

        Assert.Equal("Paciente relata dor lombar", record.Subjective);
        Assert.Equal("Dor à palpação L4-L5", record.Objective);
        Assert.Equal("Lombalgia aguda", record.Assessment);
        Assert.Equal("Repouso e analgesia", record.Plan);
        Assert.Equal("Retorno se persistir dor", record.ClinicalNotes);
    }

    [Fact]
    public void FinalizeRecord_SetsFinalizadoStatusAndTimestamp()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);
        record.UpdateDraft("Sintomas normais", null, null, null, null, _now);

        record.FinalizeRecord(_doctorId, _now.AddMinutes(15));

        Assert.Equal(MedicalRecordStatus.Finalizado, record.Status);
        Assert.NotNull(record.FinalizedAt);
        Assert.Equal(_doctorId, record.FinalizedBy);
    }

    [Fact]
    public void FinalizeRecord_Throws_WhenAllSectionsAreEmpty()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);

        var ex = Assert.Throws<InvalidOperationException>(() => record.FinalizeRecord(_doctorId, _now));
        Assert.Contains("Preencha ao menos uma seção clínica", ex.Message);
    }

    [Fact]
    public void UpdateDraft_Throws_WhenAlreadyFinalized()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);
        record.UpdateDraft("Sintomas", null, null, null, null, _now);
        record.FinalizeRecord(_doctorId, _now);

        var ex = Assert.Throws<InvalidOperationException>(() =>
            record.UpdateDraft("Nova queixa", null, null, null, null, _now.AddMinutes(20)));

        Assert.Contains("já foi finalizado e não permite alterações diretas", ex.Message);
    }

    [Fact]
    public void AddAddendum_AddsSuccessfully_WhenRecordIsFinalized()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);
        record.UpdateDraft("Sintomas", null, null, null, null, _now);
        record.FinalizeRecord(_doctorId, _now);

        var addendum = record.AddAddendum(_doctorId, "Chegada de exame de sangue", "Leucócitos normais", _now.AddHours(2));

        Assert.Single(record.Addenda);
        Assert.Equal("Chegada de exame de sangue", addendum.Justification);
        Assert.Equal("Leucócitos normais", addendum.Notes);
    }

    [Fact]
    public void AddAddendum_Throws_WhenRecordIsNotFinalized()
    {
        var record = MedicalRecord.Create(_clinicId, _patientId, _doctorId, appointmentId: null, _now);

        var ex = Assert.Throws<InvalidOperationException>(() =>
            record.AddAddendum(_doctorId, "Justificativa", "Texto", _now));

        Assert.Contains("Adendos clínicos só podem ser registrados em prontuários finalizados", ex.Message);
    }
}
