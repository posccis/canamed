import { apiGet, apiPost } from '../../api/client';

export type RiskClassification = 'vermelho' | 'laranja' | 'amarelo' | 'verde' | 'azul';

export interface RecordTriageRequest {
  riskClassification: RiskClassification;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  glucose?: number;
  weightKg?: number;
  heightCm?: number;
  chiefComplaint?: string;
  allergies?: string;
}

export interface TriageRecordResponse {
  id: string;
  queueEntryId: string;
  patientId: string;
  clinicId: string;
  riskClassification: RiskClassification;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  glucose?: number;
  weightKg?: number;
  heightCm?: number;
  calculatedBmi?: number;
  chiefComplaint?: string;
  allergies?: string;
  recordedAt: string;
  operatorName: string;
}

export async function recordTriage(queueEntryId: string, request: RecordTriageRequest): Promise<TriageRecordResponse> {
  return apiPost<TriageRecordResponse>(`/api/v1/queue/${queueEntryId}/triage`, request);
}

export async function getTriage(queueEntryId: string): Promise<TriageRecordResponse> {
  return apiGet<TriageRecordResponse>(`/api/v1/queue/${queueEntryId}/triage`);
}
