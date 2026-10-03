using Canamed.Domain.Common;

namespace Canamed.Domain.Inventory;

/// <summary>
/// Insumo, material médico, medicamento ou descartável de uso clínico (SPEC-0022).
/// </summary>
public sealed class InventoryItem : Entity
{
    private InventoryItem()
    {
    }

    public Guid ClinicId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Category { get; private set; } = string.Empty; // Descartáveis, Medicamentos, Curativos, EPIs, Outros
    public string Unit { get; private set; } = "unidade"; // unidade, caixa, frasco, pacote, ampola
    public decimal CurrentQuantity { get; private set; }
    public decimal MinimumQuantity { get; private set; }
    public string? LotNumber { get; private set; }
    public DateTimeOffset? ExpirationDate { get; private set; }

    public static InventoryItem Create(
        Guid clinicId,
        string name,
        string category,
        string unit,
        decimal initialQuantity,
        decimal minimumQuantity,
        string? lotNumber,
        DateTimeOffset? expirationDate,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty) throw new ArgumentException("Clínica obrigatória.", nameof(clinicId));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome do insumo obrigatório.", nameof(name));
        if (initialQuantity < 0) throw new ArgumentOutOfRangeException(nameof(initialQuantity), "Quantidade inicial não pode ser negativa.");
        if (minimumQuantity < 0) throw new ArgumentOutOfRangeException(nameof(minimumQuantity), "Estoque mínimo não pode ser negativo.");

        var item = new InventoryItem
        {
            ClinicId = clinicId,
            Name = name.Trim(),
            Category = string.IsNullOrWhiteSpace(category) ? "Descartáveis" : category.Trim(),
            Unit = string.IsNullOrWhiteSpace(unit) ? "unidade" : unit.Trim(),
            CurrentQuantity = initialQuantity,
            MinimumQuantity = minimumQuantity,
            LotNumber = string.IsNullOrWhiteSpace(lotNumber) ? null : lotNumber.Trim(),
            ExpirationDate = expirationDate
        };
        item.MarkCreated(now);
        return item;
    }

    public void UpdateDetails(
        string name,
        string category,
        string unit,
        decimal minimumQuantity,
        string? lotNumber,
        DateTimeOffset? expirationDate,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome do insumo obrigatório.", nameof(name));
        if (minimumQuantity < 0) throw new ArgumentOutOfRangeException(nameof(minimumQuantity), "Estoque mínimo não pode ser negativo.");

        Name = name.Trim();
        Category = category.Trim();
        Unit = unit.Trim();
        MinimumQuantity = minimumQuantity;
        LotNumber = string.IsNullOrWhiteSpace(lotNumber) ? null : lotNumber.Trim();
        ExpirationDate = expirationDate;
        MarkUpdated(now);
    }

    public void AddStock(decimal quantity, DateTimeOffset now)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantidade a adicionar deve ser positiva.");
        CurrentQuantity += quantity;
        MarkUpdated(now);
    }

    public void ConsumeStock(decimal quantity, DateTimeOffset now)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Quantidade a consumir deve ser positiva.");
        if (quantity > CurrentQuantity) throw new InvalidOperationException($"Saldo insuficiente em estoque para o item {Name}. Saldo atual: {CurrentQuantity}.");

        CurrentQuantity -= quantity;
        MarkUpdated(now);
    }

    public bool IsBelowMinimum() => CurrentQuantity < MinimumQuantity;

    public bool IsExpired(DateTimeOffset now) => ExpirationDate.HasValue && ExpirationDate.Value.Date < now.Date;

    public bool IsExpiringSoon(DateTimeOffset now, int days = 30) =>
        ExpirationDate.HasValue &&
        ExpirationDate.Value.Date >= now.Date &&
        ExpirationDate.Value.Date <= now.Date.AddDays(days);
}
