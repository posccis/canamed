using System.Net.Mail;
using Canamed.Domain.Common;

namespace Canamed.Domain.Identity;

/// <summary>
/// Usuário da plataforma. O e-mail é a identidade (RN-001) e a senha é sempre persistida como hash
/// (RN-002). O bloqueio progressivo por tentativas inválidas é responsabilidade desta entidade (RN-004).
/// </summary>
public sealed class User : Entity
{
    /// <summary>Tentativas inválidas consecutivas que bloqueiam a conta (RN-004).</summary>
    public const int MaxFailedLoginAttempts = 5;

    /// <summary>Duração do bloqueio após exceder as tentativas (RN-004).</summary>
    public static TimeSpan LockDuration => TimeSpan.FromMinutes(15);

    private User()
    {
    }

    public string Name { get; private set; } = string.Empty;

    /// <summary>E-mail normalizado (minúsculas), único no sistema.</summary>
    public string Email { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public DateTimeOffset? PasswordChangedAt { get; private set; }

    /// <summary>Segredo TOTP cifrado em repouso (RN-012). Nunca é exposto por API.</summary>
    public string? MfaSecret { get; private set; }

    public DateTimeOffset? MfaEnabledAt { get; private set; }

    public int FailedLoginAttempts { get; private set; }

    public DateTimeOffset? LockedUntil { get; private set; }

    public bool IsActive { get; private set; } = true;

    /// <summary>Indica se o segundo fator está ativo.</summary>
    public bool HasMfaEnabled => MfaSecret is not null && MfaEnabledAt is not null;

    /// <summary>Cria um usuário ativo com senha já protegida por hash.</summary>
    public static User Create(string name, string email, string passwordHash, DateTimeOffset now, Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        var user = new User
        {
            Name = name.Trim(),
            Email = NormalizeEmail(email),
            PasswordHash = passwordHash,
            PasswordChangedAt = now,
            IsActive = true,
        };

        if (id is not null)
        {
            user.Id = id.Value;
        }

        user.MarkCreated(now);

        return user;
    }

    /// <summary>Normaliza o e-mail para comparação e persistência (RN-001).</summary>
    public static string NormalizeEmail(string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);

        return email.Trim().ToLowerInvariant();
    }

    /// <summary>Valida o formato do e-mail.</summary>
    public static bool IsValidEmail(string email) =>
        !string.IsNullOrWhiteSpace(email) && MailAddress.TryCreate(email.Trim(), out _);

    /// <summary>Substitui a senha por um novo hash.</summary>
    public void ChangePassword(string passwordHash, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        PasswordHash = passwordHash;
        PasswordChangedAt = now;
        MarkUpdated(now);
    }

    /// <summary>Registra uma tentativa inválida e aplica o bloqueio progressivo (RN-004).</summary>
    public void RegisterFailedLogin(DateTimeOffset now)
    {
        FailedLoginAttempts++;

        if (FailedLoginAttempts >= MaxFailedLoginAttempts)
        {
            LockedUntil = now.Add(LockDuration);
        }

        MarkUpdated(now);
    }

    /// <summary>Zera o contador após autenticação bem-sucedida.</summary>
    public void RegisterSuccessfulLogin(DateTimeOffset now)
    {
        FailedLoginAttempts = 0;
        LockedUntil = null;
        MarkUpdated(now);
    }

    /// <summary>Guarda o segredo TOTP cifrado, ainda não ativo.</summary>
    public void SetMfaSecret(string protectedSecret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(protectedSecret);

        MfaSecret = protectedSecret;
    }

    /// <summary>Ativa o segundo fator (exige segredo previamente cadastrado).</summary>
    public void EnableMfa(DateTimeOffset now)
    {
        if (MfaSecret is null)
        {
            throw new InvalidOperationException("Não há segredo de segundo fator cadastrado para este usuário.");
        }

        MfaEnabledAt = now;
        MarkUpdated(now);
    }

    /// <summary>Desativa o segundo fator e descarta o segredo.</summary>
    public void DisableMfa(DateTimeOffset now)
    {
        MfaSecret = null;
        MfaEnabledAt = null;
        MarkUpdated(now);
    }

    /// <summary>Desativa o usuário (RN-013).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa o usuário.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }

    /// <summary>Indica se a conta está bloqueada neste instante.</summary>
    public bool IsLocked(DateTimeOffset now) => LockedUntil is not null && LockedUntil > now;
}
