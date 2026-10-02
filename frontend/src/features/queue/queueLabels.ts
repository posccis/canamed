/** Rótulos em português da fila de espera (SPEC-0005). */
export const queueStatusLabels: Record<string, string> = {
  aguardando: 'Aguardando',
  chamado: 'Chamado',
  em_atendimento: 'Em atendimento',
  atendido: 'Atendido',
  desistiu: 'Desistiu',
  cancelado: 'Cancelado',
};

export const queuePriorityLabels: Record<string, string> = {
  normal: 'Normal',
  preferencial: 'Preferencial',
};

/** Descreve o tempo em minutos de forma curta: "45 min", "2h05". */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) {
    return '—';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, '0')}`;
}
