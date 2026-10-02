import { apiGet, apiPost } from '../../api/client';

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_debito'
  | 'cartao_credito'
  | 'convenio_faturado';

export interface RecordPaymentRequest {
  appointmentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardBrand?: string;
  cardLastFourDigits?: string;
  notes?: string;
}

export interface RefundPaymentRequest {
  reason: string;
}

export interface PaymentTransactionResponse {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: 'pago' | 'estornado';
  cardBrand?: string;
  cardLastFourDigits?: string;
  paidAt: string;
  operatorId: string;
  notes?: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface DailyPaymentSummaryResponse {
  date: string;
  totalReceived: number;
  cashTotal: number;
  pixTotal: number;
  debitCardTotal: number;
  creditCardTotal: number;
  healthPlanBilledTotal: number;
  transactionCount: number;
  refundCount: number;
}

export async function recordPayment(request: RecordPaymentRequest, signal?: AbortSignal): Promise<PaymentTransactionResponse> {
  return apiPost<PaymentTransactionResponse>('/api/v1/payments', request, signal);
}

export async function refundPayment(paymentId: string, request: RefundPaymentRequest, signal?: AbortSignal): Promise<PaymentTransactionResponse> {
  return apiPost<PaymentTransactionResponse>(`/api/v1/payments/${paymentId}/refund`, request, signal);
}

export async function listPaymentsByAppointment(appointmentId: string, signal?: AbortSignal): Promise<PaymentTransactionResponse[]> {
  return apiGet<PaymentTransactionResponse[]>(`/api/v1/payments/appointment/${appointmentId}`, signal);
}

export async function getDailyPaymentSummary(date?: string, signal?: AbortSignal): Promise<DailyPaymentSummaryResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiGet<DailyPaymentSummaryResponse>(`/api/v1/payments/summary${query}`, signal);
}
