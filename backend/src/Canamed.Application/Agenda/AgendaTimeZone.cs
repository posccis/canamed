namespace Canamed.Application.Agenda;

/// <summary>
/// Conversão entre o dia local da clínica e UTC (RN-010 da SPEC-0002).
/// O fuso oficial do produto é <c>America/Fortaleza</c>.
/// </summary>
public static class AgendaTimeZone
{
    /// <summary>Fuso horário oficial de exibição da agenda.</summary>
    public const string TimeZoneId = "America/Fortaleza";

    /// <summary>Fuso horário resolvido a partir do sistema operacional (suporta IANA no Windows e no Linux).</summary>
    public static TimeZoneInfo TimeZone { get; } = TimeZoneInfo.FindSystemTimeZoneById(TimeZoneId);

    /// <summary>Converte um dia local (America/Fortaleza) no intervalo UTC correspondente, fechado no início.</summary>
    public static (DateTimeOffset StartUtc, DateTimeOffset EndUtc) LocalDayToUtcRange(DateOnly date)
    {
        var startLocal = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var endLocal = startLocal.AddDays(1);

        return (
            new DateTimeOffset(startLocal, TimeZone.GetUtcOffset(startLocal)).ToUniversalTime(),
            new DateTimeOffset(endLocal, TimeZone.GetUtcOffset(endLocal)).ToUniversalTime());
    }

    /// <summary>Converte um instante local (sem fuso) do dia da clínica para o instante correspondente em UTC.</summary>
    public static DateTimeOffset LocalToUtc(DateTime localDateTime) =>
        new DateTimeOffset(
            DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified),
            TimeZone.GetUtcOffset(DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified)))
            .ToUniversalTime();

    /// <summary>Converte um instante UTC para o horário local da clínica.</summary>
    public static DateTimeOffset ToLocal(DateTimeOffset utc) =>
        TimeZoneInfo.ConvertTime(utc, TimeZone);
}
