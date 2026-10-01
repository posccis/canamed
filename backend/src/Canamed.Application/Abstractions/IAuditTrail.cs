using Canamed.Domain.Auditing;

namespace Canamed.Application.Abstractions;

/// <summary>
/// Gravação de eventos de segurança que precisam sobreviver a rollback — por exemplo, acesso negado e
/// tentativas de login inválidas, que ocorrem justamente quando a operação de negócio é abortada.
/// A escrita ocorre fora da transação corrente, em uma unidade de trabalho própria.
/// </summary>
public interface IAuditTrail
{
    /// <summary>Registra o evento imediatamente, de forma independente da transação corrente.</summary>
    Task RecordAsync(AuditEvent auditEvent, CancellationToken cancellationToken);
}
