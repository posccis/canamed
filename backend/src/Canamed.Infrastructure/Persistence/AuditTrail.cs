using Canamed.Application.Abstractions;
using Canamed.Domain.Auditing;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Canamed.Infrastructure.Persistence;

/// <summary>
/// Trilha de auditoria para eventos de segurança, escrita em contexto próprio para não ser desfeita
/// pelo rollback da transação de negócio (SPEC-0003, seção 13, SPEC-0034 RN-003).
/// </summary>
public sealed class AuditTrail(
    IDbContextFactory<CanamedDbContext> dbContextFactory,
    IHttpContextAccessor? httpContextAccessor = null) : IAuditTrail
{
    public async Task RecordAsync(AuditEvent auditEvent, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        var httpContext = httpContextAccessor?.HttpContext;
        var ip = ResolveClientIp(httpContext);
        var registration = httpContext?.User?.FindFirst("professional_registration")?.Value;
        auditEvent.EnrichMetadata(ip, registration);

        await using var dbContext = await dbContextFactory
            .CreateDbContextAsync(cancellationToken)
            .ConfigureAwait(false);

        dbContext.AuditEvents.Add(auditEvent);

        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string? ResolveClientIp(HttpContext? httpContext)
    {
        if (httpContext is null)
        {
            return null;
        }

        if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded) && !string.IsNullOrWhiteSpace(forwarded))
        {
            var firstIp = forwarded.ToString().Split(',')[0].Trim();
            if (!string.IsNullOrEmpty(firstIp))
            {
                return firstIp;
            }
        }

        return httpContext.Connection.RemoteIpAddress?.ToString();
    }
}
