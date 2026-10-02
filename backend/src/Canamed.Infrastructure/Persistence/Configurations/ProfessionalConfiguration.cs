using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class ProfessionalConfiguration : IEntityTypeConfiguration<Professional>
{
    public void Configure(EntityTypeBuilder<Professional> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("professionals");
        builder.HasKey(professional => professional.Id);
        builder.Property(professional => professional.Name).HasMaxLength(200).IsRequired();
        builder.Property(professional => professional.RegistrationNumber).HasMaxLength(40);
        builder.HasIndex(professional => professional.ClinicId);

        builder.HasOne<Specialty>()
            .WithMany()
            .HasForeignKey(professional => professional.SpecialtyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(professional => professional.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
