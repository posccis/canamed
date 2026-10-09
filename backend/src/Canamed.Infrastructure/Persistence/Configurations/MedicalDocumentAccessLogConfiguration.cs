using Canamed.Domain.MedicalDocuments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class MedicalDocumentAccessLogConfiguration : IEntityTypeConfiguration<MedicalDocumentAccessLog>
{
    public void Configure(EntityTypeBuilder<MedicalDocumentAccessLog> builder)
    {
        builder.ToTable("medical_document_access_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.AccessType)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(l => l.IpAddress)
            .HasMaxLength(64);

        builder.Property(l => l.UserAgent)
            .HasMaxLength(300);

        builder.HasIndex(l => new { l.MedicalDocumentId, l.CreatedAt });
    }
}
