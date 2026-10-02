using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>
/// Intervalo de funcionamento da clínica em um dia da semana (RN-005 da SPEC-0006). A clínica pode ter
/// mais de um intervalo no mesmo dia (ex.: manhã e tarde).
/// </summary>
public sealed class OperatingHour : Entity
{
    private OperatingHour()
    {
    }

    public Guid ClinicId { get; private set; }

    /// <summary>Dia da semana no padrão de <see cref="DayOfWeek"/> (0 = domingo … 6 = sábado).</summary>
    public int DayOfWeek { get; private set; }

    public TimeOnly StartsAt { get; private set; }

    public TimeOnly EndsAt { get; private set; }

    /// <summary>Cria um intervalo de funcionamento válido.</summary>
    public static OperatingHour Create(
        Guid clinicId,
        DayOfWeek dayOfWeek,
        TimeOnly startsAt,
        TimeOnly endsAt,
        DateTimeOffset now,
        Guid? id = null)
    {
        if (endsAt <= startsAt)
        {
            throw new ArgumentException("O fim do funcionamento deve ser posterior ao início.", nameof(endsAt));
        }

        var operatingHour = new OperatingHour
        {
            ClinicId = clinicId,
            DayOfWeek = (int)dayOfWeek,
            StartsAt = startsAt,
            EndsAt = endsAt,
        };

        if (id is not null)
        {
            operatingHour.Id = id.Value;
        }

        operatingHour.MarkCreated(now);

        return operatingHour;
    }

    /// <summary>Dia da semana tipado.</summary>
    public DayOfWeek Day => (DayOfWeek)DayOfWeek;
}
