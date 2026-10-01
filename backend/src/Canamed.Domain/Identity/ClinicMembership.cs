using Canamed.Domain.Common;

namespace Canamed.Domain.Identity;

/// <summary>
/// Vínculo entre um usuário e uma clínica, com o papel que define as permissões (ADR-0008).
/// Um usuário pode ter vínculos em várias clínicas; a clínica ativa fica na sessão.
/// </summary>
public sealed class ClinicMembership : Entity
{
    private ClinicMembership()
    {
    }

    public Guid UserId { get; private set; }

    public Guid ClinicId { get; private set; }

    /// <summary>Papel do usuário nesta clínica (ver <c>Roles</c> na camada de aplicação).</summary>
    public string Role { get; private set; } = string.Empty;

    /// <summary>Profissional da agenda vinculado ao usuário, quando o papel for de profissional.</summary>
    public Guid? ProfessionalId { get; private set; }

    /// <summary>Cria um vínculo.</summary>
    public static ClinicMembership Create(
        Guid userId,
        Guid clinicId,
        string role,
        Guid? professionalId,
        DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        var membership = new ClinicMembership
        {
            UserId = userId,
            ClinicId = clinicId,
            Role = role.Trim(),
            ProfessionalId = professionalId,
        };

        membership.MarkCreated(now);

        return membership;
    }

    /// <summary>Altera o papel e o vínculo com a agenda.</summary>
    public void Update(string role, Guid? professionalId, DateTimeOffset now)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(role);

        Role = role.Trim();
        ProfessionalId = professionalId;
        MarkUpdated(now);
    }
}
