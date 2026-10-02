using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Domain.Queue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class TriageRecordConfiguration : IEntityTypeConfiguration<TriageRecord>
{
    public void Configure(EntityTypeBuilder<TriageRecord> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("triage_records");

        builder.HasKey(triage => triage.Id);
        builder.Property(triage => triage.RiskClassification).HasMaxLength(20).IsRequired();
        builder.Property(triage => triage.BloodPressure).HasMaxLength(20);
        builder.Property(triage => triage.Temperature).HasPrecision(4, 1);
        builder.Property(triage => triage.WeightKg).HasPrecision(5, 2);
        builder.Property(triage => triage.HeightCm).HasPrecision(5, 1);
        builder.Property(triage => triage.CalculatedBmi).HasPrecision(5, 2);
        builder.Property(triage => triage.ChiefComplaint).HasMaxLength(500);
        builder.Property(triage => triage.Allergies).HasMaxLength(500);
        builder.Property(triage => triage.OperatorName).HasMaxLength(150).IsRequired();
        builder.Property(triage => triage.RecordedAt).IsRequired();

        builder.HasIndex(triage => new { triage.ClinicId, triage.QueueEntryId }).IsUnique();

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(triage => triage.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<QueueEntry>()
            .WithMany()
            .HasForeignKey(triage => triage.QueueEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Patient>()
            .WithMany()
            .HasForeignKey(triage => triage.PatientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
