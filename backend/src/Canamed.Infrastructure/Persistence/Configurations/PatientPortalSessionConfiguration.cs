using Canamed.Domain.Portal;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PatientPortalSessionConfiguration : IEntityTypeConfiguration<PatientPortalSession>
{
    public void Configure(EntityTypeBuilder<PatientPortalSession> builder)
    {
        builder.ToTable("patient_portal_sessions");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.SessionToken)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(s => s.IpAddress)
            .HasMaxLength(64);

        builder.Property(s => s.UserAgent)
            .HasMaxLength(300);

        builder.HasIndex(s => s.SessionToken).IsUnique();
        builder.HasIndex(s => new { s.PatientId, s.ExpiresAt });
    }
}
