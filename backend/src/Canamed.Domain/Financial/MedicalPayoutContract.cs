using Canamed.Domain.Common;

namespace Canamed.Domain.Financial;

/// <summary>
/// Contrato comercial de repasse médico configurado por profissional e clínica (SPEC-0021).
/// </summary>
public sealed class MedicalPayoutContract : Entity
{
    private MedicalPayoutContract()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid ProfessionalId { get; private set; }
    public string PayoutType { get; private set; } = "percentage"; // percentage, fixed
    public decimal Value { get; private set; } // ex: 70.00 (%) ou 85.00 (R$)
    public bool IsActive { get; private set; } = true;

    public static MedicalPayoutContract Create(
        Guid clinicId,
        Guid professionalId,
        string payoutType,
        decimal value,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty) throw new ArgumentException("Clínica obrigatória.", nameof(clinicId));
        if (professionalId == Guid.Empty) throw new ArgumentException("Profissional obrigatório.", nameof(professionalId));
        if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "Valor do contrato não pode ser negativo.");

        var contract = new MedicalPayoutContract
        {
            ClinicId = clinicId,
            ProfessionalId = professionalId,
            PayoutType = payoutType.ToLowerInvariant() == "fixed" ? "fixed" : "percentage",
            Value = value,
            IsActive = true
        };
        contract.MarkCreated(now);
        return contract;
    }

    public void Update(string payoutType, decimal value, bool isActive, DateTimeOffset now)
    {
        if (value < 0) throw new ArgumentOutOfRangeException(nameof(value), "Valor do contrato não pode ser negativo.");
        PayoutType = payoutType.ToLowerInvariant() == "fixed" ? "fixed" : "percentage";
        Value = value;
        IsActive = isActive;
        MarkUpdated(now);
    }

    /// <summary>Calcula o valor líquido do repasse médico para uma consulta com determinado valor bruto faturado.</summary>
    public (decimal payoutAmount, decimal retainedAmount) CalculatePayout(decimal grossAmount)
    {
        if (grossAmount <= 0) return (0, 0);

        if (PayoutType == "fixed")
        {
            var payout = Math.Min(Value, grossAmount);
            var retained = grossAmount - payout;
            return (payout, retained);
        }
        else // percentage
        {
            var payout = Math.Round(grossAmount * (Value / 100m), 2);
            var retained = grossAmount - payout;
            return (payout, retained);
        }
    }
}
