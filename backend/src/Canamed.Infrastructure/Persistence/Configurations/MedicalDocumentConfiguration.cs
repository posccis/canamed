using Canamed.Domain.MedicalDocuments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class MedicalDocumentConfiguration : IEntityTypeConfiguration<MedicalDocument>
{
    public void Configure(EntityTypeBuilder<MedicalDocument> builder)
    {
        builder.ToTable("medical_documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DocumentType)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(d => d.Status)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(d => d.ContentPayload)
            .IsRequired()
            .HasColumnType("jsonb");

        builder.Property(d => d.Cid10Code)
            .HasMaxLength(10);

        builder.Property(d => d.SignatureHash)
            .HasMaxLength(128);

        builder.Property(d => d.PublicToken)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(d => d.CancellationReason)
            .HasMaxLength(500);

        builder.HasIndex(d => d.PublicToken)
            .IsUnique();

        builder.HasIndex(d => new { d.ClinicId, d.PatientId, d.CreatedAt });
        builder.HasIndex(d => d.MedicalRecordId);
    }
}
