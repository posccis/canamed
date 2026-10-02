import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../../api/client', () => ({
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

import { QueuePanel } from './QueuePanel';

const professional = { id: 'profissional-1', name: 'Dra. Ana', specialtyId: null, specialtyName: null, isActive: true };
const patient = {
  id: 'paciente-1',
  name: 'Paciente Um',
  phone: '(81) 90000-0000',
  email: null,
  birthDate: null,
  isActive: true,
};

function entry(overrides: Record<string, unknown>) {
  return {
    id: 'fila-1',
    appointmentId: null,
    patientId: 'paciente-1',
    patientName: 'Paciente Um',
    professionalId: 'profissional-1',
    priority: 'normal',
    status: 'aguardando',
    position: 1,
    arrivedAt: '2026-10-01T11:00:00Z',
    calledAt: null,
    startedAt: null,
    finishedAt: null,
    waitingMinutes: 25,
    serviceMinutes: null,
    appointmentStartsAt: null,
    ...overrides,
  };
}

function mockApi(entries: Record<string, unknown>[]) {
  mocks.apiGet.mockImplementation(async (path: string) => {
    if (path.startsWith('/queue')) {
      return { date: '2026-10-01', professionalId: null, entries };
    }

    if (path === '/professionals') {
      return [professional];
    }

    if (path === '/patients') {
      return [patient];
    }

    if (path.startsWith('/appointments')) {
      return { date: '2026-10-01', professionalId: null, appointments: [], blocks: [] };
    }

    return [];
  });
}

describe('QueuePanel', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
  });

  it('mostra o estado vazio quando ninguém está na fila', async () => {
    mockApi([]);

    render(<QueuePanel />);

    expect(await screen.findByText('Nenhum paciente na fila desta data.')).toBeInTheDocument();
  });

  it('exibe posição, prioridade e tempo de espera da fila', async () => {
    mockApi([entry({ priority: 'preferencial', waitingMinutes: 75 })]);

    render(<QueuePanel />);

    expect(await screen.findByText('Paciente Um')).toBeInTheDocument();
    expect(screen.getByText(/1º/)).toBeInTheDocument();
    const summary = screen.getByText(/espera 1h15/);

    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent(/Preferencial/);
    expect(screen.getByRole('button', { name: 'Chamar' })).toBeInTheDocument();
  });

  it('mostra as ações de acordo com o status da entrada', async () => {
    mockApi([
      entry({ id: 'fila-1', status: 'chamado', position: null }),
      entry({ id: 'fila-2', status: 'em_atendimento', position: null }),
    ]);

    render(<QueuePanel />);

    expect(await screen.findByRole('button', { name: 'Iniciar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
  });

  it('exibe o estado de erro com ação de tentar novamente', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/queue')) {
        throw new Error('falha simulada');
      }

      return [];
    });

    render(<QueuePanel />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Tentar novamente' }).length).toBeGreaterThan(0);
  });
});
