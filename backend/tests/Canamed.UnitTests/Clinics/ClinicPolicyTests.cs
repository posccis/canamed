using Canamed.Domain.Clinics;

namespace Canamed.UnitTests.Clinics;

public sealed class ClinicPolicyTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();

    [Fact]
    public void CreateDefault_InitializesStandardQuotas()
    {
        var policy = ClinicPolicy.CreateDefault(_clinicId, _now);

        Assert.Equal(_clinicId, policy.ClinicId);
        Assert.Equal(3, policy.MaxDailyOverbookingPerDoctor);
        Assert.Equal(2, policy.MinHoursNoticeForOnlineBooking);
        Assert.Equal(24, policy.MinHoursNoticeForFreeCancellation);
    }

    [Fact]
    public void Update_ModifiesQuotasCorrectly()
    {
        var policy = ClinicPolicy.CreateDefault(_clinicId, _now);

        policy.Update(5, 4, 12, _now);

        Assert.Equal(5, policy.MaxDailyOverbookingPerDoctor);
        Assert.Equal(4, policy.MinHoursNoticeForOnlineBooking);
        Assert.Equal(12, policy.MinHoursNoticeForFreeCancellation);
    }
}
