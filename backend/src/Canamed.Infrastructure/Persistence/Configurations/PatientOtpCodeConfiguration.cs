using Canamed.Domain.Portal;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class PatientOtpCodeConfiguration : IEntityTypeConfiguration<PatientOtpCode>
{
    public void Configure(EntityTypeBuilder<PatientOtpCode> builder)
    {
        builder.ToTable("patient_otp_codes");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Phone)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(o => o.Cpf)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(o => o.CodeHash)
            .HasMaxLength(128)
            .IsRequired();

        builder.HasIndex(o => new { o.Phone, o.Cpf, o.ExpiresAt });
    }
}
