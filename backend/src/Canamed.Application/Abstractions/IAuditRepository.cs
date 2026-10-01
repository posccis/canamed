using Canamed.Domain.Auditing;

namespace Canamed.Application.Abstractions;

/// <summary>Gravação da trilha de auditoria *append-only* (RN-010 da SPEC-0001).</summary>
public interface IAuditRepository
{
    /// <summary>Adiciona um evento ao contexto de persistência.</summary>
    void Add(AuditEvent auditEvent);

    /// <summary>Confirma as alterações pendentes no contexto de persistência.</summary>
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
