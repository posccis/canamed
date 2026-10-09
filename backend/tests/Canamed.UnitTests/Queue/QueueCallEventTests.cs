using Canamed.Domain.Queue;

namespace Canamed.UnitTests.Queue;

public sealed class QueueCallEventTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _queueEntryId = Guid.NewGuid();

    [Fact]
    public void Create_InitializesCallEventCorrectly()
    {
        var evt = QueueCallEvent.Create(
            _clinicId,
            _queueEntryId,
            "P-001",
            "Carlos Eduardo",
            "Consultório 02",
            "Dra. Juliana",
            true,
            _now);

        Assert.Equal(_clinicId, evt.ClinicId);
        Assert.Equal("P-001", evt.TicketCode);
        Assert.Equal("Carlos Eduardo", evt.PatientName);
        Assert.Equal("Consultório 02", evt.RoomName);
        Assert.Equal("Dra. Juliana", evt.ProfessionalName);
        Assert.True(evt.IsPreferential);
        Assert.Equal(1, evt.CallCount);
    }

    [Fact]
    public void Recall_IncrementsCallCountAndUpdatesTime()
    {
        var evt = QueueCallEvent.Create(
            _clinicId,
            _queueEntryId,
            "N-042",
            "Maria Santos",
            "Sala 01",
            "Dr. Roberto",
            false,
            _now);

        var later = _now.AddMinutes(2);
        evt.Recall(later);

        Assert.Equal(2, evt.CallCount);
        Assert.Equal(later, evt.CalledAt);
    }
}
