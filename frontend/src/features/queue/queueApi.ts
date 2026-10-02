import { apiGet, apiPost } from '../../api/client';
import type { components } from '../../api/schema';

export type QueueEntry = components['schemas']['QueueEntryResponse'];
export type QueueDay = components['schemas']['QueueDayResponse'];
export type CloseDayResult = components['schemas']['CloseDayResponse'];

/** Fila do dia (ordenada por prioridade e chegada). */
export function fetchQueue(date: string, professionalId?: string, signal?: AbortSignal): Promise<QueueDay> {
  const query = new URLSearchParams({ date });

  if (professionalId) {
    query.set('professionalId', professionalId);
  }

  return apiGet<QueueDay>(`/queue?${query.toString()}`, signal);
}

/** Check-in por agendamento. */
export function checkInFromAppointment(
  appointmentId: string,
  priority: string,
  signal?: AbortSignal,
): Promise<QueueEntry> {
  return apiPost<QueueEntry>('/queue/check-in', { appointmentId, priority }, signal);
}

/** Check-in de encaixe, sem agendamento. */
export function checkInWalkIn(
  patientId: string,
  professionalId: string,
  priority: string,
  signal?: AbortSignal,
): Promise<QueueEntry> {
  return apiPost<QueueEntry>(
    '/queue/check-in',
    { appointmentId: null, patientId, professionalId, priority },
    signal,
  );
}

/** Chama o paciente. */
export function callQueueEntry(entryId: string, signal?: AbortSignal): Promise<QueueEntry> {
  return apiPost<QueueEntry>(`/queue/${entryId}/call`, {}, signal);
}

/** Inicia o atendimento. */
export function startQueueEntry(entryId: string, signal?: AbortSignal): Promise<QueueEntry> {
  return apiPost<QueueEntry>(`/queue/${entryId}/start`, {}, signal);
}

/** Conclui o atendimento (marca o agendamento como atendido). */
export function completeQueueEntry(entryId: string, signal?: AbortSignal): Promise<QueueEntry> {
  return apiPost<QueueEntry>(`/queue/${entryId}/complete`, {}, signal);
}

/** Registra desistência do paciente. */
export function leaveQueueEntry(entryId: string, signal?: AbortSignal): Promise<QueueEntry> {
  return apiPost<QueueEntry>(`/queue/${entryId}/leave`, {}, signal);
}

/** Fecha o dia da agenda, resolvendo pendências e devolvendo o resumo. */
export function closeDay(date: string, professionalId?: string | null, signal?: AbortSignal): Promise<CloseDayResult> {
  return apiPost<CloseDayResult>('/agenda/close-day', { date, professionalId: professionalId || null }, signal);
}
