import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorAgendaPage } from './DoctorAgendaPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;
    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
    }
  },
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
}));

describe('DoctorAgendaPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza consultas do médico com link direto para prontuário em nova aba', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/auth/session') {
        return {
          user: { id: 'u1', name: 'Dr. Roberto' },
          clinicId: 'c1',
          clinicName: 'Clínica Cana Med',
          role: 'profissional',
          permissions: [],
        };
      }
      if (path.startsWith('/appointments')) {
        return {
          date: '2026-10-04',
          professionalId: null,
          appointments: [
            {
              id: 'app-1',
              patientId: 'patient-99',
              patientName: 'Beatriz Vasconcelos',
              startsAt: '2026-10-04T09:00:00Z',
              endsAt: '2026-10-04T09:30:00Z',
              status: 'confirmado',
              appointmentTypeName: 'Consulta Inicial',
              roomName: 'Consultório 1',
            },
          ],
          blocks: [],
        };
      }
      return [];
    });

    render(
      <MemoryRouter>
        <DoctorAgendaPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Minha Agenda')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Beatriz Vasconcelos')).toBeInTheDocument();
      expect(screen.getByText('CONFIRMADO')).toBeInTheDocument();
    });

    const pepLink = screen.getByTitle('Abrir Prontuário do Paciente em Nova Aba');
    expect(pepLink).toBeInTheDocument();
    expect(pepLink).toHaveAttribute('target', '_blank');
    expect(pepLink).toHaveAttribute('href', '/medico/prontuario/patient-99');
  });
});
