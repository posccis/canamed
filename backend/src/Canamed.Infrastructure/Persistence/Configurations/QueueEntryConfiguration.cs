using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class QueueEntryConfiguration : IEntityTypeConfiguration<QueueEntry>
{
    public void Configure(EntityTypeBuilder<QueueEntry> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("queue_entries", table =>
        {
            table.HasCheckConstraint(
                "ck_queue_entries_priority_valid",
                "priority IN ('normal', 'preferencial')");
            table.HasCheckConstraint(
                "ck_queue_entries_status_valid",
                "status IN ('aguardando', 'chamado', 'em_atendimento', 'atendido', 'desistiu', 'cancelado')");
            table.HasCheckConstraint(
                "ck_queue_entries_period_valid",
                "finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at");
        });

        builder.HasKey(entry => entry.Id);
        builder.Property(entry => entry.Priority)
            .HasConversion(
                priority => priority.ToStoredValue(),
                value => QueueMap.PriorityFromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(entry => entry.Status)
            .HasConversion(
                status => status.ToStoredValue(),
                value => QueueMap.StatusFromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(entry => entry.QueueDate).HasColumnType("date").IsRequired();
        builder.HasIndex(entry => new { entry.ClinicId, entry.QueueDate, entry.ProfessionalId });

        // RN-003 garantida no banco: uma única entrada aberta por agendamento (encaixes sem
        // agendamento têm appointment_id nulo e não colidem).
        builder.HasIndex(entry => entry.AppointmentId)
            .IsUnique()
            .HasFilter("status IN ('aguardando', 'chamado', 'em_atendimento')");

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(entry => entry.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Professional>()
            .WithMany()
            .HasForeignKey(entry => entry.ProfessionalId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Patient>()
            .WithMany()
            .HasForeignKey(entry => entry.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Appointment>()
            .WithMany()
            .HasForeignKey(entry => entry.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
