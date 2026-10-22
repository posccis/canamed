using System.Net;
using System.Security.Claims;
using Canamed.Domain.Auditing;
using Canamed.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Canamed.UnitTests.Auditing;

public sealed class AuditEventTests
{
    [Fact]
    public void Record_DeveArmazenarClientIpEProfessionalRegistration_RN_003()
    {
        var now = DateTimeOffset.UtcNow;
        var audit = AuditEvent.Record(
            Guid.NewGuid(),
            "user-123",
            "Dr. Roberto",
            "records.finalize",
            "medical_records",
            Guid.NewGuid().ToString(),
            now,
            details: "{}",
            clientIp: "192.168.1.100",
            professionalRegistration: "CRM/PE 12345");

        Assert.Equal("192.168.1.100", audit.ClientIp);
        Assert.Equal("CRM/PE 12345", audit.ProfessionalRegistration);
    }

    [Fact]
    public void EnrichMetadata_DevePreencherValoresAusentesSemSobrescreverExistentes()
    {
        var now = DateTimeOffset.UtcNow;
        var audit = AuditEvent.Record(
            Guid.NewGuid(),
            "user-123",
            "Dr. Roberto",
            "records.finalize",
            "medical_records",
            Guid.NewGuid().ToString(),
            now,
            clientIp: "10.0.0.1");

        audit.EnrichMetadata("192.168.1.50", "CRM/SP 99999");

        Assert.Equal("10.0.0.1", audit.ClientIp);
        Assert.Equal("CRM/SP 99999", audit.ProfessionalRegistration);
    }

    [Fact]
    public void AuditRepository_Add_DeveEnriquecerComHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = IPAddress.Parse("203.0.113.195");
        var claims = new[] { new Claim("professional_registration", "CRM/RJ 54321") };
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));

        var accessor = new HttpContextAccessor { HttpContext = httpContext };

        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        using var dbContext = new CanamedDbContext(options);

        var repository = new AuditRepository(dbContext, accessor);

        var audit = AuditEvent.Record(
            Guid.NewGuid(),
            "user-456",
            "Dra. Camila",
            "document.sign",
            "medical_documents",
            Guid.NewGuid().ToString(),
            DateTimeOffset.UtcNow);

        repository.Add(audit);

        Assert.Equal("203.0.113.195", audit.ClientIp);
        Assert.Equal("CRM/RJ 54321", audit.ProfessionalRegistration);
    }
    [Fact]
    public async Task AuditTrail_RecordAsync_DeveEnriquecerComXForwardedFor()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Headers["X-Forwarded-For"] = "198.51.100.42, 10.0.0.1";
        var claims = new[] { new Claim("professional_registration", "CRM/MG 78910") };
        httpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims));

        var accessor = new HttpContextAccessor { HttpContext = httpContext };

        var dbName = Guid.NewGuid().ToString();
        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var factory = new TestDbContextFactory(options);
        var auditTrail = new AuditTrail(factory, accessor);

        var audit = AuditEvent.Record(
            Guid.NewGuid(),
            "user-789",
            "Dr. Lucas",
            "auth.login",
            "users",
            Guid.NewGuid().ToString(),
            DateTimeOffset.UtcNow);

        await auditTrail.RecordAsync(audit, CancellationToken.None);

        Assert.Equal("198.51.100.42", audit.ClientIp);
        Assert.Equal("CRM/MG 78910", audit.ProfessionalRegistration);

        using var dbContext = new CanamedDbContext(options);
        var saved = await dbContext.AuditEvents.FirstOrDefaultAsync(a => a.Id == audit.Id);
        Assert.NotNull(saved);
        Assert.Equal("198.51.100.42", saved.ClientIp);
        Assert.Equal("CRM/MG 78910", saved.ProfessionalRegistration);
    }

    private sealed class TestDbContextFactory(DbContextOptions<CanamedDbContext> options) : IDbContextFactory<CanamedDbContext>
    {
        public CanamedDbContext CreateDbContext() => new(options);
        public Task<CanamedDbContext> CreateDbContextAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(new CanamedDbContext(options));
    }

}
