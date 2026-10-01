import { apiGet, apiPost } from '../../api/client';
import type { components } from '../../api/schema';

export type Specialty = components['schemas']['SpecialtyResponse'];
export type ManagedAppointmentType = components['schemas']['AppointmentTypeResponse'];
export type ManagedProfessional = components['schemas']['ProfessionalResponse'];
export type ManagedPatient = components['schemas']['PatientResponse'];

/** Especialidades da clínica (ativas e inativas). */
export function fetchSpecialties(signal?: AbortSignal): Promise<Specialty[]> {
  return apiGet<Specialty[]>('/specialties', signal);
}

/** Cria uma especialidade. */
export function createSpecialty(name: string, signal?: AbortSignal): Promise<Specialty> {
  return apiPost<Specialty>('/specialties', { name }, signal);
}

/** Renomeia uma especialidade. */
export function renameSpecialty(id: string, name: string, signal?: AbortSignal): Promise<Specialty> {
  return apiPost<Specialty>(`/specialties/${id}`, { name }, signal);
}

/** Desativa uma especialidade (recusado quando há vínculo ativo). */
export function deactivateSpecialty(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/specialties/${id}/deactivate`, undefined, signal);
}

/** Reativa uma especialidade. */
export function activateSpecialty(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/specialties/${id}/activate`, undefined, signal);
}

/** Cria um tipo de consulta classificado. */
export function createManagedAppointmentType(
  request: components['schemas']['CreateAppointmentTypeRequest'],
  signal?: AbortSignal,
): Promise<ManagedAppointmentType> {
  return apiPost<ManagedAppointmentType>('/appointment-types', request, signal);
}

/** Altera um tipo de consulta. */
export function updateAppointmentType(
  id: string,
  request: components['schemas']['UpdateAppointmentTypeRequest'],
  signal?: AbortSignal,
): Promise<ManagedAppointmentType> {
  return apiPost<ManagedAppointmentType>(`/appointment-types/${id}`, request, signal);
}

/** Desativa um tipo de consulta. */
export function deactivateAppointmentType(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/appointment-types/${id}/deactivate`, undefined, signal);
}

/** Reativa um tipo de consulta. */
export function activateAppointmentType(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/appointment-types/${id}/activate`, undefined, signal);
}

/** Altera um profissional (nome e especialidade). */
export function updateProfessional(
  id: string,
  request: components['schemas']['UpdateProfessionalRequest'],
  signal?: AbortSignal,
): Promise<ManagedProfessional> {
  return apiPost<ManagedProfessional>(`/professionals/${id}`, request, signal);
}

/** Desativa um profissional. */
export function deactivateProfessional(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/professionals/${id}/deactivate`, undefined, signal);
}

/** Reativa um profissional. */
export function activateProfessional(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/professionals/${id}/activate`, undefined, signal);
}

/** Edita os dados cadastrais do paciente. */
export function updatePatient(
  id: string,
  request: components['schemas']['UpdatePatientRequest'],
  signal?: AbortSignal,
): Promise<ManagedPatient> {
  return apiPost<ManagedPatient>(`/patients/${id}`, request, signal);
}

/** Desativa um paciente. */
export function deactivatePatient(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/patients/${id}/deactivate`, undefined, signal);
}

/** Reativa um paciente. */
export function activatePatient(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/patients/${id}/activate`, undefined, signal);
}
