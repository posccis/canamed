using Canamed.Domain.Privacy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PrivacyRequestConfiguration : IEntityTypeConfiguration<PrivacyRequest>
{
    public void Configure(EntityTypeBuilder<PrivacyRequest> builder)
    {
        builder.ToTable("privacy_requests");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Protocol)
            .HasMaxLength(60)
            .IsRequired();

        builder.Property(r => r.RequestType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.Details)
            .HasMaxLength(2000);

        builder.Property(r => r.ResponseNotes)
            .HasMaxLength(2000);

        builder.HasIndex(r => r.Protocol).IsUnique();
        builder.HasIndex(r => new { r.ClinicId, r.Status });
        builder.HasIndex(r => r.PatientId);
    }
}
