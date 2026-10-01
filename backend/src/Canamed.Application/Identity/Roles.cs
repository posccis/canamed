namespace Canamed.Application.Identity;

/// <summary>
/// Papéis da primeira versão (SPEC-0003, seção 4) e o mapa de permissões correspondente.
/// O papel é atribuído por clínica, no vínculo do usuário (ADR-0008).
/// </summary>
public static class Roles
{
    /// <summary>Gestor da clínica: administra usuários e configurações da agenda. Exige MFA.</summary>
    public const string Manager = "gestor";

    /// <summary>Recepção: opera a agenda da clínica.</summary>
    public const string Receptionist = "recepcionista";

    /// <summary>Profissional de saúde: consulta a própria agenda e bloqueia horários.</summary>
    public const string Professional = "profissional";

    /// <summary>Papéis válidos.</summary>
    public static IReadOnlyList<string> All { get; } = [Manager, Receptionist, Professional];

    /// <summary>Indica se o papel é conhecido.</summary>
    public static bool Exists(string? role) =>
        role is not null && All.Contains(role, StringComparer.Ordinal);

    /// <summary>Permissões concedidas pelo papel.</summary>
    public static IReadOnlySet<string> PermissionsFor(string? role) =>
        role switch
        {
            Manager => new HashSet<string>(StringComparer.Ordinal)
            {
                Permissions.AgendaRead,
                Permissions.AgendaWrite,
                Permissions.AgendaBlock,
                Permissions.AgendaConfigure,
                Permissions.UsersManage,
            },
            Receptionist => new HashSet<string>(StringComparer.Ordinal)
            {
                Permissions.AgendaRead,
                Permissions.AgendaWrite,
            },
            Professional => new HashSet<string>(StringComparer.Ordinal)
            {
                Permissions.AgendaReadOwn,
                Permissions.AgendaBlock,
            },
            _ => new HashSet<string>(StringComparer.Ordinal),
        };

    /// <summary>Indica se o papel exige segundo fator (RN-010).</summary>
    public static bool RequiresMfa(string? role) => role == Manager;
}
