using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PatientExamAttachmentConfiguration : IEntityTypeConfiguration<PatientExamAttachment>
{
    public void Configure(EntityTypeBuilder<PatientExamAttachment> builder)
    {
        builder.ToTable("patient_exam_attachments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ClinicId).IsRequired();
        builder.Property(a => a.PatientId).IsRequired();
        builder.Property(a => a.MedicalRecordId);

        builder.Property(a => a.Title).HasMaxLength(200).IsRequired();
        builder.Property(a => a.ExamType).HasMaxLength(50).IsRequired();
        builder.Property(a => a.ExamDate).IsRequired();
        builder.Property(a => a.LabFacility).HasMaxLength(200);
        builder.Property(a => a.Notes).HasMaxLength(2000);

        builder.Property(a => a.FileName).HasMaxLength(255).IsRequired();
        builder.Property(a => a.ContentType).HasMaxLength(100).IsRequired();
        builder.Property(a => a.FileSizeBytes).IsRequired();
        builder.Property(a => a.FileHash).HasMaxLength(64).IsRequired();
        builder.Property(a => a.StoragePath).HasMaxLength(500).IsRequired();

        builder.Property(a => a.UploadedByUserId).HasMaxLength(100).IsRequired();
        builder.Property(a => a.UploadedByName).HasMaxLength(150).IsRequired();
        builder.Property(a => a.IsActive).IsRequired().HasDefaultValue(true);

        builder.Property(a => a.CreatedAt).IsRequired();
        builder.Property(a => a.UpdatedAt);

        builder.HasIndex(a => new { a.ClinicId, a.PatientId, a.ExamDate });
        builder.HasIndex(a => new { a.ClinicId, a.Id });
        builder.HasIndex(a => a.MedicalRecordId);
    }
}
