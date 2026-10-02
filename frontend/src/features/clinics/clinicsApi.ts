import { apiDelete, apiGet, apiPost, apiPut } from '../../api/client';

export type HealthPlan = {
  id: string;
  name: string;
  ansCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OperatingHour = {
  id: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
};

export type OperatingHourInput = {
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
};

export type ClinicClosure = {
  id: string;
  date: string;
  description: string;
  createdAt: string;
};

// Convênios
export function fetchHealthPlans(signal?: AbortSignal): Promise<HealthPlan[]> {
  return apiGet<HealthPlan[]>('/health-plans', signal);
}

export function createHealthPlan(
  data: { name: string; ansCode?: string | null },
  signal?: AbortSignal,
): Promise<HealthPlan> {
  return apiPost<HealthPlan>('/health-plans', data, signal);
}

export function updateHealthPlan(
  id: string,
  data: { name: string; ansCode?: string | null },
  signal?: AbortSignal,
): Promise<HealthPlan> {
  return apiPost<HealthPlan>(`/health-plans/${id}`, data, signal);
}

export function deactivateHealthPlan(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/health-plans/${id}/deactivate`, {}, signal);
}

export function activateHealthPlan(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/health-plans/${id}/activate`, {}, signal);
}

// Salas
export function fetchRooms(signal?: AbortSignal): Promise<Room[]> {
  return apiGet<Room[]>('/rooms', signal);
}

export function createRoom(data: { name: string }, signal?: AbortSignal): Promise<Room> {
  return apiPost<Room>('/rooms', data, signal);
}

export function renameRoom(id: string, data: { name: string }, signal?: AbortSignal): Promise<Room> {
  return apiPost<Room>(`/rooms/${id}`, data, signal);
}

export function deactivateRoom(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/rooms/${id}/deactivate`, {}, signal);
}

export function activateRoom(id: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/rooms/${id}/activate`, {}, signal);
}

// Horário de Funcionamento
export function fetchOperatingHours(signal?: AbortSignal): Promise<OperatingHour[]> {
  return apiGet<OperatingHour[]>('/operating-hours', signal);
}

export function replaceOperatingHours(
  hours: OperatingHourInput[],
  signal?: AbortSignal,
): Promise<OperatingHour[]> {
  return apiPut<OperatingHour[]>('/operating-hours', { hours }, signal);
}

// Feriados / Exceções
export function fetchClinicClosures(signal?: AbortSignal): Promise<ClinicClosure[]> {
  return apiGet<ClinicClosure[]>('/clinic-closures', signal);
}

export function createClinicClosure(
  data: { date: string; description: string },
  signal?: AbortSignal,
): Promise<ClinicClosure> {
  return apiPost<ClinicClosure>('/clinic-closures', data, signal);
}

export function removeClinicClosure(id: string, signal?: AbortSignal): Promise<void> {
  return apiDelete<void>(`/clinic-closures/${id}`, signal);
}
