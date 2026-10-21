using Canamed.Application.Abstractions;
using Canamed.Domain.Auditing;
using Microsoft.AspNetCore.Http;

namespace Canamed.Infrastructure.Persistence;

/// <summary>Gravação da trilha de auditoria. O banco e interceptor impedem alteração e exclusão (append-only).</summary>
public sealed class AuditRepository(CanamedDbContext dbContext, IHttpContextAccessor? httpContextAccessor = null) : IAuditRepository
{
    public void Add(AuditEvent auditEvent)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);
        EnrichAuditEvent(auditEvent);
        dbContext.AuditEvents.Add(auditEvent);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken) =>
        await dbContext.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

    private void EnrichAuditEvent(AuditEvent auditEvent)
    {
        var httpContext = httpContextAccessor?.HttpContext;
        var ip = ResolveClientIp(httpContext);
        var registration = httpContext?.User?.FindFirst("professional_registration")?.Value;
        auditEvent.EnrichMetadata(ip, registration);
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
