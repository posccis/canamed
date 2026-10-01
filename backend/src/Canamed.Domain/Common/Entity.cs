namespace Canamed.Domain.Common;

/// <summary>
/// Base das entidades persistidas, conforme as convenções da seção 7 da SPEC-0001:
/// chave primária UUID e carimbos de tempo em UTC.
/// </summary>
public abstract class Entity
{
    /// <summary>Identificador único da entidade.</summary>
    public Guid Id { get; protected set; } = Guid.NewGuid();

    /// <summary>Data e hora de criação, em UTC.</summary>
    public DateTimeOffset CreatedAt { get; protected set; }

    /// <summary>Data e hora da última alteração, em UTC.</summary>
    public DateTimeOffset UpdatedAt { get; protected set; }

    /// <summary>Atualiza os carimbos de tempo na criação.</summary>
    protected void MarkCreated(DateTimeOffset now)
    {
        CreatedAt = now;
        UpdatedAt = now;
    }

    /// <summary>Atualiza o carimbo de alteração.</summary>
    protected void MarkUpdated(DateTimeOffset now) => UpdatedAt = now;
}
