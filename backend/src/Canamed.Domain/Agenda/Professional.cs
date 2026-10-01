using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>Profissional de saúde vinculado a exatamente uma clínica (RN-004).</summary>
public sealed class Professional : Entity
{
    private Professional()
    {
    }

    public Guid ClinicId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    /// <summary>Especialidade do profissional, quando informada.</summary>
    public Guid? SpecialtyId { get; private set; }

    /// <summary>Profissional inativo não recebe novos agendamentos (RN-005).</summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>Cria um profissional da clínica informada.</summary>
    public static Professional Create(
        Guid clinicId,
        string name,
        DateTimeOffset now,
        Guid? id = null,
        Guid? specialtyId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var professional = new Professional
        {
            ClinicId = clinicId,
            Name = name.Trim(),
            SpecialtyId = specialtyId,
            IsActive = true,
        };

        if (id is not null)
        {
            professional.Id = id.Value;
        }

        professional.MarkCreated(now);

        return professional;
    }

    /// <summary>Altera nome e especialidade do profissional.</summary>
    public void Update(string name, Guid? specialtyId, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Name = name.Trim();
        SpecialtyId = specialtyId;
        MarkUpdated(now);
    }

    /// <summary>Desativa o profissional (RN-005).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa o profissional.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }
}
