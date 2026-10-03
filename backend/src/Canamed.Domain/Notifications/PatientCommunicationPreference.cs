using Canamed.Domain.Common;

namespace Canamed.Domain.Notifications;

/// <summary>
/// Preferências de comunicação do paciente e registro de opt-out (LGPD - SPEC-0014).
/// </summary>
public sealed class PatientCommunicationPreference : Entity
{
    private PatientCommunicationPreference()
    {
    }

    public Guid PatientId { get; private set; }
    public bool WhatsAppEnabled { get; private set; } = true;
    public bool SmsEnabled { get; private set; } = true;
    public DateTimeOffset? OptedOutAt { get; private set; }
    public string? OptOutReason { get; private set; }

    public static PatientCommunicationPreference CreateDefault(Guid patientId, DateTimeOffset now)
    {
        var entity = new PatientCommunicationPreference
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            WhatsAppEnabled = true,
            SmsEnabled = true,
        };
        entity.MarkCreated(now);
        return entity;
    }

    public void OptOut(string? reason, DateTimeOffset now)
    {
        WhatsAppEnabled = false;
        SmsEnabled = false;
        OptedOutAt = now;
        OptOutReason = reason;
        MarkUpdated(now);
    }

    public void OptIn(DateTimeOffset now)
    {
        WhatsAppEnabled = true;
        SmsEnabled = true;
        OptedOutAt = null;
        OptOutReason = null;
        MarkUpdated(now);
    }

    public void UpdatePreferences(bool whatsapp, bool sms, DateTimeOffset now)
    {
        WhatsAppEnabled = whatsapp;
        SmsEnabled = sms;
        MarkUpdated(now);
    }
}
