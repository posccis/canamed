using Canamed.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

internal sealed class CashRegisterShiftConfiguration : IEntityTypeConfiguration<CashRegisterShift>
{
    public void Configure(EntityTypeBuilder<CashRegisterShift> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("cash_register_shifts", table =>
        {
            table.HasCheckConstraint("ck_cash_shifts_status_valid", "status IN ('aberto', 'fechado')");
            table.HasCheckConstraint("ck_cash_shifts_initial_cash_non_negative", "initial_cash >= 0");
        });

        builder.HasKey(shift => shift.Id);
        builder.Property(shift => shift.Status).HasMaxLength(20).IsRequired();
        builder.Property(shift => shift.InitialCash).HasPrecision(18, 2).IsRequired();
        builder.Property(shift => shift.DeclaredCash).HasPrecision(18, 2);
        builder.Property(shift => shift.ExpectedCash).HasPrecision(18, 2);
        builder.Property(shift => shift.CashDifference).HasPrecision(18, 2);
        builder.Property(shift => shift.Notes).HasMaxLength(500);

        builder.HasIndex(shift => new { shift.ClinicId, shift.OperatorId, shift.Status });
        builder.HasIndex(shift => new { shift.ClinicId, shift.OpenedAt });

        builder.HasOne<Canamed.Domain.Clinics.Clinic>()
            .WithMany()
            .HasForeignKey(shift => shift.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Canamed.Domain.Identity.User>()
            .WithMany()
            .HasForeignKey(shift => shift.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
