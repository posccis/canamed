using Canamed.Domain.Payments;

namespace Canamed.UnitTests.Payments;

public sealed class CashRegisterShiftTests
{
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _operatorId = Guid.NewGuid();
    private readonly DateTimeOffset _now = new(2026, 10, 2, 8, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Open_ValidArguments_CreatesOpenShift()
    {
        var shift = CashRegisterShift.Open(_clinicId, _operatorId, 100.00m, _now);

        Assert.Equal(_clinicId, shift.ClinicId);
        Assert.Equal(_operatorId, shift.OperatorId);
        Assert.Equal(100.00m, shift.InitialCash);
        Assert.Equal(CashRegisterStatuses.Open, shift.Status);
        Assert.Equal(_now, shift.OpenedAt);
        Assert.Null(shift.ClosedAt);
    }

    [Fact]
    public void Open_NegativeInitialCash_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            CashRegisterShift.Open(_clinicId, _operatorId, -10.00m, _now));
    }

    [Fact]
    public void Open_EmptyClinicOrOperator_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            CashRegisterShift.Open(Guid.Empty, _operatorId, 50.00m, _now));

        Assert.Throws<ArgumentException>(() =>
            CashRegisterShift.Open(_clinicId, Guid.Empty, 50.00m, _now));
    }

    [Fact]
    public void Close_ValidClosing_ComputesDifferenceAndClosesShift()
    {
        var shift = CashRegisterShift.Open(_clinicId, _operatorId, 100.00m, _now);
        var closeTime = _now.AddHours(8);

        // Expected 250, Declared 245 -> Difference -5.00 (falta)
        shift.Close(declaredCash: 245.00m, expectedCash: 250.00m, notes: "Falta de 5 reais", closeTime);

        Assert.Equal(CashRegisterStatuses.Closed, shift.Status);
        Assert.Equal(closeTime, shift.ClosedAt);
        Assert.Equal(245.00m, shift.DeclaredCash);
        Assert.Equal(250.00m, shift.ExpectedCash);
        Assert.Equal(-5.00m, shift.CashDifference);
        Assert.Equal("Falta de 5 reais", shift.Notes);
    }

    [Fact]
    public void Close_AlreadyClosed_ThrowsInvalidOperationException()
    {
        var shift = CashRegisterShift.Open(_clinicId, _operatorId, 100.00m, _now);
        shift.Close(100.00m, 100.00m, null, _now.AddHours(1));

        Assert.Throws<InvalidOperationException>(() =>
            shift.Close(100.00m, 100.00m, null, _now.AddHours(2)));
    }

    [Fact]
    public void CreateMovement_ValidSupplyAndWithdrawal_Succeeds()
    {
        var shiftId = Guid.NewGuid();

        var supply = CashMovement.Create(
            _clinicId,
            shiftId,
            _operatorId,
            CashMovementTypes.Supply,
            50.00m,
            "Troco adicional",
            _now);

        Assert.Equal(CashMovementTypes.Supply, supply.Type);
        Assert.Equal(50.00m, supply.Amount);
        Assert.Equal("Troco adicional", supply.Reason);

        var withdrawal = CashMovement.Create(
            _clinicId,
            shiftId,
            _operatorId,
            CashMovementTypes.Withdrawal,
            100.00m,
            "Sangria para cofre",
            _now);

        Assert.Equal(CashMovementTypes.Withdrawal, withdrawal.Type);
        Assert.Equal(100.00m, withdrawal.Amount);
        Assert.Equal("Sangria para cofre", withdrawal.Reason);
    }

    [Fact]
    public void CreateMovement_InvalidTypeOrNonPositiveAmount_ThrowsArgumentException()
    {
        var shiftId = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() =>
            CashMovement.Create(_clinicId, shiftId, _operatorId, "outro_tipo", 50.00m, "Motivo", _now));

        Assert.Throws<ArgumentException>(() =>
            CashMovement.Create(_clinicId, shiftId, _operatorId, CashMovementTypes.Supply, 0m, "Motivo", _now));

        Assert.Throws<ArgumentException>(() =>
            CashMovement.Create(_clinicId, shiftId, _operatorId, CashMovementTypes.Withdrawal, -20m, "Motivo", _now));
    }
}
