namespace Canamed.Domain.MedicalRecords;

/// <summary>
/// Classificação padronizada BI-RADS (Breast Imaging-Reporting and Data System - ACR/Colégio Brasileiro de Radiologia)
/// e condutas clínicas recomendadas para exames mamográficos e ultrassonografia de mamas.
/// </summary>
public static class BiRadsClassification
{
    public static string GetRecommendedConduct(string categoryCode)
    {
        var code = categoryCode?.Trim().ToUpperInvariant() ?? string.Empty;

        return code switch
        {
            "0" => "Inconclusivo / Necessita avaliação adicional por imagem ou exames anteriores.",
            "1" => "Negativo / Rastreamento anual de rotina conforme faixa etária.",
            "2" => "Achados benignos / Rastreamento anual de rotina.",
            "3" => "Provavelmente benigno (< 2% malignidade) / Controle em intervalo curto de 6 meses.",
            "4A" => "Baixa suspeita de malignidade (2% a 10%) / Indicada biópsia percutânea (core biopsy ou mamotomia).",
            "4B" => "Moderada suspeita de malignidade (10% a 50%) / Indicada biópsia percutânea com estudo anatomopatológico.",
            "4C" => "Alta suspeita de malignidade (50% a 95%) / Indicada biópsia percutânea imediata.",
            "5" => "Altamente sugestivo de malignidade (> 95%) / Indicada biópsia urgente e estadiamento oncológico.",
            "6" => "Malignidade comprovada por biópsia prévia / Planejamento terapêutico cirúrgico/oncológico.",
            _ => "Correlacionar achados de imagem com o exame físico mamário e dados clínicos da paciente."
        };
    }
}
