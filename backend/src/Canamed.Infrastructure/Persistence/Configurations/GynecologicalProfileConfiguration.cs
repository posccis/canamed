using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class GynecologicalProfileConfiguration : IEntityTypeConfiguration<GynecologicalProfile>
{
    public void Configure(EntityTypeBuilder<GynecologicalProfile> builder)
    {
        builder.ToTable("gynecological_profiles");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.ClinicId).IsRequired();
        builder.Property(p => p.PatientId).IsRequired();

        builder.Property(p => p.FlowIntensity).HasMaxLength(30);
        builder.Property(p => p.Dysmenorrhea).HasMaxLength(30);
        builder.Property(p => p.PmsSymptoms).HasMaxLength(500);
        builder.Property(p => p.MenopauseStatus).HasMaxLength(30);

        builder.Property(p => p.ObstetricNotes).HasMaxLength(1000);
        builder.Property(p => p.CurrentMethod).HasMaxLength(50);
        builder.Property(p => p.PreviousMethods).HasMaxLength(500);
        builder.Property(p => p.ReproductivePlan).HasMaxLength(50);

        builder.Property(p => p.PelvicSurgeries).HasMaxLength(1000);
        builder.Property(p => p.StiHistory).HasMaxLength(1000);
        builder.Property(p => p.FamilyCancerHistory).HasMaxLength(1000);

        builder.HasIndex(p => new { p.ClinicId, p.PatientId }).IsUnique();
    }
}
