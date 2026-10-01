using Canamed.Domain.Agenda;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class ProfessionalBlockConfiguration : IEntityTypeConfiguration<ProfessionalBlock>
{
    public void Configure(EntityTypeBuilder<ProfessionalBlock> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable(
            "professional_blocks",
            table => table.HasCheckConstraint("ck_professional_blocks_period_valid", "ends_at > starts_at"));

        builder.HasKey(block => block.Id);
        builder.Property(block => block.Reason).HasMaxLength(500);
        builder.HasIndex(block => new { block.ProfessionalId, block.StartsAt });

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(block => block.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Professional>()
            .WithMany()
            .HasForeignKey(block => block.ProfessionalId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
