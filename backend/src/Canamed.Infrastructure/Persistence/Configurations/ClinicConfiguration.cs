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
        builder.Property(clinic => clinic.CreatedAt).IsRequired();
        builder.Property(clinic => clinic.UpdatedAt).IsRequired();
    }
}
