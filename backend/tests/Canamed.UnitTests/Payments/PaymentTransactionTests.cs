using Canamed.Domain.Payments;

namespace Canamed.UnitTests.Payments;

public sealed class PaymentTransactionTests
{
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _appointmentId = Guid.NewGuid();
    private readonly Guid _patientId = Guid.NewGuid();
    private readonly Guid _operatorId = Guid.NewGuid();
    private readonly DateTimeOffset _now = new(2026, 10, 1, 14, 30, 0, TimeSpan.Zero);

    [Fact]
    public void Record_ValidCashPayment_CreatesTransactionWithPaidStatus()
    {
        var tx = PaymentTransaction.Record(
            _clinicId,
            _appointmentId,
            _patientId,
            180.50m,
            PaymentMethods.Cash,
            _operatorId,
            _now,
            notes: "Pago em dinheiro no balcão");

        Assert.Equal(_clinicId, tx.ClinicId);
        Assert.Equal(_appointmentId, tx.AppointmentId);
        Assert.Equal(_patientId, tx.PatientId);
        Assert.Equal(180.50m, tx.Amount);
        Assert.Equal(PaymentMethods.Cash, tx.Method);
        Assert.Equal(PaymentStatuses.Paid, tx.Status);
        Assert.Equal(_operatorId, tx.OperatorId);
        Assert.Equal("Pago em dinheiro no balcão", tx.Notes);
        Assert.Equal(_now, tx.PaidAt);
    }

    [Fact]
    public void Record_CardPaymentWithBrandAndDigits_CleansDigitsToLastFour()
    {
        var tx = PaymentTransaction.Record(
            _clinicId,
            _appointmentId,
            _patientId,
            250.00m,
            PaymentMethods.CreditCard,
            _operatorId,
            _now,
            cardBrand: "Visa",
            cardLastFourDigits: "4111-2222-3333-8899");

        Assert.Equal("Visa", tx.CardBrand);
        Assert.Equal("8899", tx.CardLastFourDigits);
        Assert.Equal(PaymentMethods.CreditCard, tx.Method);
    }

    [Fact]
    public void Record_HealthPlanBilledWithZeroAmount_IsAllowed()
    {
        var tx = PaymentTransaction.Record(
            _clinicId,
            _appointmentId,
            _patientId,
            0m,
            PaymentMethods.HealthPlanBilled,
            _operatorId,
            _now,
            notes: "Autorização Unimed #123456");

        Assert.Equal(0m, tx.Amount);
        Assert.Equal(PaymentMethods.HealthPlanBilled, tx.Method);
        Assert.Equal(PaymentStatuses.Paid, tx.Status);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-50)]
    public void Record_NonHealthPlanWithZeroOrNegativeAmount_ThrowsArgumentException(decimal amount)
    {
        Assert.Throws<ArgumentException>(() =>
            PaymentTransaction.Record(
                _clinicId,
                _appointmentId,
                _patientId,
                amount,
                PaymentMethods.Pix,
                _operatorId,
                _now));
    }

    [Fact]
    public void Record_InvalidPaymentMethod_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() =>
            PaymentTransaction.Record(
                _clinicId,
                _appointmentId,
                _patientId,
                100m,
                "bitcoin",
                _operatorId,
                _now));
    }

    [Fact]
    public void Refund_ValidReason_MarksAsRefunded()
    {
        var tx = PaymentTransaction.Record(
            _clinicId,
            _appointmentId,
            _patientId,
            200m,
            PaymentMethods.Pix,
            _operatorId,
            _now);

        var refundTime = _now.AddHours(1);
        tx.Refund(_operatorId, "Paciente cancelou antes do horário", refundTime);

        Assert.Equal(PaymentStatuses.Refunded, tx.Status);
        Assert.Equal("Paciente cancelou antes do horário", tx.RefundReason);
        Assert.Equal(_operatorId, tx.RefundedBy);
        Assert.Equal(refundTime, tx.RefundedAt);
    }

    [Fact]
    public void Refund_AlreadyRefunded_ThrowsInvalidOperationException()
    {
        var tx = PaymentTransaction.Record(
            _clinicId,
            _appointmentId,
            _patientId,
            200m,
            PaymentMethods.Pix,
            _operatorId,
            _now);

        tx.Refund(_operatorId, "Motivo válido de estorno", _now.AddMinutes(10));

        Assert.Throws<InvalidOperationException>(() =>
            tx.Refund(_operatorId, "Tentativa de segundo estorno", _now.AddMinutes(20)));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("123")]
    public void Refund_ShortOrEmptyReason_ThrowsArgumentException(string reason)
    {
        var tx = PaymentTransaction.Record(
            _clinicId,
            _appointmentId,
            _patientId,
            200m,
            PaymentMethods.Pix,
            _operatorId,
            _now);

        Assert.Throws<ArgumentException>(() =>
            tx.Refund(_operatorId, reason, _now.AddMinutes(10)));
    }
}
