import { apiDelete, apiGet, apiPost } from '../../api/client';
import type { components } from '../../api/schema';

export type AgendaDay = components['schemas']['AgendaDayResponse'];
export type Appointment = components['schemas']['AppointmentResponse'];
export type AgendaBlock = components['schemas']['BlockResponse'];
export type Professional = components['schemas']['ProfessionalResponse'];
export type Patient = components['schemas']['PatientResponse'];
export type AppointmentType = components['schemas']['AppointmentTypeResponse'];

/** Consulta a agenda de um dia (F-004). */
export function fetchAgendaDay(
  date: string,
  professionalId: string | undefined,
  signal?: AbortSignal,
): Promise<AgendaDay> {
  const query = new URLSearchParams({ date });

  if (professionalId) {
    query.set('professionalId', professionalId);
  }

  return apiGet<AgendaDay>(`/appointments?${query.toString()}`, signal);
}

/** Cria um agendamento (F-001). */
export function createAppointment(
  request: components['schemas']['CreateAppointmentRequest'],
  signal?: AbortSignal,
): Promise<Appointment> {
  return apiPost<Appointment>('/appointments', request, signal);
}

/** Remarca um agendamento (F-002, SPEC-0006). */
export function rescheduleAppointment(
  appointmentId: string,
  startsAt: string,
  roomId?: string | null,
  signal?: AbortSignal,
): Promise<Appointment> {
  return apiPost<Appointment>(`/appointments/${appointmentId}/reschedule`, { startsAt, roomId }, signal);
}

/** Cancela um agendamento com motivo obrigatório (F-003). */
export function cancelAppointment(
  appointmentId: string,
  reason: string,
  signal?: AbortSignal,
): Promise<Appointment> {
  return apiPost<Appointment>(`/appointments/${appointmentId}/cancel`, { reason }, signal);
}

/** Registra que o paciente foi atendido (RN-005). */
export function markAppointmentAttended(appointmentId: string, signal?: AbortSignal): Promise<Appointment> {
  return apiPost<Appointment>(`/appointments/${appointmentId}/attend`, {}, signal);
}

/** Registra a falta do paciente (RN-005). */
export function markAppointmentNoShow(appointmentId: string, signal?: AbortSignal): Promise<Appointment> {
  return apiPost<Appointment>(`/appointments/${appointmentId}/no-show`, {}, signal);
}

/** Bloqueia um intervalo da agenda do profissional (RN-011). */
export function createBlock(
  professionalId: string,
  request: components['schemas']['CreateBlockRequest'],
  signal?: AbortSignal,
): Promise<AgendaBlock> {
  return apiPost<AgendaBlock>(`/professionals/${professionalId}/blocks`, request, signal);
}

/** Remove um bloqueio, devolvendo o intervalo à agenda (RN-007 da SPEC-0004). */
export function removeBlock(professionalId: string, blockId: string, signal?: AbortSignal): Promise<void> {
  return apiDelete<void>(`/professionals/${professionalId}/blocks/${blockId}`, signal);
}

/** Lista os profissionais da clínica. */
export function fetchProfessionals(signal?: AbortSignal): Promise<Professional[]> {
  return apiGet<Professional[]>('/professionals', signal);
}

/** Lista os pacientes da clínica. */
export function fetchPatients(signal?: AbortSignal): Promise<Patient[]> {
  return apiGet<Patient[]>('/patients', signal);
}

/** Lista os tipos de atendimento da clínica. */
export function fetchAppointmentTypes(signal?: AbortSignal): Promise<AppointmentType[]> {
  return apiGet<AppointmentType[]>('/appointment-types', signal);
}

/** Cadastra um paciente (cadastro mínimo necessário para agendar). */
export function createPatient(
  request: components['schemas']['CreatePatientRequest'],
  signal?: AbortSignal,
): Promise<Patient> {
  return apiPost<Patient>('/patients', request, signal);
}

/** Cadastra um profissional (cadastro mínimo necessário para agendar). */
export function createProfessional(
  request: components['schemas']['CreateProfessionalRequest'],
  signal?: AbortSignal,
): Promise<Professional> {
  return apiPost<Professional>('/professionals', request, signal);
}

/** Cadastra um tipo de atendimento com a duração padrão. */
export function createAppointmentType(
  request: components['schemas']['CreateAppointmentTypeRequest'],
  signal?: AbortSignal,
): Promise<AppointmentType> {
  return apiPost<AppointmentType>('/appointment-types', request, signal);
}
