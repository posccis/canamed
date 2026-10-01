using Canamed.Domain.Common;

namespace Canamed.Domain.Identity;

/// <summary>
/// Desafio do segundo fator entre a validação da senha e a criação da sessão (F-002).
/// Efêmero: expira em 5 minutos e aceita até 5 tentativas.
/// </summary>
public sealed class LoginChallenge : Entity
{
    /// <summary>Validade do desafio.</summary>
    public static TimeSpan Lifetime => TimeSpan.FromMinutes(5);

    /// <summary>Tentativas de código aceitas por desafio.</summary>
    public const int MaxAttempts = 5;

    private LoginChallenge()
    {
    }

    public Guid UserId { get; private set; }

    public DateTimeOffset ExpiresAt { get; private set; }

    public DateTimeOffset? ConsumedAt { get; private set; }

    public int Attempts { get; private set; }

    /// <summary>Cria um desafio para o usuário.</summary>
    public static LoginChallenge Create(Guid userId, DateTimeOffset now, Guid? id = null)
    {
        var challenge = new LoginChallenge
        {
            UserId = userId,
            ExpiresAt = now.Add(Lifetime),
        };

        if (id is not null)
        {
            challenge.Id = id.Value;
        }

        challenge.MarkCreated(now);

        return challenge;
    }

    /// <summary>Indica se o desafio ainda pode ser usado.</summary>
    public bool IsUsable(DateTimeOffset now) =>
        ConsumedAt is null && now < ExpiresAt && Attempts < MaxAttempts;

    /// <summary>Consome o desafio após um código válido.</summary>
    public void Consume(DateTimeOffset now)
    {
        ConsumedAt = now;
        MarkUpdated(now);
    }

    /// <summary>Registra um código inválido.</summary>
    public void RegisterFailedAttempt(DateTimeOffset now)
    {
        Attempts++;
        MarkUpdated(now);
    }
}
