using Canamed.Domain.Common;

namespace Canamed.Domain.Payments;

public static class CashRegisterStatuses
{
    public const string Open = "aberto";
    public const string Closed = "fechado";
}

public static class CashMovementTypes
{
    public const string Supply = "suprimento";
    public const string Withdrawal = "sangria";
}

public sealed class CashRegisterShift : Entity
{
    private CashRegisterShift()
    {
    }

    public Guid ClinicId { get; private set; }
    public Guid OperatorId { get; private set; }
    public string Status { get; private set; } = CashRegisterStatuses.Open;
    public decimal InitialCash { get; private set; }
    public DateTimeOffset OpenedAt { get; private set; }
    public DateTimeOffset? ClosedAt { get; private set; }
    public decimal? DeclaredCash { get; private set; }
    public decimal? ExpectedCash { get; private set; }
    public decimal? CashDifference { get; private set; }
    public string? Notes { get; private set; }

    public static CashRegisterShift Open(
        Guid clinicId,
        Guid operatorId,
        decimal initialCash,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            throw new ArgumentException("A clínica é obrigatória.", nameof(clinicId));
        }

        if (operatorId == Guid.Empty)
        {
            throw new ArgumentException("O operador é obrigatório.", nameof(operatorId));
        }

        if (initialCash < 0)
        {
            throw new ArgumentException("O saldo inicial não pode ser negativo.", nameof(initialCash));
        }

        var shift = new CashRegisterShift
        {
            ClinicId = clinicId,
            OperatorId = operatorId,
            Status = CashRegisterStatuses.Open,
            InitialCash = initialCash,
            OpenedAt = now,
        };

        shift.MarkCreated(now);
        return shift;
    }

    public void Close(
        decimal declaredCash,
        decimal expectedCash,
        string? notes,
        DateTimeOffset now)
    {
        if (Status != CashRegisterStatuses.Open)
        {
            throw new InvalidOperationException("Este caixa já está fechado.");
        }

        if (declaredCash < 0)
        {
            throw new ArgumentException("O valor em dinheiro informado não pode ser negativo.", nameof(declaredCash));
        }

        Status = CashRegisterStatuses.Closed;
        ClosedAt = now;
        DeclaredCash = declaredCash;
        ExpectedCash = expectedCash;
        CashDifference = declaredCash - expectedCash;
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
        MarkUpdated(now);
    }
}
