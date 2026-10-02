import { apiGet } from '../../api/client';

export type ProfessionalMetric = {
  professionalId: string;
  professionalName: string;
  totalAppointments: number;
  attendedCount: number;
  noShowCount: number;
};

export type RoomMetric = {
  roomId: string;
  roomName: string;
  appointmentsCount: number;
};

export type UpcomingAppointment = {
  id: string;
  patientName: string;
  professionalName: string;
  appointmentTypeName: string;
  startsAt: string;
  endsAt: string;
  roomName: string | null;
  status: string;
};

export type DashboardSummary = {
  date: string;
  totalAppointments: number;
  scheduledCount: number;
  confirmedCount: number;
  attendedCount: number;
  noShowCount: number;
  cancelledCount: number;
  attendanceRate: number;
  queueWaitingCount: number;
  queueInServiceCount: number;
  queueCompletedCount: number;
  averageWaitMinutes: number;
  professionals: ProfessionalMetric[];
  rooms: RoomMetric[];
  upcomingAppointments: UpcomingAppointment[];
};

/** Consulta o resumo operacional do dia (SPEC-0007). */
export function fetchDashboardSummary(date?: string, signal?: AbortSignal): Promise<DashboardSummary> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiGet<DashboardSummary>(`/dashboard/summary${query}`, signal);
}
