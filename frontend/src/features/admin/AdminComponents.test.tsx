import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../layout/Toast';
import { CashRegisterPanel } from './CashRegisterPanel';
import { TvDisplay } from './TvDisplay';
import { FinancialPanel } from './FinancialPanel';
import { InventoryPanel } from './InventoryPanel';
import { DpoWorkspace } from './DpoWorkspace';
import { ClinicPolicyPanel } from './ClinicPolicyPanel';

const adminApiMocks = vi.hoisted(() => ({
  getActiveCashSession: vi.fn(),
  listCashSessions: vi.fn(),
  getTvDisplayState: vi.fn(),
  getPayoutContract: vi.fn(),
  listPayoutBatches: vi.fn(),
  getFinancialSummary: vi.fn(),
  listInventoryItems: vi.fn(),
  getInventoryAlerts: vi.fn(),
  getDpoOverview: vi.fn(),
  getClinicPolicy: vi.fn(),
  checkOverbookingQuota: vi.fn(),
}));

vi.mock('./adminApi', () => ({
  getActiveCashSession: adminApiMocks.getActiveCashSession,
  listCashSessions: adminApiMocks.listCashSessions,
  getTvDisplayState: adminApiMocks.getTvDisplayState,
  getPayoutContract: adminApiMocks.getPayoutContract,
  listPayoutBatches: adminApiMocks.listPayoutBatches,
  getFinancialSummary: adminApiMocks.getFinancialSummary,
  listInventoryItems: adminApiMocks.listInventoryItems,
  getInventoryAlerts: adminApiMocks.getInventoryAlerts,
  getDpoOverview: adminApiMocks.getDpoOverview,
  getClinicPolicy: adminApiMocks.getClinicPolicy,
  checkOverbookingQuota: adminApiMocks.checkOverbookingQuota,
}));

vi.mock('../auth/useSession', () => ({
  useSession: () => ({
    state: {
      status: 'authenticated',
      session: {
        userId: 'u-1',
        clinicId: 'c-1',
        clinicName: 'Clínica CanaMed Recife',
        role: 'gestor',
        permissions: ['cashier:manage', 'financial:admin', 'inventory:manage', 'dpo:manage', 'policy:manage'],
      },
    },
    reload: vi.fn(),
    end: vi.fn(),
  }),
}));

vi.mock('../auth/authApi', () => ({
  fetchUsers: vi.fn().mockResolvedValue([
    {
      id: 'doc-1',
      name: 'Dr. Roberto Freire',
      email: 'roberto@canamed.com.br',
      role: 'profissional',
      isActive: true,
    },
  ]),
}));

describe('Admin Feature Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CashRegisterPanel (SPEC-0019)', () => {
    it('renderiza tela de abertura quando caixa está fechado', async () => {
      adminApiMocks.getActiveCashSession.mockResolvedValueOnce(null);
      adminApiMocks.listCashSessions.mockResolvedValueOnce([]);

      render(
        <ToastProvider>
          <CashRegisterPanel />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Frente de Caixa & Conferência')).toBeInTheDocument();
        expect(screen.getByText(/Nenhum caixa aberto para seu usuário/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Abrir Turno de Caixa/i })).toBeInTheDocument();
      });
    });

    it('renderiza totais e ações quando o caixa está aberto', async () => {
      adminApiMocks.getActiveCashSession.mockResolvedValueOnce({
        id: 'sess-1',
        clinicId: 'c-1',
        operatorUserId: 'u-1',
        operatorName: 'Victor Gestor',
        openedAt: new Date().toISOString(),
        status: 'open',
        initialFloat: 100,
        totalCashExpected: 350,
        totalPixExpected: 200,
        totalDebitExpected: 150,
        totalCreditExpected: 0,
        totalCashDeclared: 0,
        totalPixDeclared: 0,
        totalDebitDeclared: 0,
        totalCreditDeclared: 0,
        cashDifference: 0,
        movements: [],
      });
      adminApiMocks.listCashSessions.mockResolvedValueOnce([]);

      render(
        <ToastProvider>
          <CashRegisterPanel />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/CAIXA ABERTO/i)).toBeInTheDocument();
        expect(screen.getByText('Operador: Victor Gestor')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Encerrar Caixa/i })).toBeInTheDocument();
      });
    });
  });

  describe('TvDisplay (SPEC-0020)', () => {
    it('renderiza o painel de TV com ticket ativo e relógio', async () => {
      adminApiMocks.getTvDisplayState.mockResolvedValueOnce({
        clinicId: 'c-1',
        activeCall: {
          id: 'call-1',
          clinicId: 'c-1',
          queueEntryId: 'q-1',
          ticketCode: 'N-042',
          patientName: 'Ana Beatriz',
          roomName: 'Consultório 03',
          professionalName: 'Dra. Camila Torres',
          isPreferential: true,
          callCount: 1,
          calledAt: new Date().toISOString(),
        },
        recentCalls: [],
        serverTime: new Date().toISOString(),
      });

      render(<TvDisplay />);

      await waitFor(() => {
        expect(screen.getByText('N-042')).toBeInTheDocument();
        expect(screen.getByText('Ana Beatriz')).toBeInTheDocument();
        expect(screen.getByText('Consultório 03')).toBeInTheDocument();
        expect(screen.getByText(/ATENDIMENTO PREFERENCIAL/i)).toBeInTheDocument();
      });
    });
  });

  describe('FinancialPanel (SPEC-0021)', () => {
    it('renderiza gestão de repasses e seleção de médico', async () => {
      adminApiMocks.getPayoutContract.mockResolvedValueOnce({
        id: 'cont-1',
        clinicId: 'c-1',
        professionalId: 'doc-1',
        payoutType: 'percentage',
        value: 70,
        isActive: true,
      });
      adminApiMocks.listPayoutBatches.mockResolvedValueOnce([]);

      render(
        <ToastProvider>
          <FinancialPanel />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Gestão Financeira & Repasses Médicos')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Fechar Novo Lote de Repasse/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Salvar Regra/i })).toBeInTheDocument();
      });
    });
  });

  describe('InventoryPanel (SPEC-0022)', () => {
    it('renderiza tabela de insumos e cards de alerta', async () => {
      adminApiMocks.listInventoryItems.mockResolvedValueOnce([
        {
          id: 'item-1',
          clinicId: 'c-1',
          name: 'Luva de Procedimento M',
          category: 'Materiais Descartáveis',
          unit: 'cx',
          currentQuantity: 12,
          minimumQuantity: 5,
          lotNumber: 'LT-2026',
          isBelowMinimum: false,
          isExpired: false,
          isExpiringSoon: false,
        },
      ]);
      adminApiMocks.getInventoryAlerts.mockResolvedValueOnce({
        clinicId: 'c-1',
        belowMinimum: [],
        expiringSoon: [],
        expired: [],
      });

      render(
        <ToastProvider>
          <InventoryPanel />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Gestão de Insumos & Materiais Médicos')).toBeInTheDocument();
        expect(screen.getByText('Luva de Procedimento M')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Novo Insumo \/ Material/i })).toBeInTheDocument();
      });
    });
  });

  describe('DpoWorkspace (SPEC-0023)', () => {
    it('renderiza painel do DPO com métricas de SLA e requerimentos', async () => {
      adminApiMocks.getDpoOverview.mockResolvedValueOnce({
        clinicId: 'c-1',
        totalPendingRequests: 1,
        overdueRequests: 0,
        requests: [
          {
            id: 'req-1',
            protocol: 'LGPD-2026-001',
            clinicId: 'c-1',
            patientId: 'p-1',
            requestType: 'Confirmação e Acesso',
            status: 'pending',
            dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
            createdAt: new Date().toISOString(),
            remainingDays: 10,
            urgencyLevel: 'normal',
          },
        ],
        ropaActivities: [],
      });

      render(
        <ToastProvider>
          <DpoWorkspace />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Painel do DPO & Governança LGPD')).toBeInTheDocument();
        expect(screen.getByText('LGPD-2026-001')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Analisar \/ Parecer/i })).toBeInTheDocument();
      });
    });
  });

  describe('ClinicPolicyPanel (SPEC-0025)', () => {
    it('renderiza parâmetros de política e simulador de encaixe', async () => {
      adminApiMocks.getClinicPolicy.mockResolvedValueOnce({
        id: 'pol-1',
        clinicId: 'c-1',
        maxDailyOverbookingPerDoctor: 3,
        minHoursNoticeForOnlineBooking: 2,
        minHoursNoticeForFreeCancellation: 4,
      });

      render(
        <ToastProvider>
          <ClinicPolicyPanel />
        </ToastProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Políticas de Agendamento & Encaixes')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Salvar Políticas/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Checar Cota Disponível/i })).toBeInTheDocument();
      });
    });
  });
});
