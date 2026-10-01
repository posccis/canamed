using Canamed.Domain.Auditing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("audit_events");
        builder.HasKey(auditEvent => auditEvent.Id);
        builder.Property(auditEvent => auditEvent.ClinicId).IsRequired(false);
        builder.Property(auditEvent => auditEvent.ActorId).HasMaxLength(100).IsRequired();
        builder.Property(auditEvent => auditEvent.ActorName).HasMaxLength(200).IsRequired();
        builder.Property(auditEvent => auditEvent.Action).HasMaxLength(100).IsRequired();
        builder.Property(auditEvent => auditEvent.ResourceType).HasMaxLength(100).IsRequired();
        builder.Property(auditEvent => auditEvent.ResourceId).HasMaxLength(100);
        builder.Property(auditEvent => auditEvent.Details).HasColumnType("jsonb");
        builder.Property(auditEvent => auditEvent.OccurredAt).IsRequired();
        builder.HasIndex(auditEvent => new { auditEvent.ClinicId, auditEvent.OccurredAt });
        builder.HasIndex(auditEvent => new { auditEvent.ResourceType, auditEvent.ResourceId });
    }
}
