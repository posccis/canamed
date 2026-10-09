using Canamed.Domain.Portal;
using Xunit;

namespace Canamed.UnitTests.Portal;

public sealed class PatientOtpAndSessionTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;

    [Fact]
    public void CreateOtp_Generates6DigitCodeAndValidHash()
    {
        var (otp, plainCode) = PatientOtpCode.Create("81999998888", "12345678900", _now);

        Assert.Equal(6, plainCode.Length);
        Assert.All(plainCode, c => Assert.True(char.IsDigit(c)));
        Assert.NotEqual(plainCode, otp.CodeHash);
        Assert.True(otp.ExpiresAt > _now);
        Assert.Null(otp.VerifiedAt);
    }

    [Fact]
    public void VerifyOtp_SucceedsWithCorrectCode_FailsWithIncorrectCode()
    {
        var (otp, plainCode) = PatientOtpCode.Create("81999998888", "12345678900", _now);

        var failResult = otp.Verify("000000", _now.AddMinutes(1));
        Assert.False(failResult);
        Assert.Null(otp.VerifiedAt);

        var successResult = otp.Verify(plainCode, _now.AddMinutes(1));
        Assert.True(successResult);
        Assert.NotNull(otp.VerifiedAt);

        // Replay attempt fails
        var replayResult = otp.Verify(plainCode, _now.AddMinutes(2));
        Assert.False(replayResult);
    }

    [Fact]
    public void VerifyOtp_FailsWhenExpired()
    {
        var (otp, plainCode) = PatientOtpCode.Create("81999998888", "12345678900", _now, TimeSpan.FromMinutes(5));

        var expiredResult = otp.Verify(plainCode, _now.AddMinutes(6));
        Assert.False(expiredResult);
        Assert.Null(otp.VerifiedAt);
    }

    [Fact]
    public void PortalSession_IsValidUntilExpiration()
    {
        var patientId = Guid.NewGuid();
        var session = PatientPortalSession.Start(patientId, _now, "127.0.0.1", "Mozilla", TimeSpan.FromHours(12));

        Assert.Equal(patientId, session.PatientId);
        Assert.False(string.IsNullOrWhiteSpace(session.SessionToken));
        Assert.True(session.IsValid(_now.AddHours(11)));
        Assert.False(session.IsValid(_now.AddHours(13)));
    }
}
