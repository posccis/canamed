import { apiGet, apiPost, apiPut } from '../../api/client';

// ==========================================
// SPEC-0019: Fechamento de Caixa & Conferência
// ==========================================

export interface CashMovementDto {
  id: string;
  movementType: 'sangria' | 'suprimento';
  amount: number;
  reason: string;
  performedByUserId: string;
  createdAt: string;
}

export interface CashSessionDto {
  id: string;
  clinicId: string;
  operatorUserId: string;
  operatorName: string;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  initialFloat: number;
  totalCashExpected: number;
  totalPixExpected: number;
  totalDebitExpected: number;
  totalCreditExpected: number;
  totalCashDeclared: number;
  totalPixDeclared: number;
  totalDebitDeclared: number;
  totalCreditDeclared: number;
  cashDifference: number;
  closingNotes?: string;
  movements: CashMovementDto[];
}

export interface OpenCashSessionRequest {
  clinicId: string;
  initialFloat: number;
}

export interface CashMovementRequest {
  amount: number;
  reason: string;
}

export interface CloseCashSessionRequest {
  cashDeclared: number;
  pixDeclared: number;
  debitDeclared: number;
  creditDeclared: number;
  notes?: string;
}

export function openCashSession(req: OpenCashSessionRequest, signal?: AbortSignal): Promise<CashSessionDto> {
  return apiPost<CashSessionDto>('/cash-register/sessions/open', req, signal);
}

export function getActiveCashSession(clinicId: string, signal?: AbortSignal): Promise<CashSessionDto | null> {
  return apiGet<CashSessionDto>(`/cash-register/sessions/active?clinicId=${encodeURIComponent(clinicId)}`, signal)
    .catch((err) => {
      if (err.status === 404) return null;
      throw err;
    });
}

export function registerSangria(
  id: string,
  clinicId: string,
  req: CashMovementRequest,
  signal?: AbortSignal
): Promise<CashSessionDto> {
  return apiPost<CashSessionDto>(
    `/cash-register/sessions/${encodeURIComponent(id)}/sangria?clinicId=${encodeURIComponent(clinicId)}`,
    req,
    signal
  );
}

export function registerSuprimento(
  id: string,
  clinicId: string,
  req: CashMovementRequest,
  signal?: AbortSignal
): Promise<CashSessionDto> {
  return apiPost<CashSessionDto>(
    `/cash-register/sessions/${encodeURIComponent(id)}/suprimento?clinicId=${encodeURIComponent(clinicId)}`,
    req,
    signal
  );
}

export function closeCashSession(
  id: string,
  clinicId: string,
  req: CloseCashSessionRequest,
  signal?: AbortSignal
): Promise<CashSessionDto> {
  return apiPost<CashSessionDto>(
    `/cash-register/sessions/${encodeURIComponent(id)}/close?clinicId=${encodeURIComponent(clinicId)}`,
    req,
    signal
  );
}

export function listCashSessions(
  clinicId: string,
  from?: string,
  to?: string,
  signal?: AbortSignal
): Promise<CashSessionDto[]> {
  const params = new URLSearchParams({ clinicId });
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  return apiGet<CashSessionDto[]>(`/cash-register/sessions?${params.toString()}`, signal);
}

// ==========================================
// SPEC-0020: Painel de Chamada para TV
// ==========================================

export interface QueueCallEventDto {
  id: string;
  clinicId: string;
  queueEntryId: string;
  ticketCode: string;
  patientName: string;
  roomName: string;
  professionalName: string;
  isPreferential: boolean;
  callCount: number;
  calledAt: string;
}

export interface TvDisplayStateDto {
  clinicId: string;
  activeCall: QueueCallEventDto | null;
  recentCalls: QueueCallEventDto[];
  serverTime: string;
}

export interface TriggerCallRequest {
  clinicId: string;
  queueEntryId: string;
  ticketCode: string;
  patientName: string;
  roomName: string;
  professionalName: string;
  isPreferential: boolean;
}

export function getTvDisplayState(clinicId: string, signal?: AbortSignal): Promise<TvDisplayStateDto> {
  return apiGet<TvDisplayStateDto>(`/tv-display/${encodeURIComponent(clinicId)}/state`, signal);
}

export function triggerTvCall(req: TriggerCallRequest, signal?: AbortSignal): Promise<QueueCallEventDto> {
  return apiPost<QueueCallEventDto>('/tv-display/trigger', req, signal);
}

export function recallTvCall(id: string, clinicId: string, signal?: AbortSignal): Promise<QueueCallEventDto> {
  return apiPost<QueueCallEventDto>(
    `/tv-display/recall/${encodeURIComponent(id)}?clinicId=${encodeURIComponent(clinicId)}`,
    undefined,
    signal
  );
}

// ==========================================
// SPEC-0021: Gestão Financeira & Repasses
// ==========================================

export interface PayoutContractDto {
  id: string;
  clinicId: string;
  professionalId: string;
  payoutType: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

export interface PayoutItemDto {
  id: string;
  appointmentId: string;
  patientName: string;
  consultationDate: string;
  grossAmount: number;
  clinicRetainedAmount: number;
  payoutAmount: number;
}

export interface PayoutBatchDto {
  id: string;
  clinicId: string;
  professionalId: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'settled';
  totalGross: number;
  totalClinicRetained: number;
  totalPayoutAmount: number;
  settledAt?: string;
  settlementNotes?: string;
  receiptReference?: string;
  items: PayoutItemDto[];
}

export interface FinancialTransactionDto {
  id: string;
  clinicId: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  competenceDate: string;
  status: 'pendente' | 'pago' | 'cancelado';
  paidAt?: string;
}

export interface FinancialSummaryDto {
  clinicId: string;
  periodStart: string;
  periodEnd: string;
  totalRevenue: number;
  totalExpenses: number;
  totalMedicalPayouts: number;
  netResult: number;
  transactions: FinancialTransactionDto[];
}

export interface UpsertPayoutContractRequest {
  clinicId: string;
  professionalId: string;
  payoutType: 'percentage' | 'fixed';
  value: number;
}

export interface GeneratePayoutBatchRequest {
  clinicId: string;
  professionalId: string;
  periodStart: string;
  periodEnd: string;
}

export interface SettlePayoutBatchRequest {
  receiptReference?: string;
  notes?: string;
}

export interface CreateTransactionRequest {
  clinicId: string;
  type: 'receita' | 'despesa';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  competenceDate: string;
  status: 'pendente' | 'pago';
}

export function getPayoutContract(
  clinicId: string,
  professionalId: string,
  signal?: AbortSignal
): Promise<PayoutContractDto | null> {
  return apiGet<PayoutContractDto>(
    `/financial/payout-contract?clinicId=${encodeURIComponent(clinicId)}&professionalId=${encodeURIComponent(professionalId)}`,
    signal
  ).catch((err) => {
    if (err.status === 404) return null;
    throw err;
  });
}

export function upsertPayoutContract(req: UpsertPayoutContractRequest, signal?: AbortSignal): Promise<PayoutContractDto> {
  return apiPost<PayoutContractDto>('/financial/payout-contract', req, signal);
}

export function generatePayoutBatch(req: GeneratePayoutBatchRequest, signal?: AbortSignal): Promise<PayoutBatchDto> {
  return apiPost<PayoutBatchDto>('/financial/payout-batches/generate', req, signal);
}

export function settlePayoutBatch(
  id: string,
  clinicId: string,
  req: SettlePayoutBatchRequest,
  signal?: AbortSignal
): Promise<PayoutBatchDto> {
  return apiPost<PayoutBatchDto>(
    `/financial/payout-batches/${encodeURIComponent(id)}/settle?clinicId=${encodeURIComponent(clinicId)}`,
    req,
    signal
  );
}

export function listPayoutBatches(
  clinicId: string,
  professionalId?: string,
  signal?: AbortSignal
): Promise<PayoutBatchDto[]> {
  const params = new URLSearchParams({ clinicId });
  if (professionalId) params.append('professionalId', professionalId);
  return apiGet<PayoutBatchDto[]>(`/financial/payout-batches?${params.toString()}`, signal);
}

export function createFinancialTransaction(
  req: CreateTransactionRequest,
  signal?: AbortSignal
): Promise<FinancialTransactionDto> {
  return apiPost<FinancialTransactionDto>('/financial/transactions', req, signal);
}

export function getFinancialSummary(
  clinicId: string,
  from: string,
  to: string,
  signal?: AbortSignal
): Promise<FinancialSummaryDto> {
  const params = new URLSearchParams({ clinicId, from, to });
  return apiGet<FinancialSummaryDto>(`/financial/summary?${params.toString()}`, signal);
}

// ==========================================
// SPEC-0022: Gestão de Insumos & Materiais
// ==========================================

export interface InventoryItemDto {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minimumQuantity: number;
  lotNumber?: string;
  expirationDate?: string;
  isBelowMinimum: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface InventoryMovementDto {
  id: string;
  inventoryItemId: string;
  clinicId: string;
  movementType: 'entry' | 'exit';
  quantity: number;
  unitPrice?: number;
  reason: string;
  performedByUserId: string;
  createdAt: string;
}

export interface InventoryAlertsDto {
  clinicId: string;
  belowMinimum: InventoryItemDto[];
  expiringSoon: InventoryItemDto[];
  expired: InventoryItemDto[];
}

export interface CreateInventoryItemRequest {
  clinicId: string;
  name: string;
  category: string;
  unit: string;
  initialQuantity: number;
  minimumQuantity: number;
  lotNumber?: string;
  expirationDate?: string;
}

export interface UpdateInventoryItemRequest {
  name: string;
  category: string;
  unit: string;
  minimumQuantity: number;
  lotNumber?: string;
  expirationDate?: string;
}

export interface InventoryMovementRequest {
  quantity: number;
  unitPrice?: number;
  reason: string;
}

export function listInventoryItems(
  clinicId: string,
  category?: string,
  search?: string,
  signal?: AbortSignal
): Promise<InventoryItemDto[]> {
  const params = new URLSearchParams({ clinicId });
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  return apiGet<InventoryItemDto[]>(`/inventory?${params.toString()}`, signal);
}

export function createInventoryItem(req: CreateInventoryItemRequest, signal?: AbortSignal): Promise<InventoryItemDto> {
  return apiPost<InventoryItemDto>('/inventory', req, signal);
}

export function updateInventoryItem(
  id: string,
  clinicId: string,
  req: UpdateInventoryItemRequest,
  signal?: AbortSignal
): Promise<InventoryItemDto> {
  return apiPut<InventoryItemDto>(`/inventory/${encodeURIComponent(id)}?clinicId=${encodeURIComponent(clinicId)}`, req, signal);
}

export function registerInventoryEntry(
  id: string,
  clinicId: string,
  req: InventoryMovementRequest,
  signal?: AbortSignal
): Promise<InventoryItemDto> {
  return apiPost<InventoryItemDto>(
    `/inventory/${encodeURIComponent(id)}/entry?clinicId=${encodeURIComponent(clinicId)}`,
    req,
    signal
  );
}

export function registerInventoryExit(
  id: string,
  clinicId: string,
  req: InventoryMovementRequest,
  signal?: AbortSignal
): Promise<InventoryItemDto> {
  return apiPost<InventoryItemDto>(
    `/inventory/${encodeURIComponent(id)}/exit?clinicId=${encodeURIComponent(clinicId)}`,
    req,
    signal
  );
}

export function getInventoryAlerts(clinicId: string, signal?: AbortSignal): Promise<InventoryAlertsDto> {
  return apiGet<InventoryAlertsDto>(`/inventory/alerts?clinicId=${encodeURIComponent(clinicId)}`, signal);
}

// ==========================================
// SPEC-0023: Painel DPO & Governança LGPD
// ==========================================

export interface DpoRequestItemDto {
  id: string;
  protocol: string;
  clinicId: string;
  patientId: string;
  requestType: string;
  details?: string;
  status: 'pending' | 'completed' | 'rejected';
  responseNotes?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  remainingDays: number;
  urgencyLevel: 'normal' | 'warning' | 'critical' | 'overdue';
}

export interface RopaActivityDto {
  processName: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string;
  retentionPeriod: string;
  securityMeasures: string;
}

export interface DpoOverviewDto {
  clinicId: string;
  totalPendingRequests: number;
  overdueRequests: number;
  requests: DpoRequestItemDto[];
  ropaActivities: RopaActivityDto[];
}

export function getDpoOverview(clinicId: string, signal?: AbortSignal): Promise<DpoOverviewDto> {
  return apiGet<DpoOverviewDto>(`/dpo/overview?clinicId=${encodeURIComponent(clinicId)}`, signal);
}

export function processDpoRequest(
  id: string,
  clinicId: string,
  status: 'completed' | 'rejected',
  responseNotes: string,
  signal?: AbortSignal
): Promise<DpoRequestItemDto> {
  return apiPost<DpoRequestItemDto>(
    `/dpo/requests/${encodeURIComponent(id)}/process`,
    { requestId: id, clinicId, status, responseNotes },
    signal
  );
}

// ==========================================
// SPEC-0025: Políticas de Agendamento
// ==========================================

export interface ClinicPolicyDto {
  id: string;
  clinicId: string;
  maxDailyOverbookingPerDoctor: number;
  minHoursNoticeForOnlineBooking: number;
  minHoursNoticeForFreeCancellation: number;
}

export interface UpdateClinicPolicyRequest {
  maxDailyOverbookingPerDoctor: number;
  minHoursNoticeForOnlineBooking: number;
  minHoursNoticeForFreeCancellation: number;
}

export interface OverbookingCheckResult {
  allowed: boolean;
  current: number;
  max: number;
  message: string;
}

export function getClinicPolicy(clinicId: string, signal?: AbortSignal): Promise<ClinicPolicyDto> {
  return apiGet<ClinicPolicyDto>(`/clinics/${encodeURIComponent(clinicId)}/policies`, signal);
}

export function updateClinicPolicy(
  clinicId: string,
  req: UpdateClinicPolicyRequest,
  signal?: AbortSignal
): Promise<ClinicPolicyDto> {
  return apiPut<ClinicPolicyDto>(`/clinics/${encodeURIComponent(clinicId)}/policies`, req, signal);
}

export function checkOverbookingQuota(
  clinicId: string,
  professionalId: string,
  targetDate: string,
  signal?: AbortSignal
): Promise<OverbookingCheckResult> {
  const params = new URLSearchParams({
    professionalId,
    targetDate,
  });
  return apiGet<OverbookingCheckResult>(
    `/clinics/${encodeURIComponent(clinicId)}/policies/overbooking-check?${params.toString()}`,
    signal
  );
}
