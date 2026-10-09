import { apiGet, apiPost } from '../../api/client';
import type { TriageRecordResponse } from '../queue/triageApi';
import type { MedicalRecordResponse } from './medicalRecordsApi';
import type { QueueEntry } from '../queue/queueApi';

export interface ActiveConsultationDto {
  queueEntryId: string;
  patientId: string;
  patientName: string;
  patientBirthDate?: string;
  allergies?: string;
  chronicConditions?: string;
  healthPlanName?: string;
  triage?: TriageRecordResponse;
  medicalRecord?: MedicalRecordResponse;
  startedAt?: string;
}

export interface DoctorWaitingItemDto {
  queueEntryId: string;
  patientId: string;
  patientName: string;
  priority: 'normal' | 'preferencial';
  status: string;
  riskClassification?: string;
  waitingTimeMinutes: number;
  arrivedAt: string;
  appointmentId?: string;
}

export interface DoctorWorkspaceStateResponse {
  doctorId: string;
  doctorName: string;
  clinicId: string;
  activeRoomId?: string;
  activeRoomName?: string;
  activeConsultation?: ActiveConsultationDto;
  waitingQueue: DoctorWaitingItemDto[];
}

export interface CallNextPatientRequest {
  queueEntryId?: string;
  roomId?: string;
}

export interface StartConsultationRequest {
  queueEntryId: string;
}

export interface FinishConsultationRequest {
  medicalRecordId: string;
  queueEntryId: string;
}

export async function getDoctorWorkspaceState(): Promise<DoctorWorkspaceStateResponse> {
  return apiGet<DoctorWorkspaceStateResponse>('/doctor-workspace/state');
}

export async function doctorCallPatient(request: CallNextPatientRequest): Promise<QueueEntry> {
  return apiPost<QueueEntry>('/doctor-workspace/call-patient', request);
}

export async function doctorStartConsultation(request: StartConsultationRequest): Promise<ActiveConsultationDto> {
  return apiPost<ActiveConsultationDto>('/doctor-workspace/start-consultation', request);
}

export async function doctorFinishConsultation(request: FinishConsultationRequest): Promise<void> {
  return apiPost<void>('/doctor-workspace/finish-consultation', request);
}
