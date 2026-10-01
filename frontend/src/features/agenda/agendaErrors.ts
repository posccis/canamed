import { ApiError } from '../../api/client';
import { formatTime } from './agendaFormat';

/** Mensagem clara para o usuário, sem jargão técnico (seção 11 do PROJECT_BRIEF). */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.detail ?? error.message;
  }

  return 'Não foi possível concluir a operação. Verifique a conexão e tente novamente.';
}

/** Horários livres sugeridos pela API em caso de conflito (seção 8 da SPEC-0002). */
export function suggestedTimes(error: unknown): string[] {
  if (!(error instanceof ApiError)) {
    return [];
  }

  const suggestions = error.extensions.suggestions;

  if (!Array.isArray(suggestions)) {
    return [];
  }

  return suggestions
    .filter((value): value is string => typeof value === 'string')
    .map((value) => formatTime(value));
}
