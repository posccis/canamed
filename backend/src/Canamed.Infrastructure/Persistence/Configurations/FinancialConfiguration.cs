using Canamed.Domain.Financial;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class MedicalPayoutContractConfiguration : IEntityTypeConfiguration<MedicalPayoutContract>
{
    public void Configure(EntityTypeBuilder<MedicalPayoutContract> builder)
    {
        builder.ToTable("medical_payout_contracts");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.PayoutType).HasMaxLength(20).IsRequired();
        builder.Property(c => c.Value).HasPrecision(18, 2);

        builder.HasIndex(c => new { c.ClinicId, c.ProfessionalId }).IsUnique();
    }
}

public sealed class MedicalPayoutBatchConfiguration : IEntityTypeConfiguration<MedicalPayoutBatch>
{
    public void Configure(EntityTypeBuilder<MedicalPayoutBatch> builder)
    {
        builder.ToTable("medical_payout_batches");
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Status).HasMaxLength(20).IsRequired();
        builder.Property(b => b.TotalGross).HasPrecision(18, 2);
        builder.Property(b => b.TotalClinicRetained).HasPrecision(18, 2);
        builder.Property(b => b.TotalPayoutAmount).HasPrecision(18, 2);
        builder.Property(b => b.ReceiptReference).HasMaxLength(150);
        builder.Property(b => b.SettlementNotes).HasMaxLength(1000);

        builder.HasIndex(b => new { b.ClinicId, b.ProfessionalId, b.Status });

        builder.HasMany(b => b.Items)
            .WithOne()
            .HasForeignKey(i => i.BatchId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class MedicalPayoutItemConfiguration : IEntityTypeConfiguration<MedicalPayoutItem>
{
    public void Configure(EntityTypeBuilder<MedicalPayoutItem> builder)
    {
        builder.ToTable("medical_payout_items");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.PatientName).HasMaxLength(150).IsRequired();
        builder.Property(i => i.GrossAmount).HasPrecision(18, 2);
        builder.Property(i => i.ClinicRetainedAmount).HasPrecision(18, 2);
        builder.Property(i => i.PayoutAmount).HasPrecision(18, 2);

        builder.HasIndex(i => i.BatchId);
    }
}

public sealed class FinancialTransactionConfiguration : IEntityTypeConfiguration<FinancialTransaction>
{
    public void Configure(EntityTypeBuilder<FinancialTransaction> builder)
    {
        builder.ToTable("financial_transactions");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Type).HasMaxLength(20).IsRequired();
        builder.Property(t => t.Category).HasMaxLength(50).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(255).IsRequired();
        builder.Property(t => t.Amount).HasPrecision(18, 2);
        builder.Property(t => t.Status).HasMaxLength(20).IsRequired();

        builder.HasIndex(t => new { t.ClinicId, t.Type, t.CompetenceDate });
    }
}
