using Canamed.Domain.Common;

namespace Canamed.Domain.Notifications;

public enum NotificationChannel
{
    WhatsApp,
    Sms,
}

public enum NotificationTriggerType
{
    Reminder48h,
    Reminder24h,
    InstantConfirmation,
}

public enum NotificationStatus
{
    Pending,
    Sent,
    Delivered,
    Failed,
    Replied,
}

/// <summary>
/// Registro de notificação ativa e lembretes pré-consulta (SPEC-0014).
/// </summary>
public sealed class AppointmentNotification : Entity
{
    private AppointmentNotification()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid AppointmentId { get; private set; }
    public Guid PatientId { get; private set; }
    public NotificationChannel Channel { get; private set; }
    public string RecipientPhone { get; private set; } = string.Empty;
    public NotificationTriggerType TriggerType { get; private set; }
    public NotificationStatus Status { get; private set; }
    public string MessageBody { get; private set; } = string.Empty;
    public string? ResponsePayload { get; private set; }
    public string IdempotencyKey { get; private set; } = string.Empty;
    public DateTimeOffset? SentAt { get; private set; }
    public DateTimeOffset? RepliedAt { get; private set; }
    public string? FailureReason { get; private set; }

    public static AppointmentNotification Create(
        Guid clinicId,
        Guid appointmentId,
        Guid patientId,
        NotificationChannel channel,
        string recipientPhone,
        NotificationTriggerType triggerType,
        string messageBody,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(recipientPhone))
            throw new ArgumentException("Telefone do destinatário não pode ser vazio.", nameof(recipientPhone));

        if (string.IsNullOrWhiteSpace(messageBody))
            throw new ArgumentException("O corpo da mensagem não pode ser vazio.", nameof(messageBody));

        var idempotency = $"{appointmentId:N}_{triggerType}_{channel}";

        return new AppointmentNotification
        {
            Id = Guid.NewGuid(),
            ClinicId = clinicId,
            AppointmentId = appointmentId,
            PatientId = patientId,
            Channel = channel,
            RecipientPhone = recipientPhone.Trim(),
            TriggerType = triggerType,
            Status = NotificationStatus.Pending,
            MessageBody = messageBody.Trim(),
            IdempotencyKey = idempotency,
            CreatedAt = now,
        };
    }

    public void MarkAsSent(DateTimeOffset sentAt)
    {
        Status = NotificationStatus.Sent;
        SentAt = sentAt;
    }

    public void MarkAsDelivered(DateTimeOffset deliveredAt)
    {
        Status = NotificationStatus.Delivered;
    }

    public void MarkAsReplied(string responsePayload, DateTimeOffset repliedAt)
    {
        Status = NotificationStatus.Replied;
        ResponsePayload = responsePayload;
        RepliedAt = repliedAt;
    }

    public void MarkAsFailed(string reason)
    {
        Status = NotificationStatus.Failed;
        FailureReason = reason;
    }
}
