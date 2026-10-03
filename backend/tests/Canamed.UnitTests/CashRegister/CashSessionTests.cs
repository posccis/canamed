using Canamed.Domain.CashRegister;

namespace Canamed.UnitTests.CashRegister;

public sealed class CashSessionTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _operatorId = Guid.NewGuid();

    [Fact]
    public void Open_CreatesSessionWithInitialFloatAndSuprimentoMovement()
    {
        var session = CashSession.Open(_clinicId, _operatorId, "Recepcionista 1", 150.00m, _now);

        Assert.Equal(_clinicId, session.ClinicId);
        Assert.Equal(_operatorId, session.OperatorUserId);
        Assert.Equal("Recepcionista 1", session.OperatorName);
        Assert.Equal(150.00m, session.InitialFloat);
        Assert.Equal(150.00m, session.TotalCashExpected);
        Assert.Equal("aberta", session.Status);
        Assert.Single(session.Movements);
        Assert.Equal("suprimento", session.Movements.First().MovementType);
    }

    [Fact]
    public void RegisterPaymentReceived_UpdatesExpectedTotalsCorrectly()
    {
        var session = CashSession.Open(_clinicId, _operatorId, "Recepcionista 1", 100.00m, _now);

        session.RegisterPaymentReceived("dinheiro", 50.00m, _now);
        session.RegisterPaymentReceived("pix", 80.00m, _now);
        session.RegisterPaymentReceived("cartao_debito", 120.00m, _now);
        session.RegisterPaymentReceived("cartao_credito", 200.00m, _now);

        Assert.Equal(150.00m, session.TotalCashExpected);
        Assert.Equal(80.00m, session.TotalPixExpected);
        Assert.Equal(120.00m, session.TotalDebitExpected);
        Assert.Equal(200.00m, session.TotalCreditExpected);
    }

    [Fact]
    public void RegisterSangria_DecreasesExpectedCashAndAddsMovement()
    {
        var session = CashSession.Open(_clinicId, _operatorId, "Recepcionista 1", 200.00m, _now);

        var mv = session.RegisterSangria(150.00m, "Transferência para cofre", _operatorId, _now);

        Assert.Equal(50.00m, session.TotalCashExpected);
        Assert.Equal(150.00m, mv.Amount);
        Assert.Equal("sangria", mv.MovementType);
    }

    [Fact]
    public void RegisterSangria_ThrowsIfAmountExceedsAvailableCash()
    {
        var session = CashSession.Open(_clinicId, _operatorId, "Recepcionista 1", 50.00m, _now);

        Assert.Throws<InvalidOperationException>(() =>
            session.RegisterSangria(100.00m, "Tentativa de sangria maior que saldo", _operatorId, _now));
    }

    [Fact]
    public void Close_CalculatesDifferenceAndLocksSession()
    {
        var session = CashSession.Open(_clinicId, _operatorId, "Recepcionista 1", 100.00m, _now);
        session.RegisterPaymentReceived("dinheiro", 150.00m, _now); // Total esperado: 250.00

        // Operador declara 248.00 (quebra de 2.00)
        session.Close(248.00m, 0m, 0m, 0m, "Quebra de R$ 2,00 por troco", _now);

        Assert.Equal("fechada", session.Status);
        Assert.Equal(-2.00m, session.CashDifference);
        Assert.Equal(248.00m, session.TotalCashDeclared);
        Assert.NotNull(session.ClosedAt);

        // Bloqueia novas operações após fechamento
        Assert.Throws<InvalidOperationException>(() =>
            session.RegisterSangria(10.00m, "Sangria pós fechamento", _operatorId, _now));
    }
}
