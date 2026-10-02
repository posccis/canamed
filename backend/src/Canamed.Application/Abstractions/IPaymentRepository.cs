using Canamed.Domain.Payments;

namespace Canamed.Application.Abstractions;

public interface IPaymentRepository
{
    Task AddAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default);

    Task<PaymentTransaction?> GetByIdAsync(Guid id, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PaymentTransaction>> ListByAppointmentAsync(Guid appointmentId, Guid clinicId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PaymentTransaction>> ListByDateAsync(DateOnly date, Guid clinicId, CancellationToken cancellationToken = default);

    Task UpdateAsync(PaymentTransaction transaction, CancellationToken cancellationToken = default);
}
