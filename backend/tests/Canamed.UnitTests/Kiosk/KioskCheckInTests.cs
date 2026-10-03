using Canamed.Domain.Agenda;
using Xunit;

namespace Canamed.UnitTests.Kiosk;

public sealed class KioskCheckInTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly DateOnly _today = DateOnly.FromDateTime(DateTime.UtcNow);
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _profId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly Guid _appointmentId = Guid.NewGuid();

    [Fact]
    public void CheckIn_AssignsTicketAndOriginCorrectly()
    {
        var entry = QueueEntry.CheckIn(
            _clinicId,
            _profId,
            _patientId,
            _appointmentId,
            _today,
            QueuePriority.Normal,
            _now);

        entry.AssignTicket("N-042", "kiosk");

        Assert.Equal("N-042", entry.TicketCode);
        Assert.Equal("kiosk", entry.CheckInOrigin);
        Assert.Equal(QueuePriority.Normal, entry.Priority);
        Assert.Equal(QueueStatus.Waiting, entry.Status);
    }

    [Fact]
    public void PreferentialCheckIn_AssignsPreferentialPrefix()
    {
        var entry = QueueEntry.CheckIn(
            _clinicId,
            _profId,
            _patientId,
            _appointmentId,
            _today,
            QueuePriority.Preferential,
            _now);

        entry.AssignTicket("P-003", "mobile_qrcode");

        Assert.Equal("P-003", entry.TicketCode);
        Assert.Equal("mobile_qrcode", entry.CheckInOrigin);
        Assert.Equal(QueuePriority.Preferential, entry.Priority);
    }
}
