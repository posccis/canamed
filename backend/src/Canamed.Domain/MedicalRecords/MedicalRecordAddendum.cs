namespace Canamed.Domain.MedicalRecords;

public sealed class MedicalRecordAddendum
{
    private MedicalRecordAddendum()
    {
    }

    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid MedicalRecordId { get; private set; }

    public Guid DoctorId { get; private set; }

    public string Justification { get; private set; } = string.Empty;

    public string Notes { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; }

    public static MedicalRecordAddendum Create(
        Guid medicalRecordId,
        Guid doctorId,
        string justification,
        string notes,
        DateTimeOffset now)
    {
        if (medicalRecordId == Guid.Empty)
        {
            throw new ArgumentException("O identificador do prontuário é obrigatório.", nameof(medicalRecordId));
        }

        if (doctorId == Guid.Empty)
        {
            throw new ArgumentException("O profissional responsável pelo adendo é obrigatório.", nameof(doctorId));
        }

        if (string.IsNullOrWhiteSpace(justification))
        {
            throw new ArgumentException("A justificativa para a inclusão do adendo clínico é obrigatória.", nameof(justification));
        }

        if (string.IsNullOrWhiteSpace(notes))
        {
            throw new ArgumentException("O conteúdo do adendo clínico não pode ser vazio.", nameof(notes));
        }

        return new MedicalRecordAddendum
        {
            Id = Guid.NewGuid(),
            MedicalRecordId = medicalRecordId,
            DoctorId = doctorId,
            Justification = justification.Trim(),
            Notes = notes.Trim(),
            CreatedAt = now.ToUniversalTime()
        };
    }
}
