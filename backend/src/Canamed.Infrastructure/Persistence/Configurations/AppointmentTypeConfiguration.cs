using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class AppointmentTypeConfiguration : IEntityTypeConfiguration<AppointmentType>
{
    public void Configure(EntityTypeBuilder<AppointmentType> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("appointment_types", table =>
        {
            table.HasCheckConstraint(
                "ck_appointment_types_duration_positive",
                "duration_minutes > 0 AND duration_minutes <= 1440");
            table.HasCheckConstraint(
                "ck_appointment_types_category_valid",
                "category IN ('avulsa', 'acompanhamento')");
            table.HasCheckConstraint(
                "ck_appointment_types_coverage_valid",
                "coverage IN ('particular', 'plano_saude')");
        });

        builder.HasKey(appointmentType => appointmentType.Id);
        builder.Property(appointmentType => appointmentType.Name).HasMaxLength(200).IsRequired();
        builder.Property(appointmentType => appointmentType.Category)
            .HasConversion(
                category => category.ToStoredValue(),
                value => AppointmentClassificationMap.CategoryFromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(appointmentType => appointmentType.Coverage)
            .HasConversion(
                coverage => coverage.ToStoredValue(),
                value => AppointmentClassificationMap.CoverageFromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();
        builder.HasIndex(appointmentType => appointmentType.ClinicId);

        builder.HasOne<Specialty>()
            .WithMany()
            .HasForeignKey(appointmentType => appointmentType.SpecialtyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(appointmentType => appointmentType.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
