using Canamed.Domain.Privacy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PrivacyConsentConfiguration : IEntityTypeConfiguration<PrivacyConsent>
{
    public void Configure(EntityTypeBuilder<PrivacyConsent> builder)
    {
        builder.ToTable("privacy_consents");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.ConsentType)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.PolicyVersion)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(c => c.IpAddress)
            .HasMaxLength(64);

        builder.HasIndex(c => new { c.PatientId, c.ConsentType }).IsUnique();
    }
}
