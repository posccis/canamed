namespace Canamed.Domain.MedicalRecords;

/// <summary>
/// Motor de diretrizes oficiais do INCA / Ministério da Saúde para rastreamento de câncer do colo do útero
/// com Nomenclatura Bethesda e testes moleculares de DNA-HPV oncogênico.
/// </summary>
public static class CervicalScreeningGuidelineEngine
{
    public static string DetermineConduct(string bethesdaCode, int patientAge, bool isHpvPositive)
    {
        var code = bethesdaCode?.Trim().ToUpperInvariant() ?? string.Empty;

        if (code == "NILM")
        {
            return "Repetir exame citopatológico em 3 anos se tiver dois anuais prévios negativos. Seguir rastreamento trienal conforme diretrizes do Ministério da Saúde.";
        }

        if (code == "ASC-US")
        {
            if (isHpvPositive)
            {
                return "Encaminhar imediatamente para Colposcopia (HPV de alto risco 16/18 positivo).";
            }

            if (patientAge < 25)
            {
                return "Repetir exame citopatológico em 12 meses (paciente jovem < 25 anos). Conduta conservadora devido à alta taxa de regressão espontânea de infecções transitórias.";
            }

            return "Repetir exame citopatológico em 6 meses. Caso se mantenha ASC-US ou evolua, encaminhar para colposcopia.";
        }

        if (code == "LSIL")
        {
            if (patientAge < 25)
            {
                return "Repetir exame citopatológico em 12 meses (paciente jovem < 25 anos). Lesão de baixo grau com elevada taxa de clareamento imune.";
            }

            return "Repetir exame citopatológico em 6 meses. Se persistir alteração em 2 exames consecutivos, encaminhar para Colposcopia.";
        }

        if (code == "ASC-H")
        {
            return "Encaminhamento urgente para Colposcopia. Risco significativo de lesão intraepitelial de alto grau subjacente.";
        }

        if (code == "HSIL")
        {
            return "Encaminhamento urgente para Colposcopia com biópsia se indicado. Risco elevado de NIC 2/3 ou lesão invasora inicial.";
        }

        if (code == "AGC")
        {
            return "Encaminhamento urgente para Colposcopia e avaliação do canal endocervical / endométrio. Investigação obrigatória de atipias glandulares.";
        }

        return "Avaliar quadro clínico individualmente e correlacionar com exames complementares e histórico de rastreamento prévio.";
    }
}
