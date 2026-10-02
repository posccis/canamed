namespace Canamed.IntegrationTests;

/// <summary>
/// Relógio determinístico da suíte de integração: sempre o início do dia local da execução. Permite
/// testar check-in, tempos de espera e fechamento do dia sem depender da hora em que a suíte roda.
/// </summary>
internal sealed class TestClock(DateTimeOffset now) : TimeProvider
{
    /// <summary>Instância compartilhada pela suíte.</summary>
    public static TimeProvider Instance { get; } = new TestClock(CanamedApiFactory.FixedNow);

    public override DateTimeOffset GetUtcNow() => now;
}
