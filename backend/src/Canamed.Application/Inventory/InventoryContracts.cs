using Canamed.Domain.Inventory;

namespace Canamed.Application.Inventory;

public interface IInventoryRepository
{
    Task AddAsync(InventoryItem item, CancellationToken cancellationToken = default);
    Task<InventoryItem?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryItem>> ListAsync(Guid clinicId, string? category = null, string? search = null, CancellationToken cancellationToken = default);
    Task UpdateAsync(InventoryItem item, CancellationToken cancellationToken = default);

    Task AddMovementAsync(InventoryMovement movement, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<InventoryMovement>> ListMovementsAsync(Guid itemId, Guid clinicId, CancellationToken cancellationToken = default);
}

public sealed record CreateInventoryItemRequest(
    Guid ClinicId,
    string Name,
    string Category,
    string Unit,
    decimal InitialQuantity,
    decimal MinimumQuantity,
    string? LotNumber,
    DateTimeOffset? ExpirationDate);

public sealed record UpdateInventoryItemRequest(
    string Name,
    string Category,
    string Unit,
    decimal MinimumQuantity,
    string? LotNumber,
    DateTimeOffset? ExpirationDate);

public sealed record InventoryMovementRequest(
    decimal Quantity,
    decimal? UnitPrice,
    string Reason);

public sealed record InventoryItemDto(
    Guid Id,
    Guid ClinicId,
    string Name,
    string Category,
    string Unit,
    decimal CurrentQuantity,
    decimal MinimumQuantity,
    string? LotNumber,
    DateTimeOffset? ExpirationDate,
    bool IsBelowMinimum,
    bool IsExpired,
    bool IsExpiringSoon);

public sealed record InventoryMovementDto(
    Guid Id,
    Guid InventoryItemId,
    Guid ClinicId,
    string MovementType,
    decimal Quantity,
    decimal? UnitPrice,
    string Reason,
    Guid PerformedByUserId,
    DateTimeOffset CreatedAt);

public sealed record InventoryAlertsDto(
    Guid ClinicId,
    IReadOnlyList<InventoryItemDto> BelowMinimum,
    IReadOnlyList<InventoryItemDto> ExpiringSoon,
    IReadOnlyList<InventoryItemDto> Expired);
