using Canamed.Domain.Portal;
using Xunit;

namespace Canamed.UnitTests.Portal;

public sealed class PatientCapabilityTokenTests
{
    private readonly DateTimeOffset _now = new(2026, 10, 3, 12, 0, 0, TimeSpan.Zero);
    private readonly Guid _clinicId = Guid.Parse("11111111-1111-4111-8111-111111111111");
    private readonly Guid _appointmentId = Guid.Parse("22222222-2222-4222-8222-222222222222");
    private readonly Guid _patientId = Guid.Parse("33333333-3333-4333-8333-333333333333");

    [Fact]
    public void Issue_GeneratesOpaqueTokenStoredOnlyAsHash()
    {
        var (token, entity) = PatientCapabilityToken.Issue(
            _clinicId,
            CapabilityScope.Confirm,
            _now.AddDays(3),
            _now,
            patientId: _patientId,
            appointmentId: _appointmentId);

        Assert.True(token.Length >= 43, "O token deve ter pelo menos 256 bits de entropia.");
        Assert.NotEqual(token, entity.TokenHash);
        Assert.Equal(PatientCapabilityToken.Hash(token), entity.TokenHash);
        Assert.DoesNotContain(token, entity.TokenHash, StringComparison.Ordinal);
        Assert.Equal(CapabilityTokenStatus.Active, entity.Status);
        Assert.True(entity.IsUsable(_now));
    }

    [Fact]
    public void Issue_RejectsPastExpiration()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            PatientCapabilityToken.Issue(_clinicId, CapabilityScope.Queue, _now.AddMinutes(-1), _now));
    }

    [Fact]
    public void Consume_MakesTokenUnusableAndIsSingleUse()
    {
        var (_, entity) = PatientCapabilityToken.Issue(
            _clinicId,
            CapabilityScope.Cancel,
            _now.AddDays(1),
            _now,
            patientId: _patientId,
            appointmentId: _appointmentId);

        entity.Consume(_now.AddMinutes(5));

        Assert.Equal(CapabilityTokenStatus.Used, entity.Status);
        Assert.NotNull(entity.UsedAt);
        Assert.False(entity.IsUsable(_now.AddMinutes(6)));

        // Repetir o consumo é tolerado (idempotência), mas o token não volta a ser utilizável.
        entity.Consume(_now.AddMinutes(7));
        Assert.False(entity.IsUsable(_now.AddMinutes(8)));
    }

    [Fact]
    public void Revoke_PreventsFurtherUse()
    {
        var (_, entity) = PatientCapabilityToken.Issue(
            _clinicId,
            CapabilityScope.CheckIn,
            _now.AddHours(12),
            _now,
            appointmentId: _appointmentId);

        entity.Revoke(_now.AddHours(1));

        Assert.Equal(CapabilityTokenStatus.Revoked, entity.Status);
        Assert.False(entity.IsUsable(_now.AddHours(2)));
    }

    [Fact]
    public void Expire_OnlyAppliesToActiveTokens()
    {
        var (_, entity) = PatientCapabilityToken.Issue(_clinicId, CapabilityScope.Queue, _now.AddHours(1), _now);

        entity.Expire(_now.AddHours(2));
        Assert.Equal(CapabilityTokenStatus.Expired, entity.Status);

        Assert.Throws<InvalidOperationException>(() => entity.Revoke(_now.AddHours(3)));
    }

    [Theory]
    [InlineData(CapabilityScope.Confirm, "confirm")]
    [InlineData(CapabilityScope.Cancel, "cancel")]
    [InlineData(CapabilityScope.Reschedule, "reschedule")]
    [InlineData(CapabilityScope.CheckIn, "check_in")]
    [InlineData(CapabilityScope.Queue, "queue")]
    [InlineData(CapabilityScope.Registration, "registration")]
    [InlineData(CapabilityScope.Document, "document")]
    [InlineData(CapabilityScope.WaitlistOffer, "waitlist_offer")]
    public void ScopeMap_RoundTripsStoredValues(CapabilityScope scope, string stored)
    {
        Assert.Equal(stored, scope.ToStoredValue());
        Assert.Equal(scope, CapabilityMap.ScopeFromStoredValue(stored));
    }
}
