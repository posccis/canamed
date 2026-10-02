namespace Canamed.Domain.Clinics;

/// <summary>
/// Regras de funcionamento da clínica isoladas do banco (SPEC-0006), testáveis sem persistência.
/// </summary>
public static class ClinicOperatingRules
{
    /// <summary>RN-005: intervalos do mesmo dia da semana não podem se sobrepor.</summary>
    public static void EnsureNoOverlap(IEnumerable<OperatingHour> hours)
    {
        ArgumentNullException.ThrowIfNull(hours);

        foreach (var day in hours.GroupBy(hour => hour.DayOfWeek))
        {
            var ordered = day.OrderBy(hour => hour.StartsAt).ToArray();

            for (var index = 1; index < ordered.Length; index++)
            {
                if (ordered[index].StartsAt < ordered[index - 1].EndsAt)
                {
                    throw new OperatingHoursOverlapException(
                        "Os intervalos de funcionamento do mesmo dia não podem se sobrepor.");
                }
            }
        }
    }

    /// <summary>
    /// RN-007: indica se o intervalo informado está contido em algum intervalo de funcionamento do dia.
    /// Quando não há intervalos cadastrados, considera-se sem restrição (RN-009).
    /// </summary>
    public static bool IsWithinOperatingHours(
        TimeOnly startsAt,
        TimeOnly endsAt,
        IReadOnlyCollection<OperatingHour> hoursOfDay) =>
        hoursOfDay.Count is 0 || hoursOfDay.Any(hour => hour.StartsAt <= startsAt && endsAt <= hour.EndsAt);
}

/// <summary>Erro de domínio para funcionamento inválido (RN-005).</summary>
public sealed class OperatingHoursOverlapException(string message) : Exception(message);
