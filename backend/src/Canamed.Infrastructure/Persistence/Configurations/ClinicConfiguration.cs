using Canamed.Domain.Clinics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class ClinicConfiguration : IEntityTypeConfiguration<Clinic>
{
    public void Configure(EntityTypeBuilder<Clinic> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("clinics");
        builder.HasKey(clinic => clinic.Id);
        builder.Property(clinic => clinic.Name).HasMaxLength(200).IsRequired();
        builder.Property(clinic => clinic.Slug).HasMaxLength(Clinic.MaxSlugLength).IsRequired();
        builder.Property(clinic => clinic.PublicName).HasMaxLength(120);
        builder.Property(clinic => clinic.AllowWaitlist).HasDefaultValue(false).IsRequired();
        builder.Property(clinic => clinic.AllowSelfReschedule).HasDefaultValue(true).IsRequired();
        builder.Property(clinic => clinic.MaxOnlineAppointments).HasDefaultValue(2).IsRequired();
        builder.HasIndex(clinic => clinic.Slug).IsUnique();
        builder.Property(clinic => clinic.CreatedAt).IsRequired();
        builder.Property(clinic => clinic.UpdatedAt).IsRequired();
    }
}
