using Canamed.Domain.Common;

namespace Canamed.Domain.Queue;

/// <summary>
/// Evento de chamada de paciente para exibição em tempo real na TV da recepção (SPEC-0020).
/// </summary>
public sealed class QueueCallEvent : Entity
{
    private QueueCallEvent()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid QueueEntryId { get; private set; }
    public string TicketCode { get; private set; } = string.Empty;
    public string PatientName { get; private set; } = string.Empty;
    public string RoomName { get; private set; } = string.Empty;
    public string ProfessionalName { get; private set; } = string.Empty;
    public bool IsPreferential { get; private set; }
    public int CallCount { get; private set; } = 1;
    public DateTimeOffset CalledAt { get; private set; }

    public static QueueCallEvent Create(
        Guid clinicId,
        Guid queueEntryId,
        string ticketCode,
        string patientName,
        string roomName,
        string professionalName,
        bool isPreferential,
        DateTimeOffset now)
    {
        var evt = new QueueCallEvent
        {
            ClinicId = clinicId,
            QueueEntryId = queueEntryId,
            TicketCode = ticketCode,
            PatientName = patientName,
            RoomName = roomName,
            ProfessionalName = professionalName,
            IsPreferential = isPreferential,
            CallCount = 1,
            CalledAt = now
        };
        evt.MarkCreated(now);
        return evt;
    }

    /// <summary>Re-chama o paciente incrementando a contagem de avisos.</summary>
    public void Recall(DateTimeOffset now)
    {
        CallCount++;
        CalledAt = now;
        MarkUpdated(now);
    }
}
