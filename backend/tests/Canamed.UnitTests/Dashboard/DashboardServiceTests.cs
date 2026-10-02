using Canamed.Application.Abstractions;
using Canamed.Application.Agenda;
using Canamed.Application.Dashboard;
using Canamed.Application.Identity;

namespace Canamed.UnitTests.Dashboard;

public sealed class DashboardServiceTests
{
    private readonly Guid _clinicId = Guid.NewGuid();

    [Fact]
    public async Task GetSummaryAsync_ComDataNula_DeveUsarDataLocalDoTimeProvider()
    {
        var fixedUtc = new DateTimeOffset(2026, 10, 5, 14, 0, 0, TimeSpan.Zero);
        var expectedLocalDate = DateOnly.FromDateTime(AgendaTimeZone.ToLocal(fixedUtc).DateTime);

        var repoMock = new MockDashboardRepository();
        var actorMock = new FixedActorAccessor(new CurrentActor(
            "user-1",
            "Dr. Teste",
            _clinicId,
            new HashSet<string> { Permissions.DashboardRead }));

        var timeProvider = new FixedTimeProvider(fixedUtc);
        var service = new DashboardService(repoMock, actorMock, timeProvider);

        var summary = await service.GetSummaryAsync(null, CancellationToken.None);

        Assert.Equal(expectedLocalDate, summary.Date);
        Assert.Equal(_clinicId, repoMock.LastClinicId);
    }

    [Fact]
    public async Task GetSummaryAsync_ComDataEspecifica_DeveRepassarDataAoRepositorio()
    {
        var specificDate = new DateOnly(2026, 11, 20);
        var repoMock = new MockDashboardRepository();
        var actorMock = new FixedActorAccessor(new CurrentActor(
            "user-2",
            "Gestor Teste",
            _clinicId,
            new HashSet<string> { Permissions.DashboardRead }));

        var service = new DashboardService(repoMock, actorMock, TimeProvider.System);

        var summary = await service.GetSummaryAsync(specificDate, CancellationToken.None);

        Assert.Equal(specificDate, summary.Date);
        Assert.Equal(_clinicId, repoMock.LastClinicId);
    }

    private sealed class FixedActorAccessor(CurrentActor actor) : ICurrentActorAccessor
    {
        public bool TryGetActor(out CurrentActor result)
        {
            result = actor;
            return true;
        }
    }

    private sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private sealed class MockDashboardRepository : IDashboardRepository
    {
        public Guid? LastClinicId { get; private set; }
        public DateOnly? LastDate { get; private set; }

        public Task<DashboardSummaryResponse> GetSummaryAsync(
            Guid clinicId,
            DateOnly date,
            CancellationToken cancellationToken)
        {
            LastClinicId = clinicId;
            LastDate = date;

            return Task.FromResult(new DashboardSummaryResponse(
                date,
                TotalAppointments: 5,
                ScheduledCount: 2,
                ConfirmedCount: 1,
                AttendedCount: 2,
                NoShowCount: 0,
                CancelledCount: 0,
                AttendanceRate: 100.0,
                QueueWaitingCount: 1,
                QueueInServiceCount: 1,
                QueueCompletedCount: 2,
                AverageWaitMinutes: 10.0,
                Professionals: [],
                Rooms: [],
                UpcomingAppointments: []));
        }
    }
}
