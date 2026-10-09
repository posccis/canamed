using Canamed.Domain.Inventory;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Canamed.Infrastructure.Persistence.Configurations;

public sealed class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("inventory_items");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Name).HasMaxLength(150).IsRequired();
        builder.Property(i => i.Category).HasMaxLength(50).IsRequired();
        builder.Property(i => i.Unit).HasMaxLength(20).IsRequired();
        builder.Property(i => i.CurrentQuantity).HasPrecision(18, 2);
        builder.Property(i => i.MinimumQuantity).HasPrecision(18, 2);
        builder.Property(i => i.LotNumber).HasMaxLength(50);

        builder.HasIndex(i => new { i.ClinicId, i.Category });
    }
}

public sealed class InventoryMovementConfiguration : IEntityTypeConfiguration<InventoryMovement>
{
    public void Configure(EntityTypeBuilder<InventoryMovement> builder)
    {
        builder.ToTable("inventory_movements");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.MovementType).HasMaxLength(20).IsRequired();
        builder.Property(m => m.Quantity).HasPrecision(18, 2);
        builder.Property(m => m.UnitPrice).HasPrecision(18, 2);
        builder.Property(m => m.Reason).HasMaxLength(500).IsRequired();

        builder.HasIndex(m => new { m.ClinicId, m.InventoryItemId, m.CreatedAt });
    }
}
