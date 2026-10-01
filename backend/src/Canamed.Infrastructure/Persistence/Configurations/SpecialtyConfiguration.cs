using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class SpecialtyConfiguration : IEntityTypeConfiguration<Specialty>
{
    public void Configure(EntityTypeBuilder<Specialty> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("specialties");
        builder.HasKey(specialty => specialty.Id);
        builder.Property(specialty => specialty.Name).HasMaxLength(120).IsRequired();
        builder.HasIndex(specialty => new { specialty.ClinicId, specialty.Name }).IsUnique();

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(specialty => specialty.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
