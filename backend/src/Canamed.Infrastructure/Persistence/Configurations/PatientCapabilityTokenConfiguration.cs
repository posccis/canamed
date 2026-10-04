using Canamed.Domain.Portal;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

/// <summary>Mapeamento dos tokens de capacidade de links compartilháveis (SPEC-0026/7.2).</summary>
public sealed class PatientCapabilityTokenConfiguration : IEntityTypeConfiguration<PatientCapabilityToken>
{
    public void Configure(EntityTypeBuilder<PatientCapabilityToken> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("patient_capability_tokens", table =>
        {
            table.HasCheckConstraint(
                "ck_patient_capability_tokens_scope_valid",
                "scope IN ('confirm', 'cancel', 'reschedule', 'check_in', 'queue', 'registration', 'document', 'waitlist_offer')");
            table.HasCheckConstraint(
                "ck_patient_capability_tokens_status_valid",
                "status IN ('active', 'used', 'revoked', 'expired')");
        });

        builder.HasKey(token => token.Id);

        builder.Property(token => token.Scope)
            .HasConversion(
                scope => scope.ToStoredValue(),
                value => CapabilityMap.ScopeFromStoredValue(value))
            .HasMaxLength(30)
            .IsRequired();
        builder.Property(token => token.TokenHash).HasMaxLength(128).IsRequired();
        builder.Property(token => token.Status)
            .HasConversion(
                status => status.ToStoredValue(),
                value => CapabilityMap.StatusFromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();
        builder.Property(token => token.CreatedBy).HasMaxLength(80).IsRequired();

        builder.HasIndex(token => token.TokenHash).IsUnique();
        builder.HasIndex(token => new { token.ClinicId, token.Scope });
        builder.HasIndex(token => token.AppointmentId);
        builder.HasIndex(token => token.PatientId);
        builder.HasIndex(token => token.QueueEntryId);
        builder.HasIndex(token => token.MedicalDocumentId);

        builder.Property(token => token.CreatedAt).IsRequired();
        builder.Property(token => token.UpdatedAt).IsRequired();

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(token => token.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
