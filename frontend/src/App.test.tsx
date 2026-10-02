import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('./api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;

    public readonly detail: string | undefined;

    public readonly extensions: Record<string, unknown> = {};

    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
      this.detail = title;
    }
  },
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
}));

import { ApiError } from './api/client';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
  });

  it('exige login antes de mostrar qualquer funcionalidade', async () => {
    mocks.apiGet.mockRejectedValue(new ApiError(401, 'Sessão expirada'));

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('CANA MED');
    expect(screen.getByText('Eficiência para quem mais precisa.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Agenda$/ })).not.toBeInTheDocument();
  });

  it('mostra o painel operacional quando a sessão está ativa', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/auth/session') {
        return {
          user: { id: 'usuario-1', name: 'Recepção Teste', email: 'recepcao@canamed.local' },
          clinicId: 'clinica-1',
          clinicName: 'Clínica Teste',
          role: 'recepcionista',
          permissions: ['agenda:read', 'agenda:write'],
          professionalId: null,
          mfaEnabled: false,
          mfaPending: false,
          clinics: [{ id: 'clinica-1', name: 'Clínica Teste', role: 'recepcionista' }],
          expiresAt: '2026-10-01T20:00:00Z',
        };
      }

      if (path.startsWith('/dashboard/summary')) {
        return {
          date: '2026-10-01',
          totalAppointments: 0,
          scheduledCount: 0,
          confirmedCount: 0,
          attendedCount: 0,
          noShowCount: 0,
          cancelledCount: 0,
          attendanceRate: 0,
          queueWaitingCount: 0,
          queueInServiceCount: 0,
          queueCompletedCount: 0,
          averageWaitMinutes: 0,
          professionals: [],
          rooms: [],
          upcomingAppointments: [],
        };
      }

      if (path.startsWith('/appointments')) {
        return { date: '2026-10-01', professionalId: null, appointments: [], blocks: [] };
      }

      return [];
    });

    render(<App />);

    expect(await screen.findByRole('button', { name: /^Dashboard$/ })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Painel Operacional' })).toBeInTheDocument();
    expect(screen.getByText(/Clínica Teste/)).toBeInTheDocument();
  });
});
