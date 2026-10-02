using Canamed.Domain.Queue;

namespace Canamed.Application.Abstractions;

public interface ITriageRepository
{
    Task<TriageRecord?> GetByQueueEntryIdAsync(Guid queueEntryId, Guid clinicId, CancellationToken cancellationToken = default);

    Task AddAsync(TriageRecord record, CancellationToken cancellationToken = default);

    Task UpdateAsync(TriageRecord record, CancellationToken cancellationToken = default);
}
