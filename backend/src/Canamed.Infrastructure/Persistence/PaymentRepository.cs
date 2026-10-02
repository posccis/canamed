using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class PaymentRepository(CanamedDbContext context) : IPaymentRepository
{
    public async Task AddAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        await context.Set<PaymentTransaction>().AddAsync(transaction, cancellationToken).ConfigureAwait(false);
    }

    public Task<PaymentTransaction?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default) =>
        context.Set<PaymentTransaction>()
            .FirstOrDefaultAsync(t => t.Id == id && t.ClinicId == clinicId, cancellationToken);

    public async Task<IReadOnlyList<PaymentTransaction>> ListByAppointmentAsync(
        Guid appointmentId,
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var list = await context.Set<PaymentTransaction>()
            .Where(t => t.AppointmentId == appointmentId && t.ClinicId == clinicId)
            .OrderByDescending(t => t.PaidAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return list;
    }

    public async Task<IReadOnlyList<PaymentTransaction>> ListByDateAsync(
        DateOnly date,
        Guid clinicId,
        CancellationToken cancellationToken = default)
    {
        var (startUtc, endUtc) = AgendaTimeZone.LocalDayToUtcRange(date);

        var list = await context.Set<PaymentTransaction>()
            .Where(t => t.ClinicId == clinicId && t.PaidAt >= startUtc && t.PaidAt < endUtc)
            .OrderByDescending(t => t.PaidAt)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return list;
    }

    public Task UpdateAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(transaction);
        context.Set<PaymentTransaction>().Update(transaction);
        return Task.CompletedTask;
    }
}
