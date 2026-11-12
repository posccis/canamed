import { apiGet, apiPost, apiPut } from '../../api/client';

export interface LarcPlacementDto {
  id: string;
  clinicId: string;
  patientId: string;
  medicalRecordId?: string | null;
  deviceType: string;
  deviceName: string;
  batchNumber: string;
  insertionDate: string;
  expirationDate: string;
  controlUltrasoundDate?: string | null;
  hysterometryCm?: number | null;
  procedureNotes?: string | null;
  isRemoved: boolean;
  removalDate?: string | null;
  removalReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateLarcPlacementRequest {
  medicalRecordId?: string | null;
  deviceType: string;
  deviceName?: string | null;
  batchNumber?: string | null;
  lotNumber?: string | null;
  insertionDate: string;
  hysterometryCm?: number | null;
  procedureNotes?: string | null;
  notes?: string | null;
}

export interface RemoveLarcPlacementRequest {
  removalDate: string;
  removalReason?: string | null;
}

export async function listLarcRecords(patientId: string): Promise<LarcPlacementDto[]> {
  return apiGet<LarcPlacementDto[]>(`/patients/${patientId}/larc-records`);
}

export async function createLarcRecord(patientId: string, req: CreateLarcPlacementRequest): Promise<LarcPlacementDto> {
  return apiPost<LarcPlacementDto>(`/patients/${patientId}/larc-records`, req);
}

export async function removeLarcRecord(patientId: string, id: string, req: RemoveLarcPlacementRequest): Promise<LarcPlacementDto> {
  return apiPut<LarcPlacementDto>(`/patients/${patientId}/larc-records/${id}/remove`, req);
}
