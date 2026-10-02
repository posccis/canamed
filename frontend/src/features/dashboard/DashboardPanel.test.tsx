import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiGet: mocks.apiGet,
}));

import { DashboardPanel } from './DashboardPanel';

describe('DashboardPanel', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();

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
              AppointmentsCount: 10,
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
});
