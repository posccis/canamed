using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class CashRegisterRepository(CanamedDbContext context) : ICashRegisterRepository
{
    public async Task AddShiftAsync(CashRegisterShift shift, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(shift);
        await context.CashRegisterShifts.AddAsync(shift, cancellationToken).ConfigureAwait(false);
    }

    public Task UpdateShiftAsync(CashRegisterShift shift, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(shift);
        context.CashRegisterShifts.Update(shift);
        return Task.CompletedTask;
    }

    public Task<CashRegisterShift?> GetActiveShiftAsync(
        Guid clinicId,
        Guid operatorId,
        CancellationToken cancellationToken = default) =>
        context.CashRegisterShifts
            .FirstOrDefaultAsync(
                s => s.ClinicId == clinicId
                    && s.OperatorId == operatorId
                    && s.Status == CashRegisterStatuses.Open,
                cancellationToken);

    public Task<CashRegisterShift?> GetShiftByIdAsync(
        Guid id,
        Guid clinicId,
        CancellationToken cancellationToken = default) =>
        context.CashRegisterShifts
            .FirstOrDefaultAsync(s => s.Id == id && s.ClinicId == clinicId, cancellationToken);

    public async Task<IReadOnlyList<CashRegisterShift>> ListShiftsAsync(
        Guid clinicId,
        DateOnly? date = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.CashRegisterShifts.Where(s => s.ClinicId == clinicId);

        if (date.HasValue)
        {
            var (startUtc, endUtc) = AgendaTimeZone.LocalDayToUtcRange(date.Value);
            query = query.Where(s => s.OpenedAt >= startUtc && s.OpenedAt < endUtc);
        }

        return await query
            .OrderByDescending(s => s.OpenedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task AddMovementAsync(CashMovement movement, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(movement);
        await context.CashMovements.AddAsync(movement, cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<CashMovement>> ListMovementsByShiftAsync(
        Guid shiftId,
        Guid clinicId,
        CancellationToken cancellationToken = default) =>
        await context.CashMovements
            .Where(m => m.CashRegisterShiftId == shiftId && m.ClinicId == clinicId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        context.SaveChangesAsync(cancellationToken);
}
