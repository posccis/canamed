using Canamed.Domain.Notifications;
using Xunit;

namespace Canamed.UnitTests.Notifications;

public sealed class AppointmentNotificationTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _appointmentId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();

    [Fact]
    public void CreateNotification_GeneratesCorrectIdempotencyKeyAndPendingStatus()
    {
        var notif = AppointmentNotification.Create(
            _clinicId,
            _appointmentId,
            _patientId,
            NotificationChannel.WhatsApp,
            "81999998888",
            NotificationTriggerType.Reminder24h,
            "Olá, confirmamos sua consulta amanhã às 14:00.",
            _now);

        Assert.Equal(NotificationStatus.Pending, notif.Status);
        Assert.Equal($"{_appointmentId:N}_{NotificationTriggerType.Reminder24h}_{NotificationChannel.WhatsApp}", notif.IdempotencyKey);
        Assert.Equal("81999998888", notif.RecipientPhone);
        Assert.Null(notif.SentAt);
    }

    [Fact]
    public void MarkAsSent_UpdatesStatusAndSentAt()
    {
        var notif = AppointmentNotification.Create(
            _clinicId,
            _appointmentId,
            _patientId,
            NotificationChannel.WhatsApp,
            "81999998888",
            NotificationTriggerType.Reminder24h,
            "Mensagem",
            _now);

        notif.MarkAsSent(_now.AddMinutes(1));

        Assert.Equal(NotificationStatus.Sent, notif.Status);
        Assert.Equal(_now.AddMinutes(1), notif.SentAt);
    }

    [Fact]
    public void MarkAsReplied_UpdatesStatusAndPayload()
    {
        var notif = AppointmentNotification.Create(
            _clinicId,
            _appointmentId,
            _patientId,
            NotificationChannel.WhatsApp,
            "81999998888",
            NotificationTriggerType.Reminder24h,
            "Mensagem",
            _now);

        notif.MarkAsSent(_now);
        notif.MarkAsReplied("SIM", _now.AddMinutes(5));

        Assert.Equal(NotificationStatus.Replied, notif.Status);
        Assert.Equal("SIM", notif.ResponsePayload);
        Assert.Equal(_now.AddMinutes(5), notif.RepliedAt);
    }

    [Fact]
    public void CommunicationPreference_OptOutAndOptIn_WorkCorrectly()
    {
        var pref = PatientCommunicationPreference.CreateDefault(_patientId, _now);

        Assert.True(pref.WhatsAppEnabled);
        Assert.True(pref.SmsEnabled);
        Assert.Null(pref.OptedOutAt);

        pref.OptOut("Não quero receber mensagens", _now.AddDays(1));

        Assert.False(pref.WhatsAppEnabled);
        Assert.False(pref.SmsEnabled);
        Assert.NotNull(pref.OptedOutAt);
        Assert.Equal("Não quero receber mensagens", pref.OptOutReason);

        pref.OptIn(_now.AddDays(2));

        Assert.True(pref.WhatsAppEnabled);
        Assert.True(pref.SmsEnabled);
        Assert.Null(pref.OptedOutAt);
    }
}
