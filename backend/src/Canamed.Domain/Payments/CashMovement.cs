using Canamed.Domain.Common;

namespace Canamed.Domain.Payments;

public sealed class CashMovement : Entity
{
    private CashMovement()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid CashRegisterShiftId { get; private set; }
    public Guid OperatorId { get; private set; }
    public string Type { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public string Reason { get; private set; } = string.Empty;

    public static CashMovement Create(
        Guid clinicId,
        Guid shiftId,
        Guid operatorId,
        string type,
        decimal amount,
        string reason,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (shiftId == Guid.Empty)
        {
            throw new ArgumentException("O caixa é obrigatório.", nameof(shiftId));
        }

        if (operatorId == Guid.Empty)
        {
            throw new ArgumentException("O operador é obrigatório.", nameof(operatorId));
        }

        var normalizedType = type?.Trim().ToLowerInvariant();
        if (normalizedType is not (CashMovementTypes.Supply or CashMovementTypes.Withdrawal))
        {
            throw new ArgumentException("Tipo de movimentação inválido. Use 'suprimento' ou 'sangria'.", nameof(type));
        }

        if (amount <= 0)
        {
            throw new ArgumentException("O valor da movimentação deve ser maior que zero.", nameof(amount));
        }

        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 5)
        {
            throw new ArgumentException("O motivo da movimentação deve ter pelo menos 5 caracteres.", nameof(reason));
        }

        var movement = new CashMovement
        {
            ClinicId = clinicId,
            CashRegisterShiftId = shiftId,
            OperatorId = operatorId,
            Type = normalizedType,
            Amount = amount,
            Reason = reason.Trim(),
        };

        movement.MarkCreated(now);
        return movement;
    }
}
