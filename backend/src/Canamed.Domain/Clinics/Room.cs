using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>Sala da clínica usada na organização dos atendimentos (RN-002 da SPEC-0006).</summary>
public sealed class Room : Entity
{
    private Room()
    {
    }

    public Guid ClinicId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public bool IsActive { get; private set; } = true;

    /// <summary>Cria uma sala ativa.</summary>
    public static Room Create(Guid clinicId, string name, DateTimeOffset now, Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var room = new Room { ClinicId = clinicId, Name = name.Trim(), IsActive = true };

        if (id is not null)
        {
            room.Id = id.Value;
        }

        room.MarkCreated(now);

        return room;
    }

    /// <summary>Renomeia a sala.</summary>
    public void Rename(string name, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Name = name.Trim();
        MarkUpdated(now);
    }

    /// <summary>Desativa a sala (RN-004).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa a sala.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }
}
