using Canamed.Application.Abstractions;
using Canamed.Domain.Auditing;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Gravação da trilha de auditoria. O banco impede alteração e exclusão (append-only).</summary>
public sealed class AuditRepository(CanamedDbContext dbContext) : IAuditRepository
{
    public void Add(AuditEvent auditEvent) => dbContext.AuditEvents.Add(auditEvent);

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
}
