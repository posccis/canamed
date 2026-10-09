using Canamed.Domain.MedicalRecords;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class GynecologicalConsultationDataConfiguration : IEntityTypeConfiguration<GynecologicalConsultationData>
{
    public void Configure(EntityTypeBuilder<GynecologicalConsultationData> builder)
    {
        builder.ToTable("gynecological_consultation_data");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.MedicalRecordId).IsRequired();

        builder.Property(d => d.ChiefComplaint).HasMaxLength(500);
        builder.Property(d => d.Hma).HasMaxLength(4000);
        builder.Property(d => d.Dyspareunia).HasMaxLength(30);

        builder.Property(d => d.BreastsFindings).HasMaxLength(1000);
        builder.Property(d => d.AbdomenFindings).HasMaxLength(1000);
        builder.Property(d => d.ExternalGenitaliaFindings).HasMaxLength(1000);
        builder.Property(d => d.SpeculumExamFindings).HasMaxLength(1000);
        builder.Property(d => d.BimanualPalpationFindings).HasMaxLength(1000);

        builder.Property(d => d.ProcedurePerformed).HasMaxLength(100);
        builder.Property(d => d.ProcedureBatch).HasMaxLength(50);
        builder.Property(d => d.ProcedureNotes).HasMaxLength(1000);
        builder.Property(d => d.DiagnosesJson).HasMaxLength(2000);
        builder.Property(d => d.PrescriptionNotes).HasMaxLength(3000);
        builder.Property(d => d.GeneralOrientationNotes).HasMaxLength(2000);

        builder.HasIndex(d => d.MedicalRecordId).IsUnique();
    }
}
