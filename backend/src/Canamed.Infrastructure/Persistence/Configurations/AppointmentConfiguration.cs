using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("appointments", table =>
        {
            table.HasCheckConstraint("ck_appointments_duration_positive", "duration_minutes > 0");
            table.HasCheckConstraint("ck_appointments_period_valid", "ends_at > starts_at");
            table.HasCheckConstraint(
                "ck_appointments_status_valid",
                "status IN ('agendado', 'confirmado', 'atendido', 'cancelado', 'faltou')");
        });

        builder.HasKey(appointment => appointment.Id);
        builder.Property(appointment => appointment.Status)
            .HasConversion(
                status => status.ToStoredValue(),
                value => AppointmentStatusMap.FromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(appointment => appointment.CancellationReason).HasMaxLength(500);
        builder.Property(appointment => appointment.DurationMinutes).IsRequired();
        builder.HasIndex(appointment => new { appointment.ProfessionalId, appointment.StartsAt });
        builder.HasIndex(appointment => new { appointment.ClinicId, appointment.StartsAt });

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(appointment => appointment.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Professional>()
            .WithMany()
            .HasForeignKey(appointment => appointment.ProfessionalId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Patient>()
            .WithMany()
            .HasForeignKey(appointment => appointment.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<AppointmentType>()
            .WithMany()
            .HasForeignKey(appointment => appointment.AppointmentTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
