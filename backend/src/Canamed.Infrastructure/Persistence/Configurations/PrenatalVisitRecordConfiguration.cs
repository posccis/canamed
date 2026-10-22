using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PrenatalVisitRecordConfiguration : IEntityTypeConfiguration<PrenatalVisitRecord>
{
    public void Configure(EntityTypeBuilder<PrenatalVisitRecord> builder)
    {
        builder.ToTable("prenatal_visit_records");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClinicId).HasColumnName("clinic_id").IsRequired();
        builder.Property(x => x.PatientId).HasColumnName("patient_id").IsRequired();
        builder.Property(x => x.MedicalRecordId).HasColumnName("medical_record_id").IsRequired();
        builder.Property(x => x.VisitDate).HasColumnName("visit_date").IsRequired();
        builder.Property(x => x.GestationalAgeWeeks).HasColumnName("gestational_age_weeks").IsRequired();
        builder.Property(x => x.GestationalAgeDays).HasColumnName("gestational_age_days").IsRequired();
        builder.Property(x => x.WeightKg).HasColumnName("weight_kg").IsRequired();
        builder.Property(x => x.BloodPressure).HasColumnName("blood_pressure").HasMaxLength(20).IsRequired();
        builder.Property(x => x.UterineHeightCm).HasColumnName("uterine_height_cm");
        builder.Property(x => x.FetalHeartRateBpm).HasColumnName("fetal_heart_rate_bpm");
        builder.Property(x => x.FetalMovementPresent).HasColumnName("fetal_movement_present");
        builder.Property(x => x.EdemaClassification).HasColumnName("edema_classification").HasMaxLength(50);
        builder.Property(x => x.FetalPresentation).HasColumnName("fetal_presentation").HasMaxLength(50);
        builder.Property(x => x.ClinicalNotes).HasColumnName("clinical_notes").HasMaxLength(2000);

        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(x => new { x.ClinicId, x.PatientId, x.VisitDate });
        builder.HasIndex(x => x.MedicalRecordId);
    }
}
