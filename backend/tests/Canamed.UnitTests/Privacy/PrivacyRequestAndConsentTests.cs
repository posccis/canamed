using Canamed.Domain.Privacy;
using Xunit;

namespace Canamed.UnitTests.Privacy;

public sealed class PrivacyRequestAndConsentTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();

    [Fact]
    public void OpenRequest_GeneratesProtocolAnd15DaysDueDate()
    {
        var request = PrivacyRequest.Open(
            _clinicId,
            _patientId,
            PrivacyRequestType.DataAccess,
            "Quero cópia dos meus dados cadastrais.",
            _now);

        Assert.StartsWith("LGPD-", request.Protocol);
        Assert.Equal(PrivacyRequestStatus.Pending, request.Status);
        Assert.Equal(PrivacyRequestType.DataAccess, request.RequestType);
        Assert.Equal(_now.AddDays(15), request.DueDate);
        Assert.Null(request.CompletedAt);
    }

    [Fact]
    public void RespondRequest_UpdatesStatusAndNotes()
    {
        var request = PrivacyRequest.Open(
            _clinicId,
            _patientId,
            PrivacyRequestType.Deletion,
            "Solicito exclusão.",
            _now);

        request.Respond("Prontuário preservado por 20 anos pela Lei 13.787/2018.", PrivacyRequestStatus.Rejected, _now.AddDays(2));

        Assert.Equal(PrivacyRequestStatus.Rejected, request.Status);
        Assert.Contains("Lei 13.787/2018", request.ResponseNotes);
        Assert.Equal(_now.AddDays(2), request.CompletedAt);
    }

    [Fact]
    public void PrivacyConsent_GrantAndRevoke_AuditsState()
    {
        var consent = PrivacyConsent.Grant(
            _patientId,
            "whatsapp_notifications",
            "1.0",
            _now,
            "192.168.1.1");

        Assert.True(consent.IsGranted);
        Assert.Equal("whatsapp_notifications", consent.ConsentType);
        Assert.Equal("1.0", consent.PolicyVersion);
        Assert.Equal("192.168.1.1", consent.IpAddress);

        consent.Revoke(_now.AddDays(1), "192.168.1.2");

        Assert.False(consent.IsGranted);
        Assert.Equal("192.168.1.2", consent.IpAddress);
    }
}
