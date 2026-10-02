using Canamed.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class CashMovementConfiguration : IEntityTypeConfiguration<CashMovement>
{
    public void Configure(EntityTypeBuilder<CashMovement> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("cash_movements", table =>
        {
            table.HasCheckConstraint("ck_cash_movements_type_valid", "type IN ('suprimento', 'sangria')");
            table.HasCheckConstraint("ck_cash_movements_amount_positive", "amount > 0");
        });

        builder.HasKey(movement => movement.Id);
        builder.Property(movement => movement.Type).HasMaxLength(20).IsRequired();
        builder.Property(movement => movement.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(movement => movement.Reason).HasMaxLength(500).IsRequired();

        builder.HasIndex(movement => new { movement.CashRegisterShiftId, movement.CreatedAt });

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(movement => movement.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<CashRegisterShift>()
            .WithMany()
            .HasForeignKey(movement => movement.CashRegisterShiftId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Canamed.Domain.Identity.User>()
            .WithMany()
            .HasForeignKey(movement => movement.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
