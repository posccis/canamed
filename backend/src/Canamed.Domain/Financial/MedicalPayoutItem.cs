using Canamed.Domain.Common;

namespace Canamed.Domain.Financial;

/// <summary>
/// Item de consulta integrante de um lote de repasse médico (SPEC-0021).
/// </summary>
public sealed class MedicalPayoutItem : Entity
{
    private MedicalPayoutItem()
    {
    }

    public Guid BatchId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public string PatientName { get; private set; } = string.Empty;
    public DateTimeOffset ConsultationDate { get; private set; }
    public decimal GrossAmount { get; private set; }
    public decimal ClinicRetainedAmount { get; private set; }
    public decimal PayoutAmount { get; private set; }

    public static MedicalPayoutItem Create(
        Guid batchId,
        Guid appointmentId,
        string patientName,
        DateTimeOffset consultationDate,
        decimal grossAmount,
        decimal clinicRetainedAmount,
        decimal payoutAmount,
        DateTimeOffset now)
    {
        var item = new MedicalPayoutItem
        {
            BatchId = batchId,
            AppointmentId = appointmentId,
            PatientName = patientName,
            ConsultationDate = consultationDate,
            GrossAmount = grossAmount,
            ClinicRetainedAmount = clinicRetainedAmount,
            PayoutAmount = payoutAmount
        };
        item.MarkCreated(now);
        return item;
    }
}
