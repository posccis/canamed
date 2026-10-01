namespace Canamed.Domain.Agenda;

/// <summary>
/// Intervalo de tempo fechado no início e aberto no fim (<c>[start, end)</c>), em UTC.
/// Regra RN-010 da SPEC-0002: tudo é armazenado em UTC e convertido apenas na exibição.
/// </summary>
public readonly record struct TimeRange
{
    public TimeRange(DateTimeOffset startsAt, DateTimeOffset endsAt)
    {
        if (endsAt <= startsAt)
        {
            throw new ArgumentException("O fim do intervalo deve ser posterior ao início.", nameof(endsAt));
        }

        StartsAt = startsAt;
        EndsAt = endsAt;
    }

    public DateTimeOffset StartsAt { get; }

    public DateTimeOffset EndsAt { get; }

    public TimeSpan Duration => EndsAt - StartsAt;

    /// <summary>Cria o intervalo a partir do início e da duração em minutos.</summary>
    public static TimeRange FromStartAndMinutes(DateTimeOffset startsAt, int durationMinutes)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(durationMinutes);

        return new TimeRange(startsAt, startsAt.AddMinutes(durationMinutes));
    }

    /// <summary>
    /// Indica sobreposição real de horários. Intervalos que apenas se tocam não conflitam
    /// (um agendamento das 14h00 às 14h30 não conflita com outro às 14h30).
    /// </summary>
    public bool Overlaps(TimeRange other) => StartsAt < other.EndsAt && other.StartsAt < EndsAt;
}
