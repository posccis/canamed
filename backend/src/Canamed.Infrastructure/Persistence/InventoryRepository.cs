using Canamed.Application.Inventory;
using Canamed.Domain.Inventory;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class InventoryRepository(CanamedDbContext dbContext) : IInventoryRepository
{
    public async Task AddAsync(InventoryItem item, CancellationToken cancellationToken = default)
    {
        await dbContext.InventoryItems.AddAsync(item, cancellationToken);
    }

    public async Task<InventoryItem?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.InventoryItems
            .FirstOrDefaultAsync(i => i.Id == id && i.ClinicId == clinicId, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryItem>> ListAsync(Guid clinicId, string? category = null, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.InventoryItems.Where(i => i.ClinicId == clinicId);

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(i => i.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(i => EF.Functions.ILike(i.Name, $"%{search}%"));
        }

        return await query.OrderBy(i => i.Name).ToListAsync(cancellationToken);
    }

    public Task UpdateAsync(InventoryItem item, CancellationToken cancellationToken = default)
    {
        dbContext.InventoryItems.Update(item);
        return Task.CompletedTask;
    }

    public async Task AddMovementAsync(InventoryMovement movement, CancellationToken cancellationToken = default)
    {
        await dbContext.InventoryMovements.AddAsync(movement, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryMovement>> ListMovementsAsync(Guid itemId, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.InventoryMovements
            .Where(m => m.InventoryItemId == itemId && m.ClinicId == clinicId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
