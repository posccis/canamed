using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("patients");
        builder.HasKey(patient => patient.Id);
        builder.Property(patient => patient.Name).HasMaxLength(200).IsRequired();
        builder.Property(patient => patient.Phone).HasMaxLength(40).IsRequired();
        builder.Property(patient => patient.Email).HasMaxLength(320);
        builder.Property(patient => patient.BirthDate).HasColumnType("date");
        builder.HasIndex(patient => new { patient.ClinicId, patient.Name });

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(patient => patient.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
