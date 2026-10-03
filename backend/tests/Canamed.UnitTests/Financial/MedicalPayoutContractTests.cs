using Canamed.Domain.Financial;

namespace Canamed.UnitTests.Financial;

public sealed class MedicalPayoutContractTests
{
    private readonly DateTimeOffset _now = DateTimeOffset.UtcNow;
    private readonly Guid _clinicId = Guid.NewGuid();
    private readonly Guid _doctor = Guid.NewGuid();

    [Fact]
    public void CalculatePayout_Percentage_CalculatesCorrectSplit()
    {
        // 70% repasse para o médico
        var contract = MedicalPayoutContract.Create(_clinicId, _doctor, "percentage", 70.00m, _now);

        var (payout, retained) = contract.CalculatePayout(200.00m);

        Assert.Equal(140.00m, payout);
        Assert.Equal(60.00m, retained);
    }

    [Fact]
    public void CalculatePayout_Fixed_CalculatesFixedFee()
    {
        // R$ 80 fixo por consulta
        var contract = MedicalPayoutContract.Create(_clinicId, _doctor, "fixed", 80.00m, _now);

        var (payout, retained) = contract.CalculatePayout(150.00m);

        Assert.Equal(80.00m, payout);
        Assert.Equal(70.00m, retained);
    }

    [Fact]
    public void PayoutBatch_AddItemsAndSettle_UpdatesTotalsAndStatus()
    {
        var batch = MedicalPayoutBatch.Create(_clinicId, _doctor, _now.AddDays(-30), _now, _now);

        batch.AddItem(Guid.NewGuid(), "Paciente 1", _now.AddDays(-10), 100m, 30m, 70m, _now);
        batch.AddItem(Guid.NewGuid(), "Paciente 2", _now.AddDays(-5), 200m, 60m, 140m, _now);

        Assert.Equal(300m, batch.TotalGross);
        Assert.Equal(90m, batch.TotalClinicRetained);
        Assert.Equal(210m, batch.TotalPayoutAmount);
        Assert.Equal("aberto", batch.Status);

        batch.Settle("PIX-889123", "Pago via conta PJ", _now);

        Assert.Equal("liquidado", batch.Status);
        Assert.Equal("PIX-889123", batch.ReceiptReference);
        Assert.NotNull(batch.SettledAt);

        // Bloqueia adição de novos itens após liquidação
        Assert.Throws<InvalidOperationException>(() =>
            batch.AddItem(Guid.NewGuid(), "Paciente 3", _now, 100m, 30m, 70m, _now));
    }
}
