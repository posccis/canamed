import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  exportToCsv: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiGet: mocks.apiGet,
}));

vi.mock('../../utils/exportCsv', () => ({
  exportToCsv: mocks.exportToCsv,
}));

import { DashboardPanel } from './DashboardPanel';

describe('DashboardPanel', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.exportToCsv.mockReset();

    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/dashboard/summary')) {
        return {
          date: '2026-10-01',
          totalAppointments: 10,
          scheduledCount: 4,
          confirmedCount: 2,
          attendedCount: 4,
          noShowCount: 0,
          cancelledCount: 0,
          attendanceRate: 100.0,
          queueWaitingCount: 2,
          queueInServiceCount: 1,
          queueCompletedCount: 4,
          averageWaitMinutes: 12.5,
          professionals: [
            {
              professionalId: 'p1',
              professionalName: 'Dra. Luiza Melo',
              totalAppointments: 10,
              attendedCount: 4,
              noShowCount: 0,
            },
          ],
          rooms: [
            {
              roomId: 'r1',
              roomName: 'Consultório 1',
              appointmentsCount: 10,
            },
          ],
          upcomingAppointments: [
            {
              id: 'a1',
              patientName: 'Maria Santos',
              professionalName: 'Dra. Luiza Melo',
              appointmentTypeName: 'Consulta Geral',
              startsAt: '2026-10-01T14:00:00Z',
              endsAt: '2026-10-01T14:30:00Z',
              roomName: 'Consultório 1',
              status: 'agendado',
            },
          ],
        };
      }
      if (path.startsWith('/api/v1/payments')) {
        return {
          date: '2026-10-01',
          totalReceived: 500.0,
          cashTotal: 100.0,
          pixTotal: 400.0,
          debitCardTotal: 0,
          creditCardTotal: 0,
          healthPlanBilledTotal: 0,
          transactionCount: 2,
          refundCount: 0,
        };
      }
      return {};
    });
  });

  it('carrega e exibe os KPIs e os próximos atendimentos no dashboard', async () => {
    const onNavigate = vi.fn();
    render(<DashboardPanel onNavigate={onNavigate} />);

    expect(screen.getByText('Painel Operacional')).toBeInTheDocument();

    const tens = await screen.findAllByText('10');
    expect(tens.length).toBeGreaterThan(0);
    expect(screen.getByText('100% taxa de comparecimento')).toBeInTheDocument();
    expect(screen.getByText(/12.5/)).toBeInTheDocument(); // tempo médio
    expect(screen.getByText('Dra. Luiza Melo')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText(/Sala: Consultório 1/)).toBeInTheDocument();
  });

  it('renderiza os blocos Pulso de Hoje e Desempenho no Período conforme SPEC-0030 / UI-02', async () => {
    const onNavigate = vi.fn();
    render(<DashboardPanel onNavigate={onNavigate} />);

    expect(await screen.findByRole('heading', { name: /pulso de hoje/i })).toBeInTheDocument();
    expect(screen.getByText('Tempo Real')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /desempenho no período/i })).toBeInTheDocument();
  });

  it('aciona as rotas corretas ao clicar nos botões de ação rápida de 1 clique', async () => {
    const onNavigate = vi.fn();
    render(<DashboardPanel onNavigate={onNavigate} />);

    await screen.findByRole('heading', { name: /pulso de hoje/i });

    // + Novo Agendamento -> agenda
    const newAppointmentBtn = screen.getByRole('button', { name: /\+ novo agendamento/i });
    fireEvent.click(newAppointmentBtn);
    expect(onNavigate).toHaveBeenCalledWith('agenda');

    // + Cadastrar Paciente -> patients
    const newPatientBtn = screen.getByRole('button', { name: /\+ cadastrar paciente/i });
    fireEvent.click(newPatientBtn);
    expect(onNavigate).toHaveBeenCalledWith('patients');

    // Bloquear Horário -> agenda
    const blockTimeBtn = screen.getByRole('button', { name: /bloquear horário/i });
    fireEvent.click(blockTimeBtn);
    expect(onNavigate).toHaveBeenCalledWith('agenda');

    // Fila & Check-in -> queue
    const queueBtn = screen.getByRole('button', { name: /fila & check-in/i });
    fireEvent.click(queueBtn);
    expect(onNavigate).toHaveBeenCalledWith('queue');
  });

  it('permite alternar entre períodos e exportar CSV', async () => {
    const onNavigate = vi.fn();
    render(<DashboardPanel onNavigate={onNavigate} />);

    await screen.findByRole('heading', { name: /desempenho no período/i });

    // Alterna para Últimos 7 dias
    const sevenDaysBtn = screen.getByRole('button', { name: /últimos 7 dias/i });
    fireEvent.click(sevenDaysBtn);
    expect(sevenDaysBtn).toHaveClass('segmented-control__btn--active');

    // Alterna para Mês Atual
    const monthBtn = screen.getByRole('button', { name: /mês atual/i });
    fireEvent.click(monthBtn);
    expect(monthBtn).toHaveClass('segmented-control__btn--active');

    // Exporta CSV
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exportar csv/i })).toBeInTheDocument();
    });
    const exportBtn = screen.getByRole('button', { name: /exportar csv/i });
    fireEvent.click(exportBtn);
    expect(mocks.exportToCsv).toHaveBeenCalled();
  });
});
