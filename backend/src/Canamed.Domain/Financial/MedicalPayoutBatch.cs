using Canamed.Domain.Common;

namespace Canamed.Domain.Financial;

/// <summary>
/// Lote de repasse médico consolidado por período para liquidação financeira (SPEC-0021).
/// </summary>
public sealed class MedicalPayoutBatch : Entity
{
    private readonly List<MedicalPayoutItem> _items = [];

    private MedicalPayoutBatch()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public DateTimeOffset PeriodStart { get; private set; }
    public DateTimeOffset PeriodEnd { get; private set; }
    public string Status { get; private set; } = "aberto"; // aberto, liquidado
    public decimal TotalGross { get; private set; }
    public decimal TotalClinicRetained { get; private set; }
    public decimal TotalPayoutAmount { get; private set; }
    public DateTimeOffset? SettledAt { get; private set; }
    public string? SettlementNotes { get; private set; }
    public string? ReceiptReference { get; private set; }

    public IReadOnlyCollection<MedicalPayoutItem> Items => _items.AsReadOnly();

    public static MedicalPayoutBatch Create(
        Guid clinicId,
        Guid professionalId,
        DateTimeOffset periodStart,
        DateTimeOffset periodEnd,
        DateTimeOffset now)
    {
        var batch = new MedicalPayoutBatch
        {
            ClinicId = clinicId,
            ProfessionalId = professionalId,
            PeriodStart = periodStart,
            PeriodEnd = periodEnd,
            Status = "aberto"
        };
        batch.MarkCreated(now);
        return batch;
    }

    public void AddItem(
        Guid appointmentId,
        string patientName,
        DateTimeOffset consultationDate,
        decimal grossAmount,
        decimal retainedAmount,
        decimal payoutAmount,
        DateTimeOffset now)
    {
        if (Status != "aberto") throw new InvalidOperationException("Não é possível adicionar itens a um lote de repasse liquidado.");

        var item = MedicalPayoutItem.Create(Id, appointmentId, patientName, consultationDate, grossAmount, retainedAmount, payoutAmount, now);
        _items.Add(item);

        TotalGross += grossAmount;
        TotalClinicRetained += retainedAmount;
        TotalPayoutAmount += payoutAmount;

        MarkUpdated(now);
    }

    /// <summary>Liquida o lote de repasse registrando o pagamento efetuado ao profissional.</summary>
    public void Settle(string? receiptReference, string? notes, DateTimeOffset now)
    {
        if (Status != "aberto") throw new InvalidOperationException("Este lote de repasse já se encontra liquidado.");

        Status = "liquidado";
        SettledAt = now;
        ReceiptReference = receiptReference?.Trim();
        SettlementNotes = notes?.Trim();

        MarkUpdated(now);
    }
}
