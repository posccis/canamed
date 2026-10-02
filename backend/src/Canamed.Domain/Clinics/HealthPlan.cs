using Canamed.Domain.Common;

namespace Canamed.Domain.Clinics;

/// <summary>
/// Convênio da clínica (RN-001 da SPEC-0006). O custeio <c>plano_saude</c> do tipo de consulta
/// (SPEC-0004) passa a ter um convênio concreto para conferência administrativa.
/// </summary>
public sealed class HealthPlan : Entity
{
    private HealthPlan()
    {
    }

    public Guid ClinicId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    /// <summary>Código ANS do convênio, opcional.</summary>
    public string? AnsCode { get; private set; }

    public bool IsActive { get; private set; } = true;

    /// <summary>Cria um convênio ativo.</summary>
    public static HealthPlan Create(
        Guid clinicId,
        string name,
        string? ansCode,
        DateTimeOffset now,
        Guid? id = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        var healthPlan = new HealthPlan
        {
            ClinicId = clinicId,
            Name = name.Trim(),
            AnsCode = NormalizeOptional(ansCode),
            IsActive = true,
        };

        if (id is not null)
        {
            healthPlan.Id = id.Value;
        }

        healthPlan.MarkCreated(now);

        return healthPlan;
    }

    /// <summary>Renomeia o convênio e atualiza o código ANS.</summary>
    public void Update(string name, string? ansCode, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Name = name.Trim();
        AnsCode = NormalizeOptional(ansCode);
        MarkUpdated(now);
    }

    /// <summary>Desativa o convênio (RN-003).</summary>
    public void Deactivate(DateTimeOffset now)
    {
        IsActive = false;
        MarkUpdated(now);
    }

    /// <summary>Reativa o convênio.</summary>
    public void Activate(DateTimeOffset now)
    {
        IsActive = true;
        MarkUpdated(now);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
