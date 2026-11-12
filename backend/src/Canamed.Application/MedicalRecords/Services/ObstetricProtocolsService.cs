using System.Collections.Generic;

namespace Canamed.Application.MedicalRecords.Services;

public sealed record ObstetricProtocolRecommendation(
    int GestationalWeeks,
    int GestationalDays,
    string Trimester,
    IReadOnlyList<string> RecommendedExams,
    IReadOnlyList<string> RecommendedVaccines,
    IReadOnlyList<string> CriticalAlerts,
    string NextVisitInterval);

/// <summary>
/// Serviço de Protocolos e Esteira Trimestral Obstétrica (FEBRASGO / Ministério da Saúde).
/// Concentra as diretrizes de exames periódicos, vacinação e vigilância materno-fetal (SPEC-0035 / RN-012).
/// </summary>
public sealed class ObstetricProtocolsService
{
    public ObstetricProtocolRecommendation GetProtocolForGestationalAge(int weeks, int days = 0)
    {
        string trimester;
        var recommendedExams = new List<string>();
        var recommendedVaccines = new List<string>();
        var criticalAlerts = new List<string>();
        string nextVisitInterval;

        if (weeks <= 13)
        {
            trimester = "1º Trimestre";
            nextVisitInterval = "A cada 4 semanas";

            recommendedExams.Add("Hemograma completo");
            recommendedExams.Add("Tipagem sanguínea e Fator Rh");
            recommendedExams.Add("Coombs indireto (se Rh negativo)");
            recommendedExams.Add("Glicemia de jejum");
            recommendedExams.Add("Sorologias: VDRL (Sífilis), anti-HIV, HBsAg (Hepatite B)");
            recommendedExams.Add("Sorologia para Toxoplasmose (IgM e IgG)");
            recommendedExams.Add("EAS e Urocultura com antibiograma");
            recommendedExams.Add("Ultrassom morfológico de 1º trimestre com Translucência Nucal (11 a 13+6 semanas)");

            recommendedVaccines.Add("Influenza (em qualquer idade gestacional)");
            recommendedVaccines.Add("Hepatite B (3 doses se não imunizada)");
        }
        else if (weeks <= 27)
        {
            trimester = "2º Trimestre";
            nextVisitInterval = weeks >= 24 ? "A cada 3 a 4 semanas" : "A cada 4 semanas";

            recommendedExams.Add("Ultrassom morfológico fetal de 2º trimestre (20 a 24 semanas)");
            recommendedExams.Add("Teste Oral de Tolerância à Glicose - TOTG 75g (24 a 28 semanas para rastreamento de DMG)");
            recommendedExams.Add("Coombs indireto em 28 semanas (em gestantes Rh negativo)");

            if (weeks >= 20)
            {
                recommendedVaccines.Add("dTpa (Difteria, Tétano e Coqueluche acelular a partir da 20ª semana)");
            }
            recommendedVaccines.Add("Influenza (se ainda não administrada)");

            if (weeks >= 24)
            {
                criticalAlerts.Add("Solicitar TOTG 75g com 3 dosagens (jejum, 1h e 2h) entre 24 e 28 semanas.");
            }
        }
        else
        {
            trimester = "3º Trimestre";
            nextVisitInterval = weeks >= 36 ? "Semanal (a cada 7 dias)" : "A cada 2 semanas (quinzenal)";

            recommendedExams.Add("Hemograma de controle no 3º trimestre");
            recommendedExams.Add("Sorologias de 3º trimestre: VDRL e anti-HIV");
            recommendedExams.Add("Urocultura de controle do 3º trimestre");
            recommendedExams.Add("Ultrassom obstétrico com avaliação de Líquido Amniótico (ILA) e Doppler");

            if (weeks >= 35 && weeks <= 37)
            {
                recommendedExams.Add("Pesquisa de Streptococcus agalactiae do Grupo B (Swab retovaginal Strep B entre 35 e 37 semanas)");
                criticalAlerts.Add("Coleta de Swab anovaginal para Streptococcus agalactiae obrigatória entre 35 e 37 semanas.");
            }
            else if (weeks > 37)
            {
                recommendedExams.Add("Checar resultado do Swab para Streptococcus do Grupo B para profilaxia intraparto");
            }

            recommendedVaccines.Add("dTpa (caso ainda não tenha sido administrada no 2º trimestre)");
        }

        return new ObstetricProtocolRecommendation(
            GestationalWeeks: weeks,
            GestationalDays: days,
            Trimester: trimester,
            RecommendedExams: recommendedExams,
            RecommendedVaccines: recommendedVaccines,
            CriticalAlerts: criticalAlerts,
            NextVisitInterval: nextVisitInterval);
    }
}
