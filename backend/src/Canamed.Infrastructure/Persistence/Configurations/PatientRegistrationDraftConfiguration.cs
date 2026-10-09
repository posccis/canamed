using Canamed.Domain.Agenda;
using Canamed.Domain.Clinics;
using Canamed.Domain.Identity;
using Canamed.Domain.Portal;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

/// <summary>Mapeamento de rascunhos de cadastro completo do paciente (SPEC-0026/7.3).</summary>
public sealed class PatientRegistrationDraftConfiguration : IEntityTypeConfiguration<PatientRegistrationDraft>
{
    public void Configure(EntityTypeBuilder<PatientRegistrationDraft> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("patient_registration_drafts", table =>
        {
            table.HasCheckConstraint(
                "ck_patient_registration_drafts_status_valid",
                "status IN ('draft', 'pending_review', 'approved', 'returned')");
        });

        builder.HasKey(draft => draft.Id);

        builder.Property(draft => draft.ClinicId).IsRequired();
        builder.Property(draft => draft.PatientId).IsRequired();

        builder.Property(draft => draft.PayloadJson)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(draft => draft.Status)
            .HasConversion(
                status => status.ToStoredValue(),
                value => RegistrationDraftMap.FromStoredValue(value))
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(draft => draft.ReviewNote);

        builder.HasIndex(draft => new { draft.ClinicId, draft.Status });
        builder.HasIndex(draft => draft.PatientId);
        builder.HasIndex(draft => draft.CapabilityTokenId);

        builder.Property(draft => draft.CreatedAt).IsRequired();
        builder.Property(draft => draft.UpdatedAt).IsRequired();

        builder.HasOne<Clinic>()
            .WithMany()
            .HasForeignKey(draft => draft.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Patient>()
            .WithMany()
            .HasForeignKey(draft => draft.PatientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<PatientCapabilityToken>()
            .WithMany()
            .HasForeignKey(draft => draft.CapabilityTokenId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(draft => draft.ReviewedBy)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
