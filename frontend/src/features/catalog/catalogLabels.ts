/** Rótulos em português da classificação das consultas (SPEC-0004). */
export const categoryLabels: Record<string, string> = {
  avulsa: 'Avulsa',
  acompanhamento: 'Acompanhamento',
};

export const coverageLabels: Record<string, string> = {
  particular: 'Particular',
  plano_saude: 'Plano de saúde',
};

/** Descreve a classificação de um tipo de consulta, por exemplo "Acompanhamento · Plano de saúde". */
export function describeClassification(category: string, coverage: string, specialtyName?: string | null): string {
  const parts = [categoryLabels[category] ?? category, coverageLabels[coverage] ?? coverage];

  if (specialtyName) {
    parts.push(specialtyName);
  }

  return parts.join(' · ');
}

/** Opções de natureza aceitas pela API. */
export const categoryOptions = [
  { value: 'avulsa', label: 'Avulsa' },
  { value: 'acompanhamento', label: 'Acompanhamento' },
];

/** Opções de custeio aceitas pela API. */
export const coverageOptions = [
  { value: 'particular', label: 'Particular' },
  { value: 'plano_saude', label: 'Plano de saúde' },
];
