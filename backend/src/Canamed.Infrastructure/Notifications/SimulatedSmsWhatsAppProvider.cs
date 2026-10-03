using Canamed.Domain.Notifications;
using Microsoft.Extensions.Logging;

namespace Canamed.Infrastructure.Notifications;

public sealed class SimulatedSmsWhatsAppProvider(ILogger<SimulatedSmsWhatsAppProvider> logger) : ISmsWhatsAppProvider
{
    public Task<NotificationSendResult> SendMessageAsync(
        string recipientPhone,
        NotificationChannel channel,
        string messageBody,
        CancellationToken cancellationToken = default)
    {
        var externalId = channel == NotificationChannel.WhatsApp
            ? $"wamid.simulated_{Guid.NewGuid():N}"
            : $"sms.simulated_{Guid.NewGuid():N}";

        logger.LogInformation(
            "[SIMULATED_PROVIDER] Sending {Channel} to {Phone} (ExternalId: {ExternalId}): {Body}",
            channel,
            recipientPhone,
            externalId,
            messageBody);

        return Task.FromResult(new NotificationSendResult(true, externalId, null));
    }
}
