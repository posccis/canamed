using Canamed.Application.Queue;
using Canamed.Domain.Queue;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class QueueCallRepository(CanamedDbContext dbContext) : IQueueCallRepository
{
    public async Task AddCallEventAsync(QueueCallEvent evt, CancellationToken cancellationToken = default)
    {
        await dbContext.QueueCallEvents.AddAsync(evt, cancellationToken);
    }

    public async Task<QueueCallEvent?> GetActiveCallAsync(Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.QueueCallEvents
            .Where(q => q.ClinicId == clinicId)
            .OrderByDescending(q => q.CalledAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<QueueCallEvent>> GetRecentCallsAsync(Guid clinicId, int limit = 5, CancellationToken cancellationToken = default)
    {
        return await dbContext.QueueCallEvents
            .Where(q => q.ClinicId == clinicId)
            .OrderByDescending(q => q.CalledAt)
            .Skip(1) // Pula a mais recente que já está em destaque
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<QueueCallEvent?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default)
    {
        return await dbContext.QueueCallEvents
            .FirstOrDefaultAsync(q => q.Id == id && q.ClinicId == clinicId, cancellationToken);
    }

    public Task UpdateAsync(QueueCallEvent evt, CancellationToken cancellationToken = default)
    {
        dbContext.QueueCallEvents.Update(evt);
        return Task.CompletedTask;
    }
}
