using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>
/// Especialidade da clínica (ortopedia, ginecologia, pediatria…), usada por profissionais e por tipos
/// de consulta (RN-002 da SPEC-0004).
/// </summary>
public sealed class Specialty : Entity
{
    private Specialty()
    {
    }

    public Guid ClinicId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public bool IsActive { get; private set; } = true;

    /// <summary>Cria uma especialidade ativa.</summary>
    public static Specialty Create(Guid clinicId, string name, DateTimeOffset now, Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var specialty = new Specialty { ClinicId = clinicId, Name = name.Trim(), IsActive = true };

        if (id is not null)
        {
            specialty.Id = id.Value;
        }

        specialty.MarkCreated(now);

        return specialty;
    }

    /// <summary>Renomeia a especialidade.</summary>
    public void Rename(string name, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Name = name.Trim();
        MarkUpdated(now);
    }

    /// <summary>Desativa a especialidade (RN-004).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa a especialidade.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }
}
