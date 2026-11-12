namespace Canamed.Application.Identity;

/// <summary>
/// Papéis do sistema e o mapa de permissões correspondente.
/// O papel é atribuído por clínica, no vínculo do usuário (ADR-0008).
/// </summary>
public static class Roles
{
    /// <summary>Administrador Geral com controle total da clínica e PEP (gestão + clínico + operacional).</summary>
    public const string Admin = "admin";

    /// <summary>Gestor da clínica: administra usuários e configurações da agenda. Exige MFA.</summary>
    public const string Manager = "gestor";

    /// <summary>Recepção: opera a agenda da clínica.</summary>
    public const string Receptionist = "recepcionista";

    /// <summary>Profissional de saúde: consulta a própria agenda e bloqueia horários.</summary>
    public const string Professional = "profissional";

    /// <summary>Papéis válidos.</summary>
    /// <summary>Permissões clínicas assistenciais reservadas exclusivamente a médicos com CRM ativo (RN-006 / CFM 1.821).</summary>
    public static readonly IReadOnlySet<string> ClinicalPermissions = new HashSet<string>(StringComparer.Ordinal)
    {
        Permissions.RecordsRead,
        Permissions.RecordsCreate,
        Permissions.RecordsUpdate,
        Permissions.RecordsFinalize,
        Permissions.RecordsAddendum,
        Permissions.DocumentsSign,
        Permissions.WorkspaceAccess,
    };

    public static IReadOnlyList<string> All { get; } = [Admin, Manager, Receptionist, Professional];

    /// <summary>Indica se o papel é conhecido.</summary>
    public static bool Exists(string? role) =>
        role is not null && All.Contains(role, StringComparer.Ordinal);

    /// <summary>Permissões concedidas pelo papel.</summary>
    public static IReadOnlySet<string> PermissionsFor(string? role) =>
        role switch
        {
            Admin => new HashSet<string>(Permissions.All, StringComparer.Ordinal),
            Manager => new HashSet<string>(StringComparer.Ordinal)
            {
                Permissions.AgendaRead,
                Permissions.AgendaWrite,
                Permissions.AgendaBlock,
                Permissions.AgendaConfigure,
                Permissions.UsersManage,
                Permissions.ClinicRead,
                Permissions.ClinicManage,
                Permissions.DashboardRead,
                Permissions.PaymentsRead,
                Permissions.PaymentsWrite,
                Permissions.PaymentsRefund,
                Permissions.TriageRead,
                Permissions.TriageWrite,
                Permissions.AgendaOverbooking,
                Permissions.CashierOperate,
                Permissions.PrivacyExport,
                Permissions.PrivacyAnonymize,
                Permissions.NotificationsManage,
                Permissions.PrivacyManage,
                Permissions.CashierManage,
                Permissions.CashierViewAll,
                Permissions.FinancialAdmin,
                Permissions.PayoutManage,
                Permissions.InventoryRead,
                Permissions.InventoryManage,
                Permissions.DpoManage,
                Permissions.PolicyManage,
            },
            Receptionist => new HashSet<string>(StringComparer.Ordinal)
            {
                Permissions.AgendaRead,
                Permissions.AgendaWrite,
                Permissions.ClinicRead,
                Permissions.DashboardRead,
                Permissions.PaymentsRead,
                Permissions.PaymentsWrite,
                Permissions.TriageRead,
                Permissions.TriageWrite,
                Permissions.AgendaOverbooking,
                Permissions.CashierOperate,
                Permissions.PrivacyExport,
                Permissions.DocumentsPrint,
                Permissions.CashierManage,
                Permissions.InventoryRead,
                Permissions.InventoryManage,
            },
            Professional => new HashSet<string>(StringComparer.Ordinal)
            {
                Permissions.AgendaReadOwn,
                Permissions.AgendaBlock,
                Permissions.ClinicRead,
                Permissions.DashboardRead,
                Permissions.PaymentsRead,
                Permissions.TriageRead,
                Permissions.TriageWrite,
                Permissions.RecordsRead,
                Permissions.RecordsCreate,
                Permissions.RecordsUpdate,
                Permissions.RecordsFinalize,
                Permissions.RecordsAddendum,
                Permissions.DocumentsRead,
                Permissions.DocumentsCreate,
                Permissions.DocumentsSign,
                Permissions.DocumentsCancel,
                Permissions.DocumentsPrint,
                Permissions.WorkspaceAccess,
                Permissions.PayoutViewOwn,
                Permissions.InventoryRead,
            },
            _ => new HashSet<string>(StringComparer.Ordinal),
        };

    /// <summary>Indica se o papel exige segundo fator (RN-010).</summary>
    public static bool RequiresMfa(string? role) => role == Manager;
}

