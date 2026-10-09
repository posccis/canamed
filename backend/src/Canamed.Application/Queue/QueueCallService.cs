using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Domain.Queue;

namespace Canamed.Application.Queue;

public sealed class QueueCallService
{
    private readonly IQueueCallRepository _repository;
    private readonly TimeProvider _timeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public QueueCallService(
        IQueueCallRepository repository,
        TimeProvider timeProvider,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _timeProvider = timeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<QueueCallEventDto> TriggerCallAsync(
        TriggerCallRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var evt = QueueCallEvent.Create(
                request.ClinicId,
                request.QueueEntryId,
                request.TicketCode,
                request.PatientName,
                request.RoomName,
                request.ProfessionalName,
                request.IsPreferential,
                now);

            await _repository.AddCallEventAsync(evt, ct);
            return MapToDto(evt);
        }, cancellationToken);
    }

    public async Task<QueueCallEventDto> RecallAsync(
        Guid callEventId,
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var evt = await _repository.GetByIdAsync(callEventId, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Evento de chamada não encontrado.", "CALL_EVENT_NOT_FOUND");

            evt.Recall(now);
            await _repository.UpdateAsync(evt, ct);
            return MapToDto(evt);
        }, cancellationToken);
    }

    public async Task<TvDisplayStateDto> GetTvDisplayStateAsync(
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var active = await _repository.GetActiveCallAsync(clinicId, cancellationToken);
        var recent = await _repository.GetRecentCallsAsync(clinicId, 5, cancellationToken);

        return new TvDisplayStateDto(
            clinicId,
            active is null ? null : MapToDto(active),
            recent.Select(MapToDto).ToList(),
            now);
    }

    private static QueueCallEventDto MapToDto(QueueCallEvent e) =>
        new(
            e.Id,
            e.ClinicId,
            e.QueueEntryId,
            e.TicketCode,
            e.PatientName,
            e.RoomName,
            e.ProfessionalName,
            e.IsPreferential,
            e.CallCount,
            e.CalledAt);
}
