using Canamed.Domain.Common;

namespace Canamed.Domain.Financial;

/// <summary>
/// Lançamento financeiro de receita ou despesa operacional da clínica para DRE (SPEC-0021).
/// </summary>
public sealed class FinancialTransaction : Entity
{
    private FinancialTransaction()
    {
    }

    public Guid ClinicId { get; private set; }
    public string Type { get; private set; } = "despesa"; // receita, despesa, repasse
    public string Category { get; private set; } = string.Empty; // Insumos, Aluguel, Utilidades, Pessoal, Consultas, Outros
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public DateTimeOffset DueDate { get; private set; }
    public DateTimeOffset CompetenceDate { get; private set; }
    public string Status { get; private set; } = "pago"; // pendente, pago, cancelado
    public DateTimeOffset? PaidAt { get; private set; }

    public static FinancialTransaction Create(
        Guid clinicId,
        string type,
        string category,
        string description,
        decimal amount,
        DateTimeOffset dueDate,
        DateTimeOffset competenceDate,
        string status,
        DateTimeOffset? paidAt,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty) throw new ArgumentException("Clínica obrigatória.", nameof(clinicId));
        if (string.IsNullOrWhiteSpace(description)) throw new ArgumentException("Descrição obrigatória.", nameof(description));
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Valor deve ser maior que zero.");

        var tx = new FinancialTransaction
        {
            ClinicId = clinicId,
            Type = type.ToLowerInvariant(),
            Category = category.Trim(),
            Description = description.Trim(),
            Amount = amount,
            DueDate = dueDate,
            CompetenceDate = competenceDate,
            Status = status.ToLowerInvariant(),
            PaidAt = paidAt ?? (status.ToLowerInvariant() == "pago" ? now : null)
        };
        tx.MarkCreated(now);
        return tx;
    }

    public void MarkPaid(DateTimeOffset now)
    {
        Status = "pago";
        PaidAt = now;
        MarkUpdated(now);
    }
}
