using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class MedicalRecordConfiguration : IEntityTypeConfiguration<MedicalRecord>
{
    public void Configure(EntityTypeBuilder<MedicalRecord> builder)
    {
        builder.ToTable("medical_records");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(r => r.Subjective);
        builder.Property(r => r.Objective);
        builder.Property(r => r.Assessment);
        builder.Property(r => r.Plan);
        builder.Property(r => r.ClinicalNotes);

        builder.HasIndex(r => new { r.ClinicId, r.PatientId, r.CreatedAt });
        builder.HasIndex(r => r.AppointmentId);

        builder.HasMany(r => r.Addenda)
            .WithOne()
            .HasForeignKey(a => a.MedicalRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.GynecologicalData)
            .WithOne()
            .HasForeignKey<GynecologicalConsultationData>(d => d.MedicalRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(r => r.Addenda)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public sealed class MedicalRecordAddendumConfiguration : IEntityTypeConfiguration<MedicalRecordAddendum>
{
    public void Configure(EntityTypeBuilder<MedicalRecordAddendum> builder)
    {
        builder.ToTable("medical_record_addenda");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Justification)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(a => a.Notes)
            .IsRequired();

        builder.HasIndex(a => a.MedicalRecordId);
    }
}
