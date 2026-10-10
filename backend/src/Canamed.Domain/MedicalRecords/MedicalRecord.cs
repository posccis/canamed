using Canamed.Domain.Common;

namespace Canamed.Domain.MedicalRecords;

public sealed class MedicalRecord : Entity
{
    private readonly List<MedicalRecordAddendum> _addenda = [];

    private MedicalRecord()
    {
    }

    public Guid ClinicId { get; private set; }

    public Guid PatientId { get; private set; }

    public Guid DoctorId { get; private set; }

    public Guid? AppointmentId { get; private set; }

    public string Status { get; private set; } = MedicalRecordStatus.EmAndamento;

    public string? Subjective { get; private set; }

    public string? Objective { get; private set; }

    public string? Assessment { get; private set; }

    public string? Plan { get; private set; }

    public string? ClinicalNotes { get; private set; }

    public DateTimeOffset? FinalizedAt { get; private set; }

    public Guid? FinalizedBy { get; private set; }

    public IReadOnlyList<MedicalRecordAddendum> Addenda => _addenda.AsReadOnly();

    public GynecologicalConsultationData? GynecologicalData { get; private set; }

    public static MedicalRecord Create(
        Guid clinicId,
        Guid patientId,
        Guid doctorId,
        Guid? appointmentId,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("O paciente é obrigatório.", nameof(patientId));
        }

        if (doctorId == Guid.Empty)
        {
            throw new ArgumentException("O profissional de saúde é obrigatório.", nameof(doctorId));
        }

        var record = new MedicalRecord
        {
            ClinicId = clinicId,
            PatientId = patientId,
            DoctorId = doctorId,
            AppointmentId = appointmentId,
            Status = MedicalRecordStatus.EmAndamento
        };

        record.MarkCreated(now);
        return record;
    }

    public void UpdateDraft(
        string? subjective,
        string? objective,
        string? assessment,
        string? plan,
        string? clinicalNotes,
        DateTimeOffset now)
    {
        if (Status == MedicalRecordStatus.Finalizado)
        {
            throw new InvalidOperationException("Este prontuário já foi finalizado e não permite alterações diretas.");
        }

        Subjective = subjective?.Trim();
        Objective = objective?.Trim();
        Assessment = assessment?.Trim();
        Plan = plan?.Trim();
        ClinicalNotes = clinicalNotes?.Trim();

        MarkUpdated(now);
    }

    public void FinalizeRecord(Guid finalizedBy, DateTimeOffset now)
    {
        if (Status == MedicalRecordStatus.Finalizado)
        {
            throw new InvalidOperationException("O prontuário já está finalizado.");
        }

        if (finalizedBy == Guid.Empty)
        {
            throw new ArgumentException("O usuário responsável pela finalização é obrigatório.", nameof(finalizedBy));
        }

        if (string.IsNullOrWhiteSpace(Subjective) &&
            string.IsNullOrWhiteSpace(Objective) &&
            string.IsNullOrWhiteSpace(Assessment) &&
            string.IsNullOrWhiteSpace(Plan) &&
            string.IsNullOrWhiteSpace(ClinicalNotes))
        {
            throw new InvalidOperationException("Preencha ao menos uma seção clínica do atendimento antes de finalizar.");
        }

        Status = MedicalRecordStatus.Finalizado;
        FinalizedAt = now.ToUniversalTime();
        FinalizedBy = finalizedBy;
        MarkUpdated(now);
    }

    public MedicalRecordAddendum AddAddendum(Guid doctorId, string justification, string notes, DateTimeOffset now)
    {
        if (Status != MedicalRecordStatus.Finalizado)
        {
            throw new InvalidOperationException("Adendos clínicos só podem ser registrados em prontuários finalizados.");
        }

        var addendum = MedicalRecordAddendum.Create(Id, doctorId, justification, notes, now);
        _addenda.Add(addendum);
        MarkUpdated(now);
        return addendum;
    }
}
