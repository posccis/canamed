using Canamed.Domain.Common;

namespace Canamed.Domain.Inventory;

/// <summary>
/// Movimentação rastreável de estoque (Entrada, Saída, Descarte ou Ajuste) — SPEC-0022.
/// </summary>
public sealed class InventoryMovement : Entity
{
    private InventoryMovement()
    {
    }

    public Guid InventoryItemId { get; private set; }
    public Guid ClinicId { get; private set; }
    public string MovementType { get; private set; } = string.Empty; // entrada, saida, descarte, ajuste
    public decimal Quantity { get; private set; }
    public decimal? UnitPrice { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public Guid PerformedByUserId { get; private set; }

    public static InventoryMovement Create(
        Guid inventoryItemId,
        Guid clinicId,
        string movementType,
        decimal quantity,
        decimal? unitPrice,
        string reason,
        Guid performedByUserId,
        DateTimeOffset now)
    {
        if (inventoryItemId == Guid.Empty) throw new ArgumentException("Item obrigatório.", nameof(inventoryItemId));
        if (clinicId == Guid.Empty) throw new ArgumentException("Clínica obrigatória.", nameof(clinicId));
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantidade deve ser positiva.");
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Motivo da movimentação obrigatório.", nameof(reason));

        var movement = new InventoryMovement
        {
            InventoryItemId = inventoryItemId,
            ClinicId = clinicId,
            MovementType = movementType.ToLowerInvariant(),
            Quantity = quantity,
            UnitPrice = unitPrice,
            Reason = reason.Trim(),
            PerformedByUserId = performedByUserId
        };
        movement.MarkCreated(now);
        return movement;
    }
}
