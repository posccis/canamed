using Canamed.Domain.Agenda;
using Canamed.Domain.Auditing;
using Canamed.Domain.MedicalDocuments;
using Canamed.Domain.MedicalRecords;
using Canamed.Infrastructure.Persistence;
using Canamed.Infrastructure.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Canamed.UnitTests.Persistence;

public sealed class ImmutableRecordsInterceptorTests
{
    private static CanamedDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<CanamedDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new CanamedDbContext(options);
    }

    [Fact]
    public void IsImmutableEntity_IdentifiesProtectedEntities()
    {
        var now = DateTimeOffset.UtcNow;
        var record = MedicalRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, now);
        var addendum = MedicalRecordAddendum.Create(record.Id, Guid.NewGuid(), "Justificativa", "Nota clínica", now);
        var gynData = GynecologicalConsultationData.Create(record.Id, now);
        var document = MedicalDocument.CreateDraft(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            record.Id,
            MedicalDocumentType.ReceitaSimples,
            "{}",
            null,
            false,
            now);
        var audit = AuditEvent.Record(Guid.NewGuid(), "user1", "Dr. Ana", "records.view", "medical_records", record.Id.ToString(), now);

        Assert.True(ImmutableRecordsInterceptor.IsImmutableEntity(record));
        Assert.True(ImmutableRecordsInterceptor.IsImmutableEntity(addendum));
        Assert.True(ImmutableRecordsInterceptor.IsImmutableEntity(gynData));
        Assert.True(ImmutableRecordsInterceptor.IsImmutableEntity(document));
        Assert.True(ImmutableRecordsInterceptor.IsImmutableEntity(audit));
    }

    [Fact]
    public void IsImmutableEntity_ReturnsFalseForNonClinicalEntities()
    {
        var now = DateTimeOffset.UtcNow;
        var appointment = Appointment.Schedule(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            now.AddHours(2),
            30,
            now);

        Assert.False(ImmutableRecordsInterceptor.IsImmutableEntity(appointment));
        Assert.False(ImmutableRecordsInterceptor.IsImmutableEntity(new object()));
    }

    [Fact]
    public void SaveChanges_DeveBloquearExclusaoDeMedicalRecord_RN_002()
    {
        using var context = CreateDbContext();
        var record = MedicalRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, DateTimeOffset.UtcNow);
        context.MedicalRecords.Add(record);
        context.SaveChanges();

        context.MedicalRecords.Remove(record);

        var ex = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Equal(ImmutableRecordsInterceptor.DeletionBlockedMessage, ex.Message);
    }

    [Fact]
    public async Task SaveChangesAsync_DeveBloquearExclusaoDeMedicalRecord_RN_002()
    {
        using var context = CreateDbContext();
        var record = MedicalRecord.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), null, DateTimeOffset.UtcNow);
        await context.MedicalRecords.AddAsync(record);
        await context.SaveChangesAsync();

        context.MedicalRecords.Remove(record);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => context.SaveChangesAsync());
        Assert.Equal(ImmutableRecordsInterceptor.DeletionBlockedMessage, ex.Message);
    }

    [Fact]
    public void SaveChanges_DeveBloquearExclusaoDeAuditEvent_RN_002()
    {
        using var context = CreateDbContext();
        var audit = AuditEvent.Record(Guid.NewGuid(), "user1", "Dr. Ana", "auth.login", "user", Guid.NewGuid().ToString(), DateTimeOffset.UtcNow);
        context.AuditEvents.Add(audit);
        context.SaveChanges();

        context.AuditEvents.Remove(audit);

        var ex = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Equal(ImmutableRecordsInterceptor.DeletionBlockedMessage, ex.Message);
    }

    [Fact]
    public void SaveChanges_DeveBloquearExclusaoDeMedicalDocument_RN_002()
    {
        using var context = CreateDbContext();
        var document = MedicalDocument.CreateDraft(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            MedicalDocumentType.ReceitaSimples,
            "{}",
            null,
            false,
            DateTimeOffset.UtcNow);
        context.MedicalDocuments.Add(document);
        context.SaveChanges();

        context.MedicalDocuments.Remove(document);

        var ex = Assert.Throws<InvalidOperationException>(() => context.SaveChanges());
        Assert.Equal(ImmutableRecordsInterceptor.DeletionBlockedMessage, ex.Message);
    }
}
