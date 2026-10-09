using Canamed.Domain.CashRegister;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class CashSessionConfiguration : IEntityTypeConfiguration<CashSession>
{
    public void Configure(EntityTypeBuilder<CashSession> builder)
    {
        builder.ToTable("cash_sessions");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.OperatorName).HasMaxLength(150).IsRequired();
        builder.Property(c => c.Status).HasMaxLength(20).IsRequired();
        builder.Property(c => c.InitialFloat).HasPrecision(18, 2);
        builder.Property(c => c.TotalCashExpected).HasPrecision(18, 2);
        builder.Property(c => c.TotalPixExpected).HasPrecision(18, 2);
        builder.Property(c => c.TotalDebitExpected).HasPrecision(18, 2);
        builder.Property(c => c.TotalCreditExpected).HasPrecision(18, 2);
        builder.Property(c => c.TotalCashDeclared).HasPrecision(18, 2);
        builder.Property(c => c.TotalPixDeclared).HasPrecision(18, 2);
        builder.Property(c => c.TotalDebitDeclared).HasPrecision(18, 2);
        builder.Property(c => c.TotalCreditDeclared).HasPrecision(18, 2);
        builder.Property(c => c.CashDifference).HasPrecision(18, 2);
        builder.Property(c => c.ClosingNotes).HasMaxLength(1000);

        builder.HasIndex(c => new { c.ClinicId, c.OperatorUserId, c.Status });

        builder.HasMany(c => c.Movements)
            .WithOne()
            .HasForeignKey(m => m.CashSessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class CashMovementConfiguration : IEntityTypeConfiguration<CashMovement>
{
    public void Configure(EntityTypeBuilder<CashMovement> builder)
    {
        builder.ToTable("cash_movements");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.MovementType).HasMaxLength(20).IsRequired();
        builder.Property(m => m.Amount).HasPrecision(18, 2);
        builder.Property(m => m.Reason).HasMaxLength(500).IsRequired();

        builder.HasIndex(m => m.CashSessionId);
    }
}
