using Canamed.Domain.Queue;

namespace Canamed.Application.Queue;

public interface IQueueCallRepository
{
    Task AddCallEventAsync(QueueCallEvent evt, CancellationToken cancellationToken = default);
    Task<QueueCallEvent?> GetActiveCallAsync(Guid clinicId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QueueCallEvent>> GetRecentCallsAsync(Guid clinicId, int limit = 5, CancellationToken cancellationToken = default);
    Task<QueueCallEvent?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);
    Task UpdateAsync(QueueCallEvent evt, CancellationToken cancellationToken = default);
}

public sealed record TriggerCallRequest(
    Guid ClinicId,
    Guid QueueEntryId,
    string TicketCode,
    string PatientName,
    string RoomName,
    string ProfessionalName,
    bool IsPreferential);

public sealed record QueueCallEventDto(
    Guid Id,
    Guid ClinicId,
    Guid QueueEntryId,
    string TicketCode,
    string PatientName,
    string RoomName,
    string ProfessionalName,
    bool IsPreferential,
    int CallCount,
    DateTimeOffset CalledAt);

public sealed record TvDisplayStateDto(
    Guid ClinicId,
    QueueCallEventDto? ActiveCall,
    IReadOnlyList<QueueCallEventDto> RecentCalls,
    DateTimeOffset ServerTime);
