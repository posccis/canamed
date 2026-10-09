using Canamed.Application.Abstractions;
using Canamed.Application.Errors;
using Canamed.Application.Identity;
using Canamed.Domain.Auditing;
using Canamed.Domain.Inventory;

namespace Canamed.Application.Inventory;

public sealed class InventoryService
{
    private readonly IInventoryRepository _repository;
    private readonly IAuditRepository _auditRepository;
    private readonly ICurrentActorAccessor _actorAccessor;
    private readonly TimeProvider _timeProvider;
    private readonly IUnitOfWork _unitOfWork;

    public InventoryService(
        IInventoryRepository repository,
        IAuditRepository auditRepository,
        ICurrentActorAccessor actorAccessor,
        TimeProvider timeProvider,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _auditRepository = auditRepository;
        _actorAccessor = actorAccessor;
        _timeProvider = timeProvider;
        _unitOfWork = unitOfWork;
    }

    public async Task<InventoryItemDto> CreateItemAsync(
        CreateInventoryItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            if (!Guid.TryParse(actor.UserId, out var userId) || userId == Guid.Empty)
            {
                userId = Guid.NewGuid();
            }

            var item = InventoryItem.Create(
                request.ClinicId,
                request.Name,
                request.Category,
                request.Unit,
                request.InitialQuantity,
                request.MinimumQuantity,
                request.LotNumber,
                request.ExpirationDate,
                now);

            await _repository.AddAsync(item, ct);

            if (request.InitialQuantity > 0)
            {
                var initialMv = InventoryMovement.Create(
                    item.Id,
                    request.ClinicId,
                    "entrada",
                    request.InitialQuantity,
                    null,
                    "Carga inicial de estoque",
                    userId,
                    now);
                await _repository.AddMovementAsync(initialMv, ct);
            }

            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "InventoryItemCreated",
                "InventoryItem",
                item.Id.ToString(),
                now,
                $"{{\"name\":\"{item.Name}\",\"initialQuantity\":{item.CurrentQuantity}}}"));

            return MapToDto(item, now);
        }, cancellationToken);
    }

    public async Task<InventoryItemDto> UpdateItemAsync(
        Guid id,
        Guid clinicId,
        UpdateInventoryItemRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var item = await _repository.GetByIdAsync(id, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Item de estoque não encontrado.", "INVENTORY_ITEM_NOT_FOUND");

            item.UpdateDetails(
                request.Name,
                request.Category,
                request.Unit,
                request.MinimumQuantity,
                request.LotNumber,
                request.ExpirationDate,
                now);

            await _repository.UpdateAsync(item, ct);
            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "InventoryItemUpdated",
                "InventoryItem",
                item.Id.ToString(),
                now,
                $"{{\"name\":\"{item.Name}\"}}"));

            return MapToDto(item, now);
        }, cancellationToken);
    }

    public async Task<InventoryItemDto> RegisterEntryAsync(
        Guid id,
        Guid clinicId,
        InventoryMovementRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var item = await _repository.GetByIdAsync(id, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Item de estoque não encontrado.", "INVENTORY_ITEM_NOT_FOUND");

            if (!Guid.TryParse(actor.UserId, out var userId) || userId == Guid.Empty)
            {
                userId = Guid.NewGuid();
            }

            item.AddStock(request.Quantity, now);
            var movement = InventoryMovement.Create(
                item.Id,
                clinicId,
                "entrada",
                request.Quantity,
                request.UnitPrice,
                request.Reason,
                userId,
                now);

            await _repository.AddMovementAsync(movement, ct);
            await _repository.UpdateAsync(item, ct);

            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "InventoryStockAdded",
                "InventoryItem",
                item.Id.ToString(),
                now,
                $"{{\"quantity\":{request.Quantity},\"newTotal\":{item.CurrentQuantity}}}"));

            return MapToDto(item, now);
        }, cancellationToken);
    }

    public async Task<InventoryItemDto> RegisterExitAsync(
        Guid id,
        Guid clinicId,
        InventoryMovementRequest request,
        CancellationToken cancellationToken = default)
    {
        var actor = _actorAccessor.RequireActor();
        var now = _timeProvider.GetUtcNow();

        return await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            var item = await _repository.GetByIdAsync(id, clinicId, ct)
                ?? throw new CanamedException(ProblemKind.NotFound, "Não encontrado", "Item de estoque não encontrado.", "INVENTORY_ITEM_NOT_FOUND");

            if (!Guid.TryParse(actor.UserId, out var userId) || userId == Guid.Empty)
            {
                userId = Guid.NewGuid();
            }

            item.ConsumeStock(request.Quantity, now);
            var movement = InventoryMovement.Create(
                item.Id,
                clinicId,
                "saida",
                request.Quantity,
                null,
                request.Reason,
                userId,
                now);

            await _repository.AddMovementAsync(movement, ct);
            await _repository.UpdateAsync(item, ct);

            _auditRepository.Add(AuditEvent.Record(
                actor.ClinicId,
                actor.UserId,
                actor.Name ?? "Operador",
                "InventoryStockConsumed",
                "InventoryItem",
                item.Id.ToString(),
                now,
                $"{{\"quantity\":{request.Quantity},\"newTotal\":{item.CurrentQuantity}}}"));

            return MapToDto(item, now);
        }, cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryItemDto>> ListAsync(
        Guid clinicId,
        string? category = null,
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var items = await _repository.ListAsync(clinicId, category, search, cancellationToken);
        return items.Select(i => MapToDto(i, now)).ToList();
    }

    public async Task<InventoryAlertsDto> GetAlertsAsync(
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        var items = await _repository.ListAsync(clinicId, null, null, cancellationToken);

        var belowMin = items.Where(i => i.IsBelowMinimum()).Select(i => MapToDto(i, now)).ToList();
        var expiringSoon = items.Where(i => i.IsExpiringSoon(now, 30)).Select(i => MapToDto(i, now)).ToList();
        var expired = items.Where(i => i.IsExpired(now)).Select(i => MapToDto(i, now)).ToList();

        return new InventoryAlertsDto(clinicId, belowMin, expiringSoon, expired);
    }

    private static InventoryItemDto MapToDto(InventoryItem i, DateTimeOffset now) =>
        new(
            i.Id,
            i.ClinicId,
            i.Name,
            i.Category,
            i.Unit,
            i.CurrentQuantity,
            i.MinimumQuantity,
            i.LotNumber,
            i.ExpirationDate,
            i.IsBelowMinimum(),
            i.IsExpired(now),
            i.IsExpiringSoon(now, 30));
}
