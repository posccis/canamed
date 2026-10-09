using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PreventiveScreeningRecordConfiguration : IEntityTypeConfiguration<PreventiveScreeningRecord>
{
    public void Configure(EntityTypeBuilder<PreventiveScreeningRecord> builder)
    {
        builder.ToTable("preventive_screenings");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.ClinicId).IsRequired();
        builder.Property(s => s.PatientId).IsRequired();
        builder.Property(s => s.ExamType).HasMaxLength(50).IsRequired();
        builder.Property(s => s.PerformedAt).IsRequired();
        builder.Property(s => s.ResultSummary).HasMaxLength(1000).IsRequired();
        builder.Property(s => s.Classification).HasMaxLength(100);

        builder.HasIndex(s => new { s.ClinicId, s.PatientId, s.PerformedAt });
        builder.HasIndex(s => s.MedicalRecordId);
    }
}
