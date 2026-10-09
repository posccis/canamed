using Canamed.Domain.Common;

namespace Canamed.Domain.Privacy;

/// <summary>
/// Registro versionado e auditável de consentimento do titular (LGPD - SPEC-0018).
/// </summary>
public sealed class PrivacyConsent : Entity
{
    private PrivacyConsent()
    {
    }

    public Guid PatientId { get; private set; }
    public string ConsentType { get; private set; } = string.Empty;
    public string PolicyVersion { get; private set; } = "1.0";
    public bool IsGranted { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTimeOffset GrantedAt { get; private set; }

    public static PrivacyConsent Grant(
        Guid patientId,
        string consentType,
        string policyVersion,
        DateTimeOffset now,
        string? ipAddress = null)
    {
        return new PrivacyConsent
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            ConsentType = consentType.Trim(),
            PolicyVersion = policyVersion.Trim(),
            IsGranted = true,
            IpAddress = ipAddress,
            GrantedAt = now,
            CreatedAt = now,
        };
    }

    public void Revoke(DateTimeOffset now, string? ipAddress = null)
    {
        IsGranted = false;
        IpAddress = ipAddress;
        GrantedAt = now;
    }
}
