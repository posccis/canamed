using Canamed.Domain.Inventory;

namespace Canamed.UnitTests.Inventory;

public sealed class InventoryItemTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();

    [Fact]
    public void Create_InitializesInventoryItemCorrectly()
    {
        var item = InventoryItem.Create(
            _clinicId,
            "Seringa Descartável 5ml",
            "Descartáveis",
            "unidade",
            100m,
            20m,
            "LOTE-2026-A",
            _now.AddDays(180),
            _now);

        Assert.Equal("Seringa Descartável 5ml", item.Name);
        Assert.Equal(100m, item.CurrentQuantity);
        Assert.Equal(20m, item.MinimumQuantity);
        Assert.False(item.IsBelowMinimum());
        Assert.False(item.IsExpired(_now));
        Assert.False(item.IsExpiringSoon(_now, 30));
    }

    [Fact]
    public void AddStock_And_ConsumeStock_UpdateQuantitiesCorrectly()
    {
        var item = InventoryItem.Create(
            _clinicId,
            "Gaze Estéril",
            "Curativos",
            "pacote",
            50m,
            15m,
            null,
            null,
            _now);

        item.AddStock(25m, _now);
        Assert.Equal(75m, item.CurrentQuantity);

        item.ConsumeStock(30m, _now);
        Assert.Equal(45m, item.CurrentQuantity);
    }

    [Fact]
    public void ConsumeStock_ThrowsWhenQuantityExceedsAvailable()
    {
        var item = InventoryItem.Create(
            _clinicId,
            "Álcool 70%",
            "EPIs",
            "frasco",
            5m,
            2m,
            null,
            null,
            _now);

        Assert.Throws<InvalidOperationException>(() => item.ConsumeStock(10m, _now));
    }

    [Fact]
    public void IsExpired_And_IsExpiringSoon_DetectExpiryCorrectly()
    {
        var expiredItem = InventoryItem.Create(
            _clinicId,
            "Medicamento Vencido",
            "Medicamentos",
            "ampola",
            10m,
            5m,
            "LOTE-EXP",
            _now.AddDays(-2),
            _now);

        var expiringSoonItem = InventoryItem.Create(
            _clinicId,
            "Medicamento Vencendo",
            "Medicamentos",
            "ampola",
            10m,
            5m,
            "LOTE-SOON",
            _now.AddDays(15),
            _now);

        Assert.True(expiredItem.IsExpired(_now));
        Assert.True(expiringSoonItem.IsExpiringSoon(_now, 30));
    }
}
