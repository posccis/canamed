using Canamed.Domain.MedicalRecords;
using Xunit;

namespace Canamed.UnitTests.MedicalRecords;

public sealed class ObstetricCalculatorTests
{
    [Fact]
    public void CalculateNaegeleEdd_DataValida_AplicaRegraCorreta()
    {
        // 01/05/2026: +7 dias = 08, -3 meses = fevereiro, +1 ano = 2027
        var dum = new DateOnly(2026, 5, 1);
        var edd = ObstetricCalculator.CalculateNaegeleEdd(dum);

        Assert.Equal(new DateOnly(2027, 2, 8), edd);
    }

    [Fact]
    public void CalculateNaegeleEdd_MesesDeJaneiroAMarco_MantemMesmoAno()
    {
        // 10/02/2026: +7 dias = 17, +9 meses = novembro do mesmo ano
        var dum = new DateOnly(2026, 2, 10);
        var edd = ObstetricCalculator.CalculateNaegeleEdd(dum);

        Assert.Equal(new DateOnly(2026, 11, 17), edd);
    }

    [Fact]
    public void CalculateGestationalAge_CalculaSemanasEDiasPrecisos()
    {
        var dum = new DateOnly(2026, 1, 1);
        var targetDate = new DateOnly(2026, 3, 1); // 59 dias = 8 semanas e 3 dias

        var (weeks, days) = ObstetricCalculator.CalculateGestationalAge(dum, targetDate);

        Assert.Equal(8, weeks);
        Assert.Equal(3, days);
    }

    [Fact]
    public void CalculateFromUltrasound_ComDataECcn_CalculaIgNaDataAlvo()
    {
        var usgDate = new DateOnly(2026, 3, 1);
        int usgWeeks = 8;
        int usgDays = 2;
        var targetDate = new DateOnly(2026, 3, 15); // +14 dias = 2 semanas exatas -> 10 semanas e 2 dias

        var (weeks, days) = ObstetricCalculator.CalculateFromUltrasound(usgDate, usgWeeks, usgDays, targetDate);

        Assert.Equal(10, weeks);
        Assert.Equal(2, days);
    }

    [Fact]
    public void Reconcile_QuandoDumIncerta_PriorizaUsg()
    {
        var targetDate = new DateOnly(2026, 5, 1);
        var usgDate = new DateOnly(2026, 4, 1);
        var result = ObstetricCalculator.Reconcile(
            dum: null,
            isDumUncertain: true,
            targetDate: targetDate,
            firstUsgDate: usgDate,
            firstUsgWeeks: 7,
            firstUsgDays: 0,
            firstUsgCcnMm: 10.5);

        Assert.Equal(GestationalAgeReference.FirstUltrasound, result.PreferredReference);
        Assert.True(result.IsDumUncertain);
        Assert.NotNull(result.EffectiveGestationalAge);
    }

    [Fact]
    public void Reconcile_PrimeiroTrimestreComDiscrepanciaMaiorQue5Dias_RecomendaUsg()
    {
        // Alvo: 2026-04-10
        // DUM dá 8 semanas e 0 dias (56 dias)
        var dum = new DateOnly(2026, 2, 13);
        // USG realizado no mesmo dia deu 7 semanas e 0 dias (CCN precoce até 8s 6d)
        // Discrepância = 7 dias (> 5 dias)
        var targetDate = new DateOnly(2026, 4, 10);
        var result = ObstetricCalculator.Reconcile(
            dum: dum,
            isDumUncertain: false,
            targetDate: targetDate,
            firstUsgDate: targetDate,
            firstUsgWeeks: 7,
            firstUsgDays: 0,
            firstUsgCcnMm: 9.8);

        Assert.Equal(GestationalAgeReference.FirstUltrasound, result.PreferredReference);
        Assert.True(result.DiscrepancyDays >= 6);
    }

    [Fact]
    public void Reconcile_Concordante_PriorizaDum()
    {
        var dum = new DateOnly(2026, 2, 13);
        var targetDate = new DateOnly(2026, 4, 10); // 8 semanas exatas pela DUM
        var result = ObstetricCalculator.Reconcile(
            dum: dum,
            isDumUncertain: false,
            targetDate: targetDate,
            firstUsgDate: targetDate,
            firstUsgWeeks: 8,
            firstUsgDays: 2, // 2 dias de diferença (<= 5 dias)
            firstUsgCcnMm: 16.0);

        Assert.Equal(GestationalAgeReference.Dum, result.PreferredReference);
    }
}
