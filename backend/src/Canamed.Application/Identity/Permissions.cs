namespace Canamed.Application.Identity;

/// <summary>
/// Permissões do domínio de agenda, conforme a seção 4 da SPEC-0002.
/// A verificação efetiva ocorre no backend, por recurso (ADR-0008).
/// </summary>
public static class Permissions
{
    /// <summary>Consulta a agenda de qualquer profissional da clínica.</summary>
    public const string AgendaRead = "agenda:read";

    /// <summary>Consulta a própria agenda.</summary>
    public const string AgendaReadOwn = "agenda:read:own";

    /// <summary>Cria, remarca e cancela agendamentos.</summary>
    public const string AgendaWrite = "agenda:write";

    /// <summary>Bloqueia intervalos na própria agenda.</summary>
    public const string AgendaBlock = "agenda:block";

    /// <summary>Configura o catálogo de tipos de atendimento.</summary>
    public const string AgendaConfigure = "agenda:configure";

    /// <summary>Administra os usuários da clínica (SPEC-0003).</summary>
    public const string UsersManage = "users:manage";

    /// <summary>Consulta convênios, salas, funcionamento e feriados (SPEC-0006).</summary>
    public const string ClinicRead = "clinic:read";

    /// <summary>Mantém convênios, salas, funcionamento e feriados (SPEC-0006).</summary>
    public const string ClinicManage = "clinic:manage";

    /// <summary>Consulta o painel gerencial e indicadores operacionais (SPEC-0007).</summary>
    public const string DashboardRead = "dashboard:read";

    /// <summary>Consulta pagamentos e fechamento de caixa (SPEC-0008).</summary>
    public const string PaymentsRead = "payments:read";

    /// <summary>Registra recebimentos e emite recibos no balcão (SPEC-0008).</summary>
    public const string PaymentsWrite = "payments:write";

    /// <summary>Estorna transações de pagamento (SPEC-0008).</summary>
    public const string PaymentsRefund = "payments:refund";

    /// <summary>Consulta dados e histórico de triagem (SPEC-0009).</summary>
    public const string TriageRead = "triage:read";

    /// <summary>Registra sinais vitais e classificação de risco na triagem (SPEC-0009).</summary>
    public const string TriageWrite = "triage:write";

    /// <summary>Consulta registros clínicos e histórico de prontuário (SPEC-0010).</summary>
    public const string RecordsRead = "records:read";

    /// <summary>Inicia rascunho de prontuário clínico (SPEC-0010).</summary>
    public const string RecordsCreate = "records:create";

    /// <summary>Atualiza rascunho de prontuário clínico em andamento (SPEC-0010).</summary>
    public const string RecordsUpdate = "records:update";

    /// <summary>Finaliza formalmente prontuário clínico (SPEC-0010).</summary>
    public const string RecordsFinalize = "records:finalize";

    /// <summary>Adiciona adendo justificativo a prontuário finalizado (SPEC-0010).</summary>
    public const string RecordsAddendum = "records:addendum";

    /// <summary>Consulta documentos médicos assinados e emitidos (SPEC-0011).</summary>
    public const string DocumentsRead = "documents:read";

    /// <summary>Cria rascunho de prescrições, atestados e exames (SPEC-0011).</summary>
    public const string DocumentsCreate = "documents:create";

    /// <summary>Assina digitalmente documento médico (SPEC-0011).</summary>
    public const string DocumentsSign = "documents:sign";

    /// <summary>Revoga/cancela formalmente documento médico com justificativa (SPEC-0011).</summary>
    public const string DocumentsCancel = "documents:cancel";

    /// <summary>Imprime documentos clínicos assinados no balcão (SPEC-0011).</summary>
    public const string DocumentsPrint = "documents:print";

    /// <summary>Acessa o consultório virtual e opera a fila do profissional (SPEC-0012).</summary>
    public const string WorkspaceAccess = "workspace:access";

    /// <summary>Configura mensageria, lembretes ativos e templates (SPEC-0014).</summary>
    public const string NotificationsManage = "notifications:manage";

    /// <summary>Gerencia requisições de titulares de dados e governança LGPD (SPEC-0018).</summary>
    public const string PrivacyManage = "privacy:manage";

    /// <summary>Abre, movimenta e fecha sessão de caixa de balcão (SPEC-0019).</summary>
    public const string CashierManage = "cashier:manage";

    /// <summary>Visualiza fechamentos e espelhos de caixa de todos os operadores (SPEC-0019).</summary>
    public const string CashierViewAll = "cashier:view-all";

    /// <summary>Acesso e gestão financeira global da clínica e DRE (SPEC-0021).</summary>
    public const string FinancialAdmin = "financial:admin";

    /// <summary>Gera lotes e liquida repasses médicos aos profissionais (SPEC-0021).</summary>
    public const string PayoutManage = "payout:manage";

    /// <summary>Visualiza o próprio extrato de repasse médico (SPEC-0021).</summary>
    public const string PayoutViewOwn = "payout:view-own";

    /// <summary>Consulta saldo de insumos e materiais de estoque (SPEC-0022).</summary>
    public const string InventoryRead = "inventory:read";

    /// <summary>Gerencia insumos, compras de entrada e baixas de estoque (SPEC-0022).</summary>
    public const string InventoryManage = "inventory:manage";

    /// <summary>Mesa de trabalho do DPO e Registro de Operações ROPA (SPEC-0023).</summary>
    public const string DpoManage = "dpo:manage";

    /// <summary>Configura políticas de encaixe (overbooking) e cancelamento (SPEC-0025).</summary>
    public const string PolicyManage = "policy:manage";

    /// <summary>Todas as permissões conhecidas, na ordem de declaração.</summary>
    public static IReadOnlyList<string> All { get; } =
    [
        AgendaRead,
        AgendaReadOwn,
        AgendaWrite,
        AgendaBlock,
        AgendaConfigure,
        UsersManage,
        ClinicRead,
        ClinicManage,
        DashboardRead,
        PaymentsRead,
        PaymentsWrite,
        PaymentsRefund,
        TriageRead,
        TriageWrite,
        RecordsRead,
        RecordsCreate,
        RecordsUpdate,
        RecordsFinalize,
        RecordsAddendum,
        DocumentsRead,
        DocumentsCreate,
        DocumentsSign,
        DocumentsCancel,
        DocumentsPrint,
        WorkspaceAccess,
        NotificationsManage,
        PrivacyManage,
        CashierManage,
        CashierViewAll,
        FinancialAdmin,
        PayoutManage,
        PayoutViewOwn,
        InventoryRead,
        InventoryManage,
        DpoManage,
        PolicyManage,
    ];
}
