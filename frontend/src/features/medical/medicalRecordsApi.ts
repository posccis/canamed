import { apiGet, apiPost, apiPut, apiDelete, apiPostForm } from '../../api/client';

export interface MedicalRecordAddendumResponse {
  id: string;
  medicalRecordId: string;
  doctorId: string;
  justification: string;
  notes: string;
  createdAt: string;
}

export interface GynecologicalProfileDto {
  id: string;
  clinicId: string;
  patientId: string;
  menarcheAge?: number | null;
  sexarcheAge?: number | null;
  cycleIntervalDays?: number | null;
  cycleDurationDays?: number | null;
  isCycleRegular?: boolean | null;
  flowIntensity?: string | null;
  dysmenorrhea?: string | null;
  hasPms?: boolean | null;
  pmsSymptoms?: string | null;
  menopauseStatus?: string | null;
  menopauseAge?: number | null;
  hrtInUse?: boolean | null;
  gravida: number;
  para: number;
  cesareans: number;
  abortions: number;
  livingChildren: number;
  ectopicPregnancies: number;
  obstetricNotes?: string | null;
  currentMethod?: string | null;
  currentMethodUsageMonths?: number | null;
  previousMethods?: string | null;
  reproductivePlan?: string | null;
  pelvicSurgeries?: string | null;
  stiHistory?: string | null;
  familyCancerHistory?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGynecologicalProfileRequest {
  menarcheAge?: number | null;
  sexarcheAge?: number | null;
  cycleIntervalDays?: number | null;
  cycleDurationDays?: number | null;
  isCycleRegular?: boolean | null;
  flowIntensity?: string | null;
  dysmenorrhea?: string | null;
  hasPms?: boolean | null;
  pmsSymptoms?: string | null;
  menopauseStatus?: string | null;
  menopauseAge?: number | null;
  hrtInUse?: boolean | null;
  gravida: number;
  para: number;
  cesareans: number;
  abortions: number;
  livingChildren: number;
  ectopicPregnancies: number;
  obstetricNotes?: string | null;
  currentMethod?: string | null;
  currentMethodUsageMonths?: number | null;
  previousMethods?: string | null;
  reproductivePlan?: string | null;
  pelvicSurgeries?: string | null;
  stiHistory?: string | null;
  familyCancerHistory?: string | null;
}

export interface PreventiveScreeningDto {
  id: string;
  clinicId: string;
  patientId: string;
  medicalRecordId?: string | null;
  examType: string;
  performedAt: string;
  resultSummary: string;
  classification?: string | null;
  nextDueDate?: string | null;
  createdAt: string;
}

export interface CreatePreventiveScreeningRequest {
  medicalRecordId?: string | null;
  examType: string;
  performedAt: string;
  resultSummary: string;
  classification?: string | null;
  nextDueDate?: string | null;
}

export interface GynecologicalConsultationDataDto {
  id: string;
  medicalRecordId: string;
  dum?: string | null;
  isDumUncertain: boolean;
  isMenopausal: boolean;
  chiefComplaint?: string | null;
  hma?: string | null;
  isSexuallyActive?: boolean | null;
  dyspareunia?: string | null;
  breastsIsNormal: boolean;
  breastsFindings?: string | null;
  abdomenIsNormal: boolean;
  abdomenFindings?: string | null;
  externalGenitaliaIsNormal: boolean;
  externalGenitaliaFindings?: string | null;
  speculumExamIsNormal: boolean;
  speculumExamFindings?: string | null;
  bimanualPalpationIsNormal: boolean;
  bimanualPalpationFindings?: string | null;
  procedurePerformed?: string | null;
  procedureBatch?: string | null;
  procedureNotes?: string | null;
  diagnosesJson?: string | null;
  prescriptionNotes?: string | null;
  generalOrientationNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateGynecologicalConsultationRequest {
  dum?: string | null;
  isDumUncertain: boolean;
  isMenopausal: boolean;
  chiefComplaint?: string | null;
  hma?: string | null;
  isSexuallyActive?: boolean | null;
  dyspareunia?: string | null;
  breastsIsNormal: boolean;
  breastsFindings?: string | null;
  abdomenIsNormal: boolean;
  abdomenFindings?: string | null;
  externalGenitaliaIsNormal: boolean;
  externalGenitaliaFindings?: string | null;
  speculumExamIsNormal: boolean;
  speculumExamFindings?: string | null;
  bimanualPalpationIsNormal: boolean;
  bimanualPalpationFindings?: string | null;
  procedurePerformed?: string | null;
  procedureBatch?: string | null;
  procedureNotes?: string | null;
  diagnosesJson?: string | null;
  prescriptionNotes?: string | null;
  generalOrientationNotes?: string | null;
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
  gynecologicalData?: GynecologicalConsultationDataDto | null;
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

// Gynecological specialized APIs
export async function getGynecologicalProfile(patientId: string): Promise<GynecologicalProfileDto> {
  return apiGet<GynecologicalProfileDto>(`/medical-records/patients/${patientId}/gynecological-profile`);
}

export async function updateGynecologicalProfile(patientId: string, request: UpdateGynecologicalProfileRequest): Promise<GynecologicalProfileDto> {
  return apiPut<GynecologicalProfileDto>(`/medical-records/patients/${patientId}/gynecological-profile`, request);
}

export async function getPatientScreenings(patientId: string): Promise<PreventiveScreeningDto[]> {
  return apiGet<PreventiveScreeningDto[]>(`/medical-records/patients/${patientId}/screenings`);
}

export async function addPatientScreening(patientId: string, request: CreatePreventiveScreeningRequest): Promise<PreventiveScreeningDto> {
  return apiPost<PreventiveScreeningDto>(`/medical-records/patients/${patientId}/screenings`, request);
}

export async function getGynecologicalConsultationData(medicalRecordId: string): Promise<GynecologicalConsultationDataDto> {
  return apiGet<GynecologicalConsultationDataDto>(`/medical-records/${medicalRecordId}/gynecological`);
}

export async function updateGynecologicalConsultationData(medicalRecordId: string, request: UpdateGynecologicalConsultationRequest): Promise<GynecologicalConsultationDataDto> {
  return apiPut<GynecologicalConsultationDataDto>(`/medical-records/${medicalRecordId}/gynecological`, request);
}

// Previous Exam Attachments (SPEC-0028)
export interface PatientExamAttachmentDto {
  id: string;
  clinicId: string;
  patientId: string;
  medicalRecordId?: string | null;
  title: string;
  examType: string;
  examDate: string;
  labFacility?: string | null;
  notes?: string | null;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  fileHash: string;
  uploadedByUserId: string;
  uploadedByName: string;
  isActive: boolean;
  createdAt: string;
}

export interface UploadExamAttachmentRequest {
  file: File;
  title: string;
  examType: string;
  examDate: string;
  labFacility?: string;
  notes?: string;
  medicalRecordId?: string;
}

export async function uploadPatientExamAttachment(
  patientId: string,
  request: UploadExamAttachmentRequest,
): Promise<PatientExamAttachmentDto> {
  const formData = new FormData();
  formData.append('file', request.file);
  formData.append('title', request.title);
  formData.append('examType', request.examType);
  formData.append('examDate', request.examDate);
  if (request.labFacility) formData.append('labFacility', request.labFacility);
  if (request.notes) formData.append('notes', request.notes);
  if (request.medicalRecordId) formData.append('medicalRecordId', request.medicalRecordId);

  return apiPostForm<PatientExamAttachmentDto>(`/patients/${patientId}/exam-attachments`, formData);
}

export async function getPatientExamAttachments(patientId: string): Promise<PatientExamAttachmentDto[]> {
  return apiGet<PatientExamAttachmentDto[]>(`/patients/${patientId}/exam-attachments`);
}

export function getExamAttachmentDownloadUrl(patientId: string, attachmentId: string): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
  return `${baseUrl}/patients/${patientId}/exam-attachments/${attachmentId}/download`;
}

export async function deactivatePatientExamAttachment(patientId: string, attachmentId: string): Promise<void> {
  return apiDelete<void>(`/patients/${patientId}/exam-attachments/${attachmentId}`);
}

// Prenatal Visits & Gestational Tracking (SPEC-0035 / Épico 2)
export interface PrenatalVisitDto {
  id: string;
  clinicId: string;
  patientId: string;
  medicalRecordId: string;
  visitDate: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  weightKg: number;
  bmi?: number | null;
  bloodPressure: string;
  uterineHeightCm?: number | null;
  fetalHeartRateBpm?: number | null;
  fetalMovementPresent?: boolean | null;
  edemaClassification?: string | null;
  fetalPresentation?: string | null;
  clinicalNotes?: string | null;
  createdAt: string;
}

export interface CreatePrenatalVisitRequest {
  visitDate: string;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  weightKg: number;
  bmi?: number | null;
  bloodPressure: string;
  uterineHeightCm?: number | null;
  fetalHeartRateBpm?: number | null;
  fetalMovementPresent?: boolean | null;
  edemaClassification?: string | null;
  fetalPresentation?: string | null;
  clinicalNotes?: string | null;
}

export async function listPatientPrenatalVisits(patientId: string): Promise<PrenatalVisitDto[]> {
  return apiGet<PrenatalVisitDto[]>(`/patients/${patientId}/prenatal-visits`);
}

export async function addPrenatalVisit(
  medicalRecordId: string,
  request: CreatePrenatalVisitRequest,
): Promise<PrenatalVisitDto> {
  return apiPost<PrenatalVisitDto>(`/medical-records/${medicalRecordId}/prenatal-visits`, request);
}
