using System.Security.Cryptography;
using Canamed.Domain.Common;

namespace Canamed.Domain.Portal;

/// <summary>
/// Sessão autenticada do paciente no portal (SPEC-0015).
/// </summary>
public sealed class PatientPortalSession : Entity
{
    private PatientPortalSession()
    {
    }

    public Guid PatientId { get; private set; }
    public string SessionToken { get; private set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }

    public static PatientPortalSession Start(
        Guid patientId,
        DateTimeOffset now,
        string? ipAddress = null,
        string? userAgent = null,
        TimeSpan? duration = null)
    {
        var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

        return new PatientPortalSession
        {
            Id = Guid.NewGuid(),
            PatientId = patientId,
            SessionToken = rawToken,
            ExpiresAt = now.Add(duration ?? TimeSpan.FromHours(24)),
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = now,
        };
    }

    public bool IsValid(DateTimeOffset now) => now < ExpiresAt;
}
