namespace Canamed.Domain.Agenda;

/// <summary>
/// Regras de agenda isoladas do banco de dados (requisito não funcional da SPEC-0002),
/// reutilizadas pela API e cobertas por testes unitários.
/// </summary>
public static class AgendaRules
{
    /// <summary>RN-003: não é permitido agendar em horário passado.</summary>
    public static void EnsureNotInThePast(TimeRange candidate, DateTimeOffset now)
    {
        if (candidate.StartsAt < now)
        {
            throw new PastSchedulingException("Não é possível agendar em data passada.");
        }
    }

    /// <summary>RN-001: dois agendamentos ativos do mesmo profissional não podem se sobrepor.</summary>
    public static void EnsureNoOverlap(TimeRange candidate, IEnumerable<TimeRange> occupied)
    {
        ArgumentNullException.ThrowIfNull(occupied);

        if (occupied.Any(candidate.Overlaps))
        {
            throw new AppointmentConflictException(
                "Este horário já está ocupado para o profissional selecionado.");
        }
    }

    /// <summary>RN-011: bloqueio de agenda impede novos agendamentos no intervalo.</summary>
    public static void EnsureNotBlocked(TimeRange candidate, IEnumerable<TimeRange> blocks)
    {
        ArgumentNullException.ThrowIfNull(blocks);

        if (blocks.Any(candidate.Overlaps))
        {
            throw new ScheduleBlockedException("O profissional está indisponível neste horário.");
        }
    }

    /// <summary>
    /// Calcula os próximos horários livres a partir da duração solicitada, considerando agendamentos
    /// ativos e bloqueios. Usado para orientar a recepção quando há conflito (seção 8 da SPEC-0002).
    /// </summary>
    public static IReadOnlyList<DateTimeOffset> SuggestFreeSlots(
        DateTimeOffset desiredStart,
        int durationMinutes,
        IEnumerable<TimeRange> occupied,
        int maxSuggestions = 3,
        int stepMinutes = 15)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maxSuggestions);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(stepMinutes);

        var busy = occupied.ToArray();
        var suggestions = new List<DateTimeOffset>(maxSuggestions);
        var candidateStart = desiredStart;

        // Busca até 48 horas à frente, o suficiente para o mesmo dia ou o próximo dia útil.
        var limit = desiredStart.AddHours(48);

        while (suggestions.Count < maxSuggestions && candidateStart < limit)
        {
            candidateStart = candidateStart.AddMinutes(stepMinutes);
            var candidate = TimeRange.FromStartAndMinutes(candidateStart, durationMinutes);

            if (!busy.Any(candidate.Overlaps))
            {
                suggestions.Add(candidate.StartsAt);
            }
        }

        return suggestions;
    }
}
