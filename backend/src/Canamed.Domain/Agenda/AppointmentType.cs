using Canamed.Domain.Common;

namespace Canamed.Domain.Agenda;

/// <summary>
/// Tipo de consulta do catálogo da clínica, com natureza, custeio, especialidade e duração. A duração é
/// copiada para o agendamento no momento da criação (RN-002 da SPEC-0002), de modo que alterações
/// futuras no catálogo não afetem o histórico.
/// </summary>
public sealed class AppointmentType : Entity
{
    private AppointmentType()
    {
    }

    public Guid ClinicId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public int DurationMinutes { get; private set; }

    /// <summary>Natureza da consulta (avulsa ou acompanhamento).</summary>
    public AppointmentCategory Category { get; private set; }

    /// <summary>Forma de custeio (particular ou plano de saúde).</summary>
    public AppointmentCoverage Coverage { get; private set; }

    /// <summary>Especialidade associada, quando o tipo for específico de uma.</summary>
    public Guid? SpecialtyId { get; private set; }

    /// <summary>Tipo inativo não pode ser usado em novos agendamentos (RN-003).</summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>Cria um tipo de consulta com classificação e duração válidas.</summary>
    public static AppointmentType Create(
        Guid clinicId,
        string name,
        AppointmentCategory category,
        AppointmentCoverage coverage,
        int durationMinutes,
        DateTimeOffset now,
        Guid? specialtyId = null,
        Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var appointmentType = new AppointmentType
        {
            ClinicId = clinicId,
            Name = name.Trim(),
            Category = category,
            Coverage = coverage,
            DurationMinutes = ValidateDuration(durationMinutes),
            SpecialtyId = specialtyId,
            IsActive = true,
        };

        if (id is not null)
        {
            appointmentType.Id = id.Value;
        }

        appointmentType.MarkCreated(now);

        return appointmentType;
    }

    /// <summary>Altera nome, classificação, especialidade e duração do tipo de consulta.</summary>
    public void Update(
        string name,
        AppointmentCategory category,
        AppointmentCoverage coverage,
        int durationMinutes,
        Guid? specialtyId,
        DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Name = name.Trim();
        Category = category;
        Coverage = coverage;
        DurationMinutes = ValidateDuration(durationMinutes);
        SpecialtyId = specialtyId;
        MarkUpdated(now);
    }

    /// <summary>Desativa o tipo (RN-003).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa o tipo.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }

    private static int ValidateDuration(int durationMinutes)
    {
        if (durationMinutes <= 0 || durationMinutes > 24 * 60)
        {
            throw new ArgumentOutOfRangeException(
                nameof(durationMinutes),
                durationMinutes,
                "A duração deve estar entre 1 e 1440 minutos.");
        }

        return durationMinutes;
    }
}
