using Canamed.Domain.Payments;

namespace Canamed.Application.Abstractions;

public interface ICashRegisterRepository
{
    Task AddShiftAsync(CashRegisterShift shift, CancellationToken cancellationToken = default);

    Task UpdateShiftAsync(CashRegisterShift shift, CancellationToken cancellationToken = default);

    Task<CashRegisterShift?> GetActiveShiftAsync(Guid clinicId, Guid operatorId, CancellationToken cancellationToken = default);

    Task<CashRegisterShift?> GetShiftByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CashRegisterShift>> ListShiftsAsync(Guid clinicId, DateOnly? date = null, CancellationToken cancellationToken = default);

    Task AddMovementAsync(CashMovement movement, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CashMovement>> ListMovementsByShiftAsync(Guid shiftId, Guid clinicId, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
