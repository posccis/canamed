using Canamed.Application.Notifications;
using Canamed.Domain.Notifications;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

public sealed class NotificationRepository(CanamedDbContext dbContext) : INotificationRepository
{
    public async Task AddNotificationAsync(AppointmentNotification notification, CancellationToken cancellationToken = default)
    {
        await dbContext.AppointmentNotifications.AddAsync(notification, cancellationToken);
    }

    public Task UpdateNotificationAsync(AppointmentNotification notification, CancellationToken cancellationToken = default)
    {
        dbContext.AppointmentNotifications.Update(notification);
        return Task.CompletedTask;
    }

    public async Task<AppointmentNotification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.AppointmentNotifications.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<AppointmentNotification?> GetByIdempotencyKeyAsync(string idempotencyKey, CancellationToken cancellationToken = default)
    {
        return await dbContext.AppointmentNotifications.FirstOrDefaultAsync(n => n.IdempotencyKey == idempotencyKey, cancellationToken);
    }

    public async Task<IReadOnlyList<AppointmentNotification>> GetByAppointmentIdAsync(Guid appointmentId, CancellationToken cancellationToken = default)
    {
        return await dbContext.AppointmentNotifications
            .Where(n => n.AppointmentId == appointmentId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AppointmentNotification>> GetPendingNotificationsAsync(DateTimeOffset maxDueTime, CancellationToken cancellationToken = default)
    {
        return await dbContext.AppointmentNotifications
            .Where(n => n.Status == NotificationStatus.Pending && n.CreatedAt <= maxDueTime)
            .OrderBy(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PatientCommunicationPreference?> GetPreferenceByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        return await dbContext.PatientCommunicationPreferences
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);
    }

    public async Task<PatientCommunicationPreference?> GetPreferenceByPhoneAsync(string phone, CancellationToken cancellationToken = default)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        var patient = await dbContext.Patients.FirstOrDefaultAsync(p => p.Phone.Contains(digits), cancellationToken);
        if (patient is null)
            return null;

        return await dbContext.PatientCommunicationPreferences
            .FirstOrDefaultAsync(p => p.PatientId == patient.Id, cancellationToken);
    }

    public async Task SavePreferenceAsync(PatientCommunicationPreference preference, CancellationToken cancellationToken = default)
    {
        var existing = await dbContext.PatientCommunicationPreferences
            .FirstOrDefaultAsync(p => p.Id == preference.Id || p.PatientId == preference.PatientId, cancellationToken);

        if (existing is null)
        {
            await dbContext.PatientCommunicationPreferences.AddAsync(preference, cancellationToken);
        }
        else
        {
            dbContext.PatientCommunicationPreferences.Update(preference);
        }
    }
}
