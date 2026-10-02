using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>
/// Feriado ou exceção de calendário em uma data específica (RN-006 e RN-008 da SPEC-0006).
/// </summary>
public sealed class ClinicClosure : Entity
{
    private ClinicClosure()
    {
    }

    public Guid ClinicId { get; private set; }

    public DateOnly Date { get; private set; }

    public string Description { get; private set; } = string.Empty;

    /// <summary>Cria um feriado/exceção.</summary>
    public static ClinicClosure Create(
        Guid clinicId,
        DateOnly date,
        string description,
        DateTimeOffset now,
        Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(description);

        var closure = new ClinicClosure
        {
            ClinicId = clinicId,
            Date = date,
            Description = description.Trim(),
        };

        if (id is not null)
        {
            closure.Id = id.Value;
        }

        closure.MarkCreated(now);

        return closure;
    }
}
