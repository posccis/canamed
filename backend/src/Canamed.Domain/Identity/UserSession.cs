using Canamed.Domain.Common;

namespace Canamed.Domain.Identity;

/// <summary>
/// Sessão autenticada. O token nunca é persistido: apenas o hash SHA-256 (RN-006).
/// Expira por inatividade e por limite absoluto (RN-007).
/// </summary>
public sealed class UserSession : Entity
{
    /// <summary>Tempo máximo de inatividade (RN-007).</summary>
    public static TimeSpan IdleTimeout => TimeSpan.FromMinutes(30);

    /// <summary>Limite absoluto da sessão, independente de atividade (RN-007).</summary>
    public static TimeSpan AbsoluteLifetime => TimeSpan.FromHours(8);

    private UserSession()
    {
    }

    public Guid UserId { get; private set; }

    public Guid ClinicId { get; private set; }

    public string TokenHash { get; private set; } = string.Empty;

    /// <summary>Verdadeiro quando o perfil exige MFA e o cadastro ainda não foi concluído (RN-011).</summary>
    public bool MfaPending { get; private set; }

    public DateTimeOffset LastSeenAt { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? RevokedAt { get; private set; }

    public string? RevokedReason { get; private set; }

    /// <summary>Cria uma sessão ativa.</summary>
    public static UserSession Create(
        Guid userId,
        Guid clinicId,
        string tokenHash,
        bool mfaPending,
        DateTimeOffset now,
        Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tokenHash);

        var session = new UserSession
        {
            UserId = userId,
            ClinicId = clinicId,
            TokenHash = tokenHash,
            MfaPending = mfaPending,
            LastSeenAt = now,
            ExpiresAt = now.Add(AbsoluteLifetime),
        };

        if (id is not null)
        {
            session.Id = id.Value;
        }

        session.MarkCreated(now);

        return session;
    }

    /// <summary>Indica se a sessão pode ser usada neste instante.</summary>
    public bool IsActive(DateTimeOffset now) =>
        RevokedAt is null && now < ExpiresAt && now - LastSeenAt <= IdleTimeout;

    /// <summary>Registra atividade (expiração deslizante).</summary>
    public void Touch(DateTimeOffset now)
    {
        LastSeenAt = now;
        MarkUpdated(now);
    }

    /// <summary>Revoga a sessão (RN-008).</summary>
    public void Revoke(DateTimeOffset now, string reason)
    {
        if (RevokedAt is not null)
        {
            return;
        }

        RevokedAt = now;
        RevokedReason = reason;
        MarkUpdated(now);
    }

    /// <summary>Troca a clínica ativa da sessão (F-006).</summary>
    public void SwitchClinic(Guid clinicId, DateTimeOffset now)
    {
        ClinicId = clinicId;
        MarkUpdated(now);
    }

    /// <summary>Conclui a pendência de MFA após o cadastro (RN-011).</summary>
    public void CompleteMfaEnrollment(DateTimeOffset now)
    {
        MfaPending = false;
        MarkUpdated(now);
    }
}
