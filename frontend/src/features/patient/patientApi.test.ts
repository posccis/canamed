import { beforeEach, describe, expect, it, vi } from 'vitest';
import { patientApi } from './patientApi';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
}));

describe('patientApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('solicita OTP de autenticação corretamente', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      message: 'Código enviado',
      retryAfterSeconds: 60,
    });

    const res = await patientApi.requestOtp('81999998888', '12345678901');

    expect(mocks.apiPost).toHaveBeenCalledWith('/portal/auth/request-otp', {
      phone: '81999998888',
      cpf: '12345678901',
    });
    expect(res.success).toBe(true);
  });

  it('verifica OTP e recebe token de sessão', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      sessionToken: 'test-token',
      patientId: 'pat-1',
      patientName: 'Maria Silva',
    });

    const res = await patientApi.verifyOtp('81999998888', '12345678901', '123456');

    expect(mocks.apiPost).toHaveBeenCalledWith('/portal/auth/verify-otp', {
      phone: '81999998888',
      cpf: '12345678901',
      code: '123456',
    });
    expect(res.sessionToken).toBe('test-token');
  });

  it('busca slots disponíveis para agendamento online', async () => {
    mocks.apiGet.mockResolvedValueOnce([]);

    await patientApi.getAvailableSlots('clinic-1', 'spec-1', '2026-10-05', 'doc-1');

    expect(mocks.apiGet).toHaveBeenCalledWith(
      '/portal/available-slots?clinicId=clinic-1&specialtyId=spec-1&date=2026-10-05&professionalId=doc-1'
    );
  });

  it('realiza check-in no totem de autoatendimento', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      ticketCode: 'N-001',
      status: 'waiting',
    });

    const res = await patientApi.kioskCheckIn('appt-1', 'clinic-1', false);

    expect(mocks.apiPost).toHaveBeenCalledWith('/kiosk/check-in', {
      appointmentId: 'appt-1',
      clinicId: 'clinic-1',
      isPreferential: false,
      origin: 'kiosk',
    });
    expect(res.ticketCode).toBe('N-001');
  });

  it('exporta dados do paciente conforme LGPD com header X-Patient-Token', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      patientId: 'pat-1',
      name: 'Maria Silva',
      appointments: [],
      legalRetentionNotice: 'Art. 16 LGPD',
    });

    const res = await patientApi.exportMyData('token-xyz');

    expect(mocks.apiGet).toHaveBeenCalledWith(
      '/privacy/my-data',
      undefined,
      { 'X-Patient-Token': 'token-xyz' }
    );
    expect(res.name).toBe('Maria Silva');
  });

  it('realiza agendamento avulso sem conta via bookGuestAppointment com dados de triagem', async () => {
    mocks.apiPost.mockResolvedValueOnce({
      appointmentId: 'appt-guest-123',
      startsAt: '2026-10-28T15:00:00Z',
      doctorName: 'Dra. Camila Santos',
      meetUrl: 'https://meet.canamed.com.br/sala/appt-guest-123',
    });

    const payload = {
      clinicId: 'clinic-1',
      professionalId: 'doc-1',
      startsAt: '2026-10-28T15:00:00Z',
      patientName: 'Juliana Silva',
      cpf: '123.456.789-00',
      phone: '(11) 99999-8888',
      birthDate: '1995-03-20',
      symptoms: 'Náuseas e tontura',
      allergies: 'Dipirona',
      isPregnant: true,
      wantsInvoice: true,
    };

    const res = await patientApi.bookGuestAppointment(payload);

    expect(mocks.apiPost).toHaveBeenCalledWith('/portal/appointments/book-guest', payload);
    expect(res.appointmentId).toBe('appt-guest-123');
    expect(res.doctorName).toBe('Dra. Camila Santos');
  });

  it('busca resumo do acompanhamento pré-natal com DUM, DPP e flag de Rh negativo', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      patientId: 'pat-1',
      patientName: 'Juliana Silva',
      lastMenstrualPeriod: '2026-04-15',
      estimatedDueDate: '2027-01-20',
      currentGestationalWeeks: 28,
      currentGestationalDays: 0,
      isRhNegative: true,
      bloodType: 'A',
      rhFactor: 'Negativo',
      fetalMilestoneName: 'Berinjela 🍆',
      visits: [
        {
          id: 'v-1',
          visitDate: '2026-10-20',
          gestationalWeeks: 28,
          gestationalDays: 0,
          bloodPressure: '120/80',
          fetalHeartRateBpm: 140,
          uterineHeightCm: 27,
          weightKg: 68.5,
        },
      ],
    });

    const res = await patientApi.getPrenatalSummary('token-juliana');

    expect(mocks.apiGet).toHaveBeenCalledWith(
      '/portal/prenatal/summary',
      undefined,
      { 'X-Patient-Token': 'token-juliana' }
    );
    expect(res.lastMenstrualPeriod).toBe('2026-04-15');
    expect(res.isRhNegative).toBe(true);
    expect(res.visits[0].gestationalWeeks).toBe(28);
  });

  it('baixa o Cartão da Gestante Oficial em PDF', async () => {
    mocks.apiGet.mockResolvedValueOnce(new Blob(['%PDF-1.4...']));

    const res = await patientApi.downloadPrenatalCardPdf('token-juliana');

    expect(mocks.apiGet).toHaveBeenCalledWith(
      '/portal/prenatal/card/pdf',
      undefined,
      { 'X-Patient-Token': 'token-juliana' }
    );
    expect(res).toBeDefined();
  });
});
