namespace Canamed.Domain.Notifications;

public record NotificationSendResult(bool Success, string? ExternalMessageId, string? ErrorMessage);

public interface ISmsWhatsAppProvider
{
    Task<NotificationSendResult> SendMessageAsync(
        string recipientPhone,
        NotificationChannel channel,
        string messageBody,
        CancellationToken cancellationToken = default);
}
