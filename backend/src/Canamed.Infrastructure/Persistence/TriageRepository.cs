using Canamed.Application.Abstractions;
using Canamed.Domain.Queue;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class TriageRepository(CanamedDbContext context) : ITriageRepository
{
    public Task<TriageRecord?> GetByQueueEntryIdAsync(
        Guid queueEntryId,
        Guid clinicId,
        CancellationToken cancellationToken = default) =>
        context.Set<TriageRecord>()
            .FirstOrDefaultAsync(t => t.QueueEntryId == queueEntryId && t.ClinicId == clinicId, cancellationToken);

    public async Task AddAsync(TriageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        await context.Set<TriageRecord>().AddAsync(record, cancellationToken).ConfigureAwait(false);
    }

    public Task UpdateAsync(TriageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        context.Set<TriageRecord>().Update(record);
        return Task.CompletedTask;
    }
}
