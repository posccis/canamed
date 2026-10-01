import { act, render, screen, waitFor } from '@testing-library/react';
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

import { AgendaPage } from './AgendaPage';

const professionals = [{ id: 'profissional-1', name: 'Dra. Ana' }];
const patients = [{ id: 'paciente-1', name: 'Paciente Um', phone: '(81) 90000-0000' }];
const appointmentTypes = [{ id: 'tipo-1', name: 'Consulta', durationMinutes: 30 }];

function mockGet(dayResponse: unknown, fail = false) {
  mocks.apiGet.mockImplementation(async (path: string) => {
    if (path.startsWith('/appointments')) {
      if (fail) {
        throw new Error('falha simulada');
      }

      return dayResponse;
    }

    if (path === '/professionals') {
      return professionals;
    }

    if (path === '/patients') {
      return patients;
    }

    return appointmentTypes;
  });
}

describe('AgendaPage', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
  });

  it('exibe o estado vazio quando não há agendamentos', async () => {
    mockGet({ date: '2026-10-01', professionalId: 'profissional-1', appointments: [], blocks: [] });

    render(<AgendaPage />);

    expect(await screen.findByText('Nenhum agendamento para esta data.')).toBeInTheDocument();
  });

  it('lista os agendamentos do dia com status traduzido', async () => {
    mockGet({
      date: '2026-10-01',
      professionalId: 'profissional-1',
      appointments: [
        {
          id: 'agendamento-1',
          professionalId: 'profissional-1',
          patientId: 'paciente-1',
          patientName: 'Paciente Um',
          appointmentTypeId: 'tipo-1',
          appointmentTypeName: 'Consulta',
          startsAt: '2026-10-01T17:00:00Z',
          endsAt: '2026-10-01T17:30:00Z',
          durationMinutes: 30,
          status: 'agendado',
          cancellationReason: null,
          createdAt: '2026-10-01T12:00:00Z',
          updatedAt: '2026-10-01T12:00:00Z',
        },
      ],
      blocks: [],
    });

    render(<AgendaPage />);

    expect(await screen.findByText('Paciente Um')).toBeInTheDocument();
    expect(screen.getByText('Agendado')).toBeInTheDocument();
    expect(screen.getByText('14:00 – 14:30')).toBeInTheDocument();
  });

  it('exibe o estado de erro com ação de tentar novamente', async () => {
    mockGet(undefined, true);

    render(<AgendaPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('mostra o esqueleto de carregamento antes da resposta', async () => {
    let release: (() => void) | undefined;

    mocks.apiGet.mockImplementation(
      (path: string) =>
        new Promise((resolve) => {
          if (path.startsWith('/appointments')) {
            release = () => resolve({ date: '2026-10-01', professionalId: null, appointments: [], blocks: [] });

            return;
          }

          resolve(path === '/professionals' ? professionals : path === '/patients' ? patients : appointmentTypes);
        }),
    );

    const { container } = render(<AgendaPage />);

    await waitFor(() => expect(container.querySelector('.skeleton')).not.toBeNull());

    await act(async () => {
      release?.();
    });

    expect(container.querySelector('.skeleton')).not.toBeNull();
  });
});
