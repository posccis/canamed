import { apiGet, apiPost, apiPut } from '../../api/client';

export interface MedicalRecordAddendumResponse {
  id: string;
  medicalRecordId: string;
  doctorId: string;
  justification: string;
  notes: string;
  createdAt: string;
}

export interface MedicalRecordResponse {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  status: 'em_andamento' | 'finalizado';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  clinicalNotes?: string;
  finalizedAt?: string;
  finalizedBy?: string;
  createdAt: string;
  updatedAt: string;
  addenda: MedicalRecordAddendumResponse[];
}

export interface StartMedicalRecordRequest {
  patientId: string;
  appointmentId?: string;
}

export interface UpdateDraftMedicalRecordRequest {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  clinicalNotes?: string;
}

export interface AddAddendumRequest {
  justification: string;
  notes: string;
}

export async function startOrGetMedicalRecord(request: StartMedicalRecordRequest): Promise<MedicalRecordResponse> {
  return apiPost<MedicalRecordResponse>('/medical-records', request);
}

export async function updateDraftMedicalRecord(id: string, request: UpdateDraftMedicalRecordRequest): Promise<MedicalRecordResponse> {
  return apiPut<MedicalRecordResponse>(`/medical-records/${id}`, request);
}

export async function finalizeMedicalRecord(id: string): Promise<MedicalRecordResponse> {
  return apiPost<MedicalRecordResponse>(`/medical-records/${id}/finalize`);
}

export async function addMedicalRecordAddendum(id: string, request: AddAddendumRequest): Promise<MedicalRecordAddendumResponse> {
  return apiPost<MedicalRecordAddendumResponse>(`/medical-records/${id}/addenda`, request);
}

export async function getMedicalRecord(id: string): Promise<MedicalRecordResponse> {
  return apiGet<MedicalRecordResponse>(`/medical-records/${id}`);
}

export async function getPatientMedicalRecordHistory(patientId: string): Promise<MedicalRecordResponse[]> {
  return apiGet<MedicalRecordResponse[]>(`/patients/${patientId}/medical-records`);
}
