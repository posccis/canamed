import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from './adminApi';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPut: mocks.apiPut,
}));

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SPEC-0019: Cash Register', () => {
    it('abre sessão de caixa', async () => {
      mocks.apiPost.mockResolvedValueOnce({ id: 'sess-1', status: 'open' });
      const res = await adminApi.openCashSession({ clinicId: 'c-1', initialFloat: 150 });
      expect(mocks.apiPost).toHaveBeenCalledWith('/cash-register/sessions/open', { clinicId: 'c-1', initialFloat: 150 }, undefined);
      expect(res.status).toBe('open');
    });

    it('busca sessão ativa retornando null em caso de 404', async () => {
      mocks.apiGet.mockRejectedValueOnce({ status: 404 });
      const res = await adminApi.getActiveCashSession('c-1');
      expect(res).toBeNull();
    });

    it('registra sangria e suprimento', async () => {
      mocks.apiPost.mockResolvedValueOnce({ id: 'sess-1' });
      await adminApi.registerSangria('sess-1', 'c-1', { amount: 50, reason: 'Cofre' });
      expect(mocks.apiPost).toHaveBeenCalledWith('/cash-register/sessions/sess-1/sangria?clinicId=c-1', { amount: 50, reason: 'Cofre' }, undefined);

      mocks.apiPost.mockResolvedValueOnce({ id: 'sess-1' });
      await adminApi.registerSuprimento('sess-1', 'c-1', { amount: 30, reason: 'Troco' });
      expect(mocks.apiPost).toHaveBeenCalledWith('/cash-register/sessions/sess-1/suprimento?clinicId=c-1', { amount: 30, reason: 'Troco' }, undefined);
    });

    it('encerra sessão de caixa', async () => {
      mocks.apiPost.mockResolvedValueOnce({ id: 'sess-1', status: 'closed' });
      const res = await adminApi.closeCashSession('sess-1', 'c-1', {
        cashDeclared: 200,
        pixDeclared: 150,
        debitDeclared: 80,
        creditDeclared: 100,
      });
      expect(res.status).toBe('closed');
    });
  });

  describe('SPEC-0020: TV Display', () => {
    it('obtém estado do painel de TV', async () => {
      mocks.apiGet.mockResolvedValueOnce({ clinicId: 'c-1', activeCall: null, recentCalls: [] });
      const res = await adminApi.getTvDisplayState('c-1');
      expect(mocks.apiGet).toHaveBeenCalledWith('/tv-display/c-1/state', undefined);
      expect(res.clinicId).toBe('c-1');
    });

    it('dispara chamada no painel de TV', async () => {
      mocks.apiPost.mockResolvedValueOnce({ id: 'call-1', ticketCode: 'N-001' });
      const res = await adminApi.triggerTvCall({
        clinicId: 'c-1',
        queueEntryId: 'q-1',
        ticketCode: 'N-001',
        patientName: 'Maria Silva',
        roomName: 'Consultório 01',
        professionalName: 'Dr. Lucas',
        isPreferential: false,
      });
      expect(res.ticketCode).toBe('N-001');
    });
  });

  describe('SPEC-0021: Financial & Payouts', () => {
    it('gerencia contrato de repasse', async () => {
      mocks.apiGet.mockResolvedValueOnce({ payoutType: 'percentage', value: 70 });
      const contract = await adminApi.getPayoutContract('c-1', 'doc-1');
      expect(contract?.payoutType).toBe('percentage');

      mocks.apiPost.mockResolvedValueOnce({ payoutType: 'fixed', value: 120 });
      const updated = await adminApi.upsertPayoutContract({
        clinicId: 'c-1',
        professionalId: 'doc-1',
        payoutType: 'fixed',
        value: 120,
      });
      expect(updated.value).toBe(120);
    });

    it('gera e quita lote de repasse', async () => {
      mocks.apiPost.mockResolvedValueOnce({ id: 'batch-1', status: 'draft' });
      const batch = await adminApi.generatePayoutBatch({
        clinicId: 'c-1',
        professionalId: 'doc-1',
        periodStart: '2026-10-01T00:00:00Z',
        periodEnd: '2026-10-15T23:59:59Z',
      });
      expect(batch.id).toBe('batch-1');

      mocks.apiPost.mockResolvedValueOnce({ id: 'batch-1', status: 'settled' });
      const settled = await adminApi.settlePayoutBatch('batch-1', 'c-1', {
        receiptReference: 'PIX-123456',
      });
      expect(settled.status).toBe('settled');
    });

    it('cria transação financeira e busca sumário DRE', async () => {
      mocks.apiPost.mockResolvedValueOnce({ id: 'tx-1', amount: 500 });
      await adminApi.createFinancialTransaction({
        clinicId: 'c-1',
        type: 'despesa',
        category: 'Aluguel',
        description: 'Aluguel outubro',
        amount: 500,
        dueDate: '2026-10-10T00:00:00Z',
        competenceDate: '2026-10-10T00:00:00Z',
        status: 'pago',
      });

      mocks.apiGet.mockResolvedValueOnce({ netResult: 1500 });
      const sum = await adminApi.getFinancialSummary('c-1', '2026-10-01', '2026-10-31');
      expect(sum.netResult).toBe(1500);
    });
  });

  describe('SPEC-0022: Inventory', () => {
    it('lista insumos e cadastra novo item', async () => {
      mocks.apiGet.mockResolvedValueOnce([{ id: 'inv-1', name: 'Luvas' }]);
      const list = await adminApi.listInventoryItems('c-1');
      expect(list).toHaveLength(1);

      mocks.apiPost.mockResolvedValueOnce({ id: 'inv-2', name: 'Seringas' });
      const created = await adminApi.createInventoryItem({
        clinicId: 'c-1',
        name: 'Seringas',
        category: 'Materiais Descartáveis',
        unit: 'caixa',
        initialQuantity: 20,
        minimumQuantity: 5,
      });
      expect(created.name).toBe('Seringas');
    });

    it('registra entrada, saída e busca alertas', async () => {
      mocks.apiPost.mockResolvedValueOnce({ currentQuantity: 25 });
      await adminApi.registerInventoryEntry('inv-1', 'c-1', { quantity: 5, reason: 'Compra' });
      expect(mocks.apiPost).toHaveBeenCalledWith('/inventory/inv-1/entry?clinicId=c-1', { quantity: 5, reason: 'Compra' }, undefined);

      mocks.apiPost.mockResolvedValueOnce({ currentQuantity: 23 });
      await adminApi.registerInventoryExit('inv-1', 'c-1', { quantity: 2, reason: 'Uso' });
      expect(mocks.apiPost).toHaveBeenCalledWith('/inventory/inv-1/exit?clinicId=c-1', { quantity: 2, reason: 'Uso' }, undefined);

      mocks.apiGet.mockResolvedValueOnce({ belowMinimum: [], expiringSoon: [], expired: [] });
      const alerts = await adminApi.getInventoryAlerts('c-1');
      expect(alerts.belowMinimum).toEqual([]);
    });
  });

  describe('SPEC-0023: DPO Governance', () => {
    it('busca overview DPO e processa solicitação', async () => {
      mocks.apiGet.mockResolvedValueOnce({
        totalPendingRequests: 1,
        overdueRequests: 0,
        requests: [],
        ropaActivities: [],
      });
      const overview = await adminApi.getDpoOverview('c-1');
      expect(overview.totalPendingRequests).toBe(1);

      mocks.apiPost.mockResolvedValueOnce({ id: 'req-1', status: 'completed' });
      const res = await adminApi.processDpoRequest('req-1', 'c-1', 'completed', 'Pedido atendido com sucesso');
      expect(res.status).toBe('completed');
    });
  });

  describe('SPEC-0025: Clinic Policies', () => {
    it('obtém e atualiza políticas da clínica', async () => {
      mocks.apiGet.mockResolvedValueOnce({ maxDailyOverbookingPerDoctor: 2 });
      const policy = await adminApi.getClinicPolicy('c-1');
      expect(policy.maxDailyOverbookingPerDoctor).toBe(2);

      mocks.apiPut.mockResolvedValueOnce({ maxDailyOverbookingPerDoctor: 4 });
      const updated = await adminApi.updateClinicPolicy('c-1', {
        maxDailyOverbookingPerDoctor: 4,
        minHoursNoticeForOnlineBooking: 2,
        minHoursNoticeForFreeCancellation: 4,
      });
      expect(updated.maxDailyOverbookingPerDoctor).toBe(4);
    });

    it('verifica cota de overbooking para médico', async () => {
      mocks.apiGet.mockResolvedValueOnce({ allowed: true, current: 1, max: 3 });
      const check = await adminApi.checkOverbookingQuota('c-1', 'doc-1', '2026-10-10');
      expect(check.allowed).toBe(true);
      expect(check.max).toBe(3);
    });
  });
});
