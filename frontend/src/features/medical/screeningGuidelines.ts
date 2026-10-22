/**
 * Motor de recomendações de condutas clínicas para rastreamento de câncer do colo do útero (INCA/MS)
 * e classificação mamográfica/USG BI-RADS (ACR/CBR).
 */

export interface BethesdaOption {
  code: string;
  label: string;
  description: string;
}

export const BETHESDA_OPTIONS: BethesdaOption[] = [
  { code: 'NILM', label: 'NILM - Negativo para Lesão Intraepitelial ou Malignidade', description: 'Citologia dentro dos limites da normalidade.' },
  { code: 'ASC-US', label: 'ASC-US - Atipias de Significado Indeterminado em Células Escamosas', description: 'Provavelmente não neoplásicas.' },
  { code: 'ASC-H', label: 'ASC-H - Atipias Escamosas de Significado Indeterminado (não se pode excluir HSIL)', description: 'Alto risco de lesão subjacente.' },
  { code: 'LSIL', label: 'LSIL - Lesão Intraepitelial de Baixo Grau', description: 'Displasia leve / infecção transitória por HPV.' },
  { code: 'HSIL', label: 'HSIL - Lesão Intraepitelial de Alto Grau', description: 'Displasia moderada a grave / NIC 2/3.' },
  { code: 'AGC', label: 'AGC - Atipias em Células Glandulares', description: 'Possível acometimento endocervical ou endometrial.' },
];

export interface BiRadsOption {
  code: string;
  label: string;
  riskDescription: string;
}

export const BIRADS_OPTIONS: BiRadsOption[] = [
  { code: '0', label: 'BI-RADS 0 - Inconclusivo', riskDescription: 'Necessita avaliação adicional por imagem' },
  { code: '1', label: 'BI-RADS 1 - Negativo', riskDescription: 'Sem achados suspeitos ou benignos' },
  { code: '2', label: 'BI-RADS 2 - Achados Benignos', riskDescription: '0% de risco de malignidade' },
  { code: '3', label: 'BI-RADS 3 - Provavelmente Benigno', riskDescription: '< 2% de probabilidade de câncer' },
  { code: '4A', label: 'BI-RADS 4A - Baixa Suspeita', riskDescription: '2% a 10% de probabilidade de malignidade' },
  { code: '4B', label: 'BI-RADS 4B - Moderada Suspeita', riskDescription: '10% a 50% de probabilidade de malignidade' },
  { code: '4C', label: 'BI-RADS 4C - Alta Suspeita', riskDescription: '50% a 95% de probabilidade de malignidade' },
  { code: '5', label: 'BI-RADS 5 - Altamente Sugestivo', riskDescription: '> 95% de probabilidade de malignidade' },
  { code: '6', label: 'BI-RADS 6 - Malignidade Comprovada', riskDescription: 'Biópsia prévia positiva para câncer' },
];

export function getRecommendedCervicalConduct(bethesdaCode: string, isHpvPositive = false, patientAge = 30): string {
  const code = bethesdaCode.toUpperCase();
  if (code === 'NILM') {
    return 'Repetir exame citopatológico em 3 anos se tiver dois anuais prévios negativos (Diretriz INCA/MS).';
  }
  if (code === 'ASC-US') {
    if (isHpvPositive) {
      return 'Encaminhar imediatamente para Colposcopia (HPV oncogênico 16/18 positivo).';
    }
    if (patientAge < 25) {
      return 'Repetir exame citopatológico em 12 meses (paciente jovem < 25 anos, alta taxa de regressão).';
    }
    return 'Repetir exame citopatológico em 6 meses (se persistir, encaminhar para colposcopia).';
  }
  if (code === 'LSIL') {
    if (patientAge < 25) {
      return 'Repetir citopatológico em 12 meses (paciente jovem < 25 anos, lesão com elevada taxa de clareamento imune).';
    }
    return 'Repetir exame citopatológico em 6 meses. Se persistir alteração em 2 exames, colposcopia.';
  }
  if (code === 'ASC-H') {
    return 'Encaminhamento urgente para Colposcopia. Risco considerável de HSIL subjacente.';
  }
  if (code === 'HSIL') {
    return 'Encaminhamento urgente para Colposcopia com biópsia se indicado (Diretriz INCA/MS).';
  }
  if (code === 'AGC') {
    return 'Encaminhamento urgente para Colposcopia e investigação endocervical/endometrial.';
  }
  return 'Avaliar clinicamente conforme histórico e exames anteriores.';
}

export function getRecommendedBiRadsConduct(biRadsCode: string): string {
  const code = biRadsCode.toUpperCase();
  switch (code) {
    case '0': return 'Necessita exames complementares de imagem (magnificação/compressão seletiva, USG ou ressonância) ou comparação com anteriores.';
    case '1': return 'Rastreamento mamográfico anual de rotina conforme protocolo para faixa etária.';
    case '2': return 'Rastreamento mamográfico anual de rotina. Achados tipicamente benignos.';
    case '3': return 'Controle de curto intervalo em 6 meses (unilateral) para monitorar estabilidade.';
    case '4A': return 'Indicação de investigação anatomopatológica / biópsia percutânea (baixa suspeita: 2 a 10%).';
    case '4B': return 'Indicação de biópsia percutânea por agulha grossa ou mamotomia (moderada suspeita: 10 a 50%).';
    case '4C': return 'Indicação de biópsia percutânea imediata (alta suspeita: 50 a 95%).';
    case '5': return 'Indicação de biópsia urgente e encaminhamento para oncologia mamária (> 95% probabilidade de câncer).';
    case '6': return 'Malignidade comprovada por biópsia. Proceder com conduta terapêutica cirúrgica/oncológica.';
    default: return 'Correlacionar com achados clínicos da palpação mamária.';
  }
}
