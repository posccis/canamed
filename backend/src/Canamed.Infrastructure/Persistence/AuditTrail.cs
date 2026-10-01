using Canamed.Application.Abstractions;
using Canamed.Domain.Auditing;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>
/// Trilha de auditoria para eventos de segurança, escrita em contexto próprio para não ser desfeita
/// pelo rollback da transação de negócio (SPEC-0003, seção 13).
/// </summary>
public sealed class AuditTrail(IDbContextFactory<CanamedDbContext> dbContextFactory) : IAuditTrail
{
    public async Task RecordAsync(AuditEvent auditEvent, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        await using var dbContext = await dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);

        dbContext.AuditEvents.Add(auditEvent);

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
