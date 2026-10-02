using Canamed.Domain.Agenda;

namespace Canamed.UnitTests.Queue;

/// <summary>
/// Regras da fila de espera testadas sem banco: ordenação por prioridade, transições, idempotência e
/// cálculo de tempos (SPEC-0005, seção 16).
/// </summary>
public sealed class QueueEntryTests
{
    private static readonly Guid ClinicId = Guid.NewGuid();
    private static readonly Guid ProfessionalId = Guid.NewGuid();
    private static readonly DateOnly Today = new(2026, 10, 1);
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CheckIn_DeveCriarEntradaAguardando()
    {
        var entry = CheckIn(Now, QueuePriority.Normal);

        Assert.Equal(QueueStatus.Waiting, entry.Status);
        Assert.True(entry.IsOpen);
        Assert.Null(entry.CalledAt);
        Assert.Null(entry.FinishedAt);
    }

    [Fact]
    public void CheckIn_DeveExigirIdentificadores()
    {
        Assert.Throws<ArgumentException>(() => QueueEntry.CheckIn(
            Guid.Empty,
            ProfessionalId,
            Guid.NewGuid(),
            null,
            Today,
            QueuePriority.Normal,
            Now));
    }

    [Fact]
    public void Sort_DeveColocarPreferencialAntesDeQuemChegouPrimeiro()
    {
        var first = CheckIn(Now, QueuePriority.Normal, "primeiro");
        var second = CheckIn(Now.AddMinutes(5), QueuePriority.Preferential, "preferencial");
        var third = CheckIn(Now.AddMinutes(10), QueuePriority.Normal, "terceiro");

        var ordered = QueueOrdering.Sort([third, second, first]);

        Assert.Equal([second.Id, first.Id, third.Id], ordered.Select(entry => entry.Id));
        Assert.Equal(1, QueueOrdering.PositionOf(ordered, second));
        Assert.Equal(2, QueueOrdering.PositionOf(ordered, first));
        Assert.Equal(3, QueueOrdering.PositionOf(ordered, third));
    }

    [Fact]
    public void PositionOf_DeveSerNula_QuandoNaoEstaAguardando()
    {
        var entry = CheckIn(Now, QueuePriority.Normal);
        entry.Call(Now);

        var ordered = QueueOrdering.Sort([entry]);

        Assert.Null(QueueOrdering.PositionOf(ordered, entry));
    }

    [Fact]
    public void CicloCompleto_DeveRegistrarOsMarcosDeTempo()
    {
        var entry = CheckIn(Now, QueuePriority.Normal);

        entry.Call(Now.AddMinutes(10));
        entry.Start(Now.AddMinutes(12));
        entry.Complete(Now.AddMinutes(40));

        Assert.Equal(QueueStatus.Completed, entry.Status);
        Assert.Equal(Now.AddMinutes(10), entry.CalledAt);
        Assert.Equal(Now.AddMinutes(12), entry.StartedAt);
        Assert.Equal(Now.AddMinutes(40), entry.FinishedAt);
        Assert.Equal(TimeSpan.FromMinutes(10), entry.WaitingTime(Now.AddMinutes(40)));
        Assert.Equal(TimeSpan.FromMinutes(28), entry.ServiceTime);
        Assert.False(entry.IsOpen);
    }

    [Fact]
    public void Complete_DeveRecusarQuandoNaoIniciou()
    {
        var entry = CheckIn(Now, QueuePriority.Normal);
        entry.Call(Now);

        // RN-005: só é possível concluir o que está em atendimento.
        Assert.Throws<QueueTransitionException>(() => entry.Complete(Now));
    }

    [Fact]
    public void Leave_DeveSerAceitoEmEsperaOuChamado()
    {
        var waiting = CheckIn(Now, QueuePriority.Normal);
        waiting.Leave(Now);

        Assert.Equal(QueueStatus.Left, waiting.Status);

        var called = CheckIn(Now, QueuePriority.Normal);
        called.Call(Now);
        called.Leave(Now);

        Assert.Equal(QueueStatus.Left, called.Status);
    }

    [Fact]
    public void Transicoes_DevemSerIdempotentes()
    {
        var entry = CheckIn(Now, QueuePriority.Normal);

        entry.Call(Now);
        entry.Call(Now.AddMinutes(1));
        entry.Start(Now.AddMinutes(2));
        entry.Start(Now.AddMinutes(3));
        entry.Complete(Now.AddMinutes(4));
        entry.Complete(Now.AddMinutes(5));

        // RN-008: repetir não altera o primeiro marco registrado.
        Assert.Equal(Now, entry.CalledAt);
        Assert.Equal(Now.AddMinutes(2), entry.StartedAt);
        Assert.Equal(Now.AddMinutes(4), entry.FinishedAt);
    }

    [Fact]
    public void CompleteFromAgenda_DeveFuncionarDeQualquerEstadoAberto()
    {
        var waiting = CheckIn(Now, QueuePriority.Normal);
        waiting.CompleteFromAgenda(Now.AddMinutes(7));

        Assert.Equal(QueueStatus.Completed, waiting.Status);
        Assert.Equal(Now.AddMinutes(7), waiting.FinishedAt);

        var inService = CheckIn(Now, QueuePriority.Normal);
        inService.Call(Now);
        inService.Start(Now);
        inService.CompleteFromAgenda(Now.AddMinutes(30));

        Assert.Equal(QueueStatus.Completed, inService.Status);
    }

    [Theory]
    [InlineData("normal", QueuePriority.Normal)]
    [InlineData("preferencial", QueuePriority.Preferential)]
    public void PriorityFromStoredValue_DeveConverterValoresValidos(string value, QueuePriority expected)
    {
        Assert.Equal(expected, QueueMap.PriorityFromStoredValue(value));
        Assert.Equal(value, expected.ToStoredValue());
    }

    [Theory]
    [InlineData("urgente")]
    [InlineData("")]
    [InlineData(null)]
    public void PriorityFromStoredValue_DeveRecusarValorDesconhecido(string? value)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => QueueMap.PriorityFromStoredValue(value));
    }

    [Fact]
    public void StatusValues_DevemCobrirOCicloDeVida()
    {
        Assert.Contains("aguardando", QueueMap.StatusValues);
        Assert.Contains("em_atendimento", QueueMap.StatusValues);
        Assert.Contains("desistiu", QueueMap.StatusValues);
        Assert.Equal(3, QueueMap.OpenStatusValues.Count);
    }

    private static QueueEntry CheckIn(
        DateTimeOffset moment,
        QueuePriority priority,
        string? seed = null)
    {
        _ = seed;

        return QueueEntry.CheckIn(
            ClinicId,
            ProfessionalId,
            Guid.NewGuid(),
            null,
            Today,
            priority,
            moment);
    }
}
