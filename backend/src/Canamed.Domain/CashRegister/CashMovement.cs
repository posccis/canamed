using Canamed.Domain.Common;

namespace Canamed.Domain.CashRegister;

/// <summary>
/// Movimentação avulsa de caixa (Sangria ou Suprimento) — SPEC-0019.
/// </summary>
public sealed class CashMovement : Entity
{
    private CashMovement()
    {
    }

    public Guid CashSessionId { get; private set; }
    public Guid ClinicId { get; private set; }
    public string MovementType { get; private set; } = string.Empty; // sangria, suprimento
    public decimal Amount { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public Guid PerformedByUserId { get; private set; }

    public static CashMovement Create(
        Guid cashSessionId,
        Guid clinicId,
        string movementType,
        decimal amount,
        string reason,
        Guid performedByUserId,
        DateTimeOffset now)
    {
        var movement = new CashMovement
        {
            CashSessionId = cashSessionId,
            ClinicId = clinicId,
            MovementType = movementType.ToLowerInvariant(),
            Amount = amount,
            Reason = reason,
            PerformedByUserId = performedByUserId
        };
        movement.MarkCreated(now);
        return movement;
    }
}
