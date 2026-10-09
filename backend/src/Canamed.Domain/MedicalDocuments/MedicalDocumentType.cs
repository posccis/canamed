namespace Canamed.Domain.MedicalDocuments;

public static class MedicalDocumentType
{
    public const string ReceitaSimples = "receita_simples";
    public const string ReceitaControleEspecial = "receita_controle_especial";
    public const string AtestadoMedico = "atestado_medico";
    public const string SolicitacaoExames = "solicitacao_exames";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ReceitaSimples,
        ReceitaControleEspecial,
        AtestadoMedico,
        SolicitacaoExames
    };
}
