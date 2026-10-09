using Canamed.Domain.Notifications;

namespace Canamed.Application.Notifications;

public interface INotificationRepository
{
    Task AddNotificationAsync(AppointmentNotification notification, CancellationToken cancellationToken = default);
    Task UpdateNotificationAsync(AppointmentNotification notification, CancellationToken cancellationToken = default);
    Task<AppointmentNotification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AppointmentNotification?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AppointmentNotification>> GetByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AppointmentNotification>> GetPendingNotificationsAsync(DateTimeOffset maxDueTime, CancellationToken cancellationToken = default);
    Task<PatientCommunicationPreference?> GetPreferenceByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default);
    Task<PatientCommunicationPreference?> GetPreferenceByPhoneAsync(string phone, CancellationToken cancellationToken = default);
    Task SavePreferenceAsync(PatientCommunicationPreference preference, CancellationToken cancellationToken = default);
}
