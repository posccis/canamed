using Canamed.Domain.Agenda;

namespace Canamed.UnitTests.Agenda;

/// <summary>Regras de conflito e de bloqueio isoladas do banco (SPEC-0002, seção 15).</summary>
public sealed class AgendaRulesTests
{
    private static readonly DateTimeOffset Base = new(2026, 10, 1, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Overlaps_DeveSerFalso_QuandoUmaFaixaComecaOndeOutraTermina()
    {
        var first = new TimeRange(Base, Base.AddMinutes(30));
        var second = new TimeRange(Base.AddMinutes(30), Base.AddMinutes(60));

        Assert.False(first.Overlaps(second));
        Assert.False(second.Overlaps(first));
    }

    [Theory]
    [InlineData(15, 45)]
    [InlineData(0, 30)]
    [InlineData(-15, 15)]
    public void Overlaps_DeveSerVerdadeiro_QuandoHaInterseccao(int startOffsetMinutes, int endOffsetMinutes)
    {
        var occupied = new TimeRange(Base, Base.AddMinutes(30));
        var candidate = new TimeRange(
            Base.AddMinutes(startOffsetMinutes),
            Base.AddMinutes(endOffsetMinutes));

        Assert.True(candidate.Overlaps(occupied));
    }

    [Fact]
    public void EnsureNoOverlap_DeveLancarConflito_QuandoHaSobreposicao()
    {
        var occupied = new[] { new TimeRange(Base, Base.AddMinutes(30)) };
        var candidate = new TimeRange(Base.AddMinutes(15), Base.AddMinutes(45));

        Assert.Throws<AppointmentConflictException>(() => AgendaRules.EnsureNoOverlap(candidate, occupied));
    }

    [Fact]
    public void EnsureNotBlocked_DeveLancarBloqueio_QuandoIntervaloEstaBloqueado()
    {
        var blocks = new[] { new TimeRange(Base, Base.AddHours(1)) };
        var candidate = new TimeRange(Base.AddMinutes(15), Base.AddMinutes(45));

        Assert.Throws<ScheduleBlockedException>(() => AgendaRules.EnsureNotBlocked(candidate, blocks));
    }

    [Fact]
    public void EnsureNotInThePast_DeveLancar_QuandoInicioAnteriorAAgora()
    {
        var candidate = new TimeRange(Base.AddMinutes(-1), Base.AddMinutes(29));

        Assert.Throws<PastSchedulingException>(() => AgendaRules.EnsureNotInThePast(candidate, Base));
    }

    [Fact]
    public void SuggestFreeSlots_DevePularHorariosOcupados()
    {
        var occupied = new[]
        {
            new TimeRange(Base.AddMinutes(15), Base.AddMinutes(45)),
            new TimeRange(Base.AddHours(1), Base.AddHours(2)),
        };

        var suggestions = AgendaRules.SuggestFreeSlots(Base, 30, occupied, maxSuggestions: 3, stepMinutes: 15);

        Assert.Equal(3, suggestions.Count);
        Assert.All(suggestions, slot => Assert.DoesNotContain(
            occupied,
            range => range.Overlaps(TimeRange.FromStartAndMinutes(slot, 30))));
        Assert.Equal(Base.AddMinutes(120), suggestions[0]);
        Assert.Equal(Base.AddMinutes(135), suggestions[1]);
    }

    [Fact]
    public void TimeRange_DeveRecusarFimAnteriorAoInicio()
    {
        Assert.Throws<ArgumentException>(() => new TimeRange(Base, Base.AddMinutes(-30)));
    }

    [Fact]
    public void TimeRangeFromStartAndMinutes_DeveRecusarDuracaoNaoPositiva()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => TimeRange.FromStartAndMinutes(Base, 0));
    }
}
