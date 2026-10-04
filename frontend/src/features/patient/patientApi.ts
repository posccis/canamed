import { apiGet, apiPost } from '../../api/client';

export interface PatientSession {
  token: string;
  patientId: string;
  patientName: string;
}

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  retryAfterSeconds: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  sessionToken?: string;
  patientId?: string;
  patientName?: string;
  errorMessage?: string;
}

export interface PublicSlot {
  professionalId: string;
  professionalName: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
}

export interface BookOnlineRequest {
  clinicId: string;
  professionalId: string;
  specialtyId: string;
  appointmentTypeId: string;
  startsAt: string;
  notes?: string;
}

export interface OnlineAppointment {
  id: string;
  clinicId: string;
  professionalId: string;
  professionalName: string;
  specialtyName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  paymentStatus: string;
}

export interface KioskSearchResult {
  appointmentId: string;
  patientId: string;
  maskedName: string;
  maskedCpf: string;
  professionalId: string;
  professionalName: string;
  scheduledTime: string;
  serviceType: string;
  allowedCheckIn: boolean;
  disallowReason?: string;
}

export interface KioskCheckInResult {
  queueEntryId: string;
  ticketCode: string;
  priority: string;
  status: string;
  positionInQueue: number;
  patientName: string;
  professionalName: string;
  arrivedAt: string;
}

export interface KioskTicketStatus {
  ticketCode: string;
  status: string;
  aheadInQueueCount: number;
  estimatedWaitMinutes: number;
  calledToRoom?: string;
}

export interface PrivacyRequestResult {
  id: string;
  protocol: string;
  clinicId: string;
  patientId: string;
  requestType: string;
  details?: string;
  status: string;
  responseNotes?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

export interface PatientDataExport {
  patientId: string;
  name: string;
  document?: string;
  phone: string;
  email?: string;
  birthDate?: string;
  createdAt: string;
  appointments: Array<{
    id: string;
    startsAt: string;
    status: string;
    professionalName: string;
  }>;
  legalRetentionNotice: string;
}

export interface PrivacyConsentItem {
  id: string;
  consentType: string;
  policyVersion: string;
  isGranted: boolean;
  grantedAt: string;
}

export interface MedicalDocumentItem {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  documentType: string;
  status: string;
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

export interface PortalMetaResponse {
  clinicId: string;
  clinicName: string;
  clinicSlug?: string;
  helpPhone?: string;
  specialties: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string; specialtyId: string }>;
  appointmentTypes?: Array<{ id: string; name: string; durationMinutes: number }>;
}

/** Metadados públicos resolvidos pelo slug da clínica (SPEC-0026/RN-003). */
export interface PublicClinicMeta {
  clinicId: string;
  slug: string;
  name: string;
  publicName: string;
  helpPhone?: string;
  allowWaitlist: boolean;
  allowSelfReschedule: boolean;
  specialties: Array<{ id: string; name: string }>;
  professionals: Array<{ id: string; name: string; specialtyId: string }>;
  appointmentTypes: Array<{ id: string; name: string; durationMinutes: number }>;
}

/** Escopos de token de capacidade (SPEC-0026/RN-004). */
export type CapabilityScope =
  | 'confirm'
  | 'cancel'
  | 'reschedule'
  | 'check_in'
  | 'queue'
  | 'registration'
  | 'document'
  | 'waitlist_offer';

/** Dados mínimos e mascarados devolvidos ao abrir um link tokenizado. */
export interface CapabilitySummary {
  scope: CapabilityScope;
  status: string;
  clinicId: string;
  clinicSlug: string;
  clinicName: string;
  patientNameMasked?: string;
  expiresAt: string;
  appointment?: {
    startsAt: string;
    professionalName: string;
    specialtyName: string;
    status: string;
  };
  ticketCode?: string;
  documentType?: string;
}

/** Etapa do atendimento exibida ao paciente (SPEC-0026/9.3). */
export interface PatientQueueStatus {
  ticketCode: string;
  stage: string;
  stageLabel: string;
  message: string;
  positionInQueue: number;
  estimatedWaitMinutes: number;
  professionalName?: string;
  roomName?: string;
  updatedAt: string;
}

export interface CheckInByTokenResult {
  ticketCode: string;
  priority: string;
  positionInQueue: number;
  professionalName: string;
  queueToken?: string;
}

/** Resultado público da validação de um documento clínico (SPEC-0016). */
export interface PublicDocumentValidation {
  isValid: boolean;
  status: string;
  documentType: string;
  issuedAt?: string;
  doctorName: string;
  clinicName: string;
  patientInitials: string;
  cancellationReason?: string;
}

export const patientApi = {
  // Metadados públicos (Clínica, Especialidades, Médicos)
  getPortalMeta: () => apiGet<PortalMetaResponse>('/portal/meta'),

  // SPEC-0026: resolução da clínica pelo slug e links tokenizados
  getClinicBySlug: (slug: string) =>
    apiGet<PublicClinicMeta>(`/public/clinics/${encodeURIComponent(slug)}/meta`),

  resolveCapability: (token: string) =>
    apiGet<CapabilitySummary>(`/public/capabilities/${encodeURIComponent(token)}`),

  confirmByToken: (token: string) =>
    apiPost<{ message: string }>(`/public/capabilities/${encodeURIComponent(token)}/confirm`),

  cancelByToken: (token: string, reason: string, answer: string) =>
    apiPost<{ message: string }>(`/public/capabilities/${encodeURIComponent(token)}/cancel`, {
      reason,
      answer,
    }),

  checkInByToken: (token: string, isPreferential: boolean) =>
    apiPost<CheckInByTokenResult>(`/public/check-in/${encodeURIComponent(token)}`, {
      isPreferential,
    }),

  getQueueByToken: (token: string) =>
    apiGet<PatientQueueStatus>(`/public/capabilities/${encodeURIComponent(token)}/queue`),

  validatePublicDocument: (publicToken: string) =>
    apiGet<PublicDocumentValidation>(
      `/medical-documents/public/validate-document/${encodeURIComponent(publicToken)}`,
    ),

  // SPEC-0015: Portal do Paciente & Agendamento Online
  requestOtp: (phone: string, cpf: string) =>
    apiPost<RequestOtpResponse>('/portal/auth/request-otp', { phone, cpf }),

  verifyOtp: (phone: string, cpf: string, code: string, clinicId?: string) =>
    apiPost<VerifyOtpResponse>('/portal/auth/verify-otp', { phone, cpf, code, clinicId }),

  getAvailableSlots: (clinicId: string, specialtyId: string, date: string, professionalId?: string) => {
    const params = new URLSearchParams({ clinicId, specialtyId, date });
    if (professionalId) params.append('professionalId', professionalId);
    return apiGet<PublicSlot[]>(`/portal/available-slots?${params.toString()}`);
  },

  bookAppointment: (sessionToken: string, req: BookOnlineRequest) =>
    apiPost<OnlineAppointment>('/portal/appointments/book', req, undefined, { 'X-Patient-Token': sessionToken }),

  getMyAppointments: (sessionToken: string) =>
    apiGet<OnlineAppointment[]>('/portal/appointments/my', undefined, { 'X-Patient-Token': sessionToken }),

  cancelMyAppointment: (sessionToken: string, appointmentId: string, reason: string) =>
    apiPost<{ message: string }>(`/portal/appointments/${appointmentId}/cancel`, { reason }, undefined, {
      'X-Patient-Token': sessionToken,
    }),

  // SPEC-0016: Carteira Digital de Documentos
  getMyDocuments: (sessionToken: string) =>
    apiGet<MedicalDocumentItem[]>('/portal/documents/my', undefined, { 'X-Patient-Token': sessionToken }),

  unlockPublicDocument: (publicToken: string, answer: string) =>
    apiPost<MedicalDocumentItem>(`/medical-documents/public/validate-document/${publicToken}/unlock`, { answer }),

  // SPEC-0017: Totem e Check-in Autônomo
  kioskSearch: (clinicId: string, q: string) =>
    apiGet<KioskSearchResult[]>(`/kiosk/${clinicId}/search?q=${encodeURIComponent(q)}`),

  kioskCheckIn: (appointmentId: string, clinicId: string, isPreferential: boolean, origin: string = 'kiosk') =>
    apiPost<KioskCheckInResult>('/kiosk/check-in', { appointmentId, clinicId, isPreferential, origin }),

  kioskTicketStatus: (clinicId: string, ticketCode: string) =>
    apiGet<KioskTicketStatus>(`/kiosk/${clinicId}/tickets/${encodeURIComponent(ticketCode)}/status`),

  // SPEC-0018: Autonomia e Privacidade (LGPD)
  openPrivacyRequest: (sessionToken: string, clinicId: string, requestType: string, details?: string) =>
    apiPost<PrivacyRequestResult>(
      '/privacy/requests',
      { clinicId, requestType, details },
      undefined,
      { 'X-Patient-Token': sessionToken },
    ),

  getPrivacyRequestStatus: (protocol: string) =>
    apiGet<PrivacyRequestResult>(`/privacy/requests/protocol/${encodeURIComponent(protocol)}`),

  exportMyData: (sessionToken: string) =>
    apiGet<PatientDataExport>('/privacy/my-data', undefined, { 'X-Patient-Token': sessionToken }),

  getConsents: (sessionToken: string) =>
    apiGet<PrivacyConsentItem[]>('/privacy/consents', undefined, { 'X-Patient-Token': sessionToken }),

  updateConsent: (sessionToken: string, consentType: string, isGranted: boolean) =>
    apiPost<{ message: string }>(
      '/privacy/consents',
      { consentType, isGranted },
      undefined,
      { 'X-Patient-Token': sessionToken },
    ),

  // SPEC-0014: Processamento de lembretes e testes
  processReminders: (clinicId: string) =>
    apiPost<{ processedCount: number; sentCount: number; skippedOptOutCount: number; failedCount: number }>(
      `/notifications/process-reminders?clinicId=${clinicId}`,
    ),
};
