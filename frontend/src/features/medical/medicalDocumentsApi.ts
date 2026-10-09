import { apiGet, apiPost, apiPut } from '../../api/client';

export type MedicalDocumentType = 'receita_simples' | 'receita_controle_especial' | 'atestado_medico' | 'solicitacao_exames';
export type MedicalDocumentStatus = 'rascunho' | 'assinado' | 'cancelado';

export interface CreateMedicalDocumentRequest {
  patientId: string;
  medicalRecordId?: string;
  documentType: MedicalDocumentType;
  contentPayload: string;
  cid10Code?: string;
  patientConsentedCid: boolean;
}

export interface UpdateMedicalDocumentRequest {
  contentPayload: string;
  cid10Code?: string;
  patientConsentedCid: boolean;
}

export interface CancelMedicalDocumentRequest {
  reason: string;
}

export interface MedicalDocumentResponse {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  documentType: MedicalDocumentType;
  status: MedicalDocumentStatus;
  contentPayload: string;
  cid10Code?: string;
  patientConsentedCid: boolean;
  signatureHash?: string;
  publicToken: string;
  cancellationReason?: string;
  signedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface PublicDocumentValidationResponse {
  isValid: boolean;
  status: string;
  documentType: string;
  issuedAt?: string;
  doctorName: string;
  clinicName: string;
  patientInitials: string;
  cancellationReason?: string;
}

export async function createMedicalDocument(request: CreateMedicalDocumentRequest): Promise<MedicalDocumentResponse> {
  return apiPost<MedicalDocumentResponse>('/medical-documents', request);
}

export async function updateMedicalDocument(id: string, request: UpdateMedicalDocumentRequest): Promise<MedicalDocumentResponse> {
  return apiPut<MedicalDocumentResponse>(`/medical-documents/${id}`, request);
}

export async function signMedicalDocument(id: string): Promise<MedicalDocumentResponse> {
  return apiPost<MedicalDocumentResponse>(`/medical-documents/${id}/sign`);
}

export async function cancelMedicalDocument(id: string, request: CancelMedicalDocumentRequest): Promise<MedicalDocumentResponse> {
  return apiPost<MedicalDocumentResponse>(`/medical-documents/${id}/cancel`, request);
}

export async function getMedicalDocument(id: string): Promise<MedicalDocumentResponse> {
  return apiGet<MedicalDocumentResponse>(`/medical-documents/${id}`);
}

export async function getPatientMedicalDocuments(patientId: string): Promise<MedicalDocumentResponse[]> {
  return apiGet<MedicalDocumentResponse[]>(`/patients/${patientId}/medical-documents`);
}
