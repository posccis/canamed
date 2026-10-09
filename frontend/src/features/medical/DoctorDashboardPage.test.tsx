import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorDashboardPage } from './DoctorDashboardPage';

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

describe('DoctorDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os indicadores da rotina ambulatorial e lista de próximos pacientes', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/auth/session') {
        return {
          user: { id: 'u1', name: 'Dra. Gabriela Medeiros' },
          clinicId: 'c1',
          clinicName: 'Cana Med Mulher',
          role: 'profissional',
          permissions: [],
        };
      }
      if (path === '/doctor-workspace/dashboard/summary') {
        return {
          todayTotalAppointments: 8,
          todayWaitingCount: 2,
          todayAttendedCount: 5,
          todayNoShowCount: 1,
          pendingDraftRecordsCount: 3,
          activeConsultation: null,
          upcomingAppointments: [
            {
              appointmentId: 'app-1',
              patientId: 'pat-1',
              patientName: 'Maria Silva Teste',
              startsAt: '2026-10-09T14:00:00Z',
              endsAt: '2026-10-09T14:30:00Z',
              status: 'agendado',
              consultationCategory: 'primeira_vez',
              notes: 'Consulta inicial de rotina preventiva',
            },
            {
              appointmentId: 'app-2',
              patientId: 'pat-2',
              patientName: 'Joana Santos Retorno',
              startsAt: '2026-10-09T15:00:00Z',
              endsAt: '2026-10-09T15:30:00Z',
              status: 'confirmado',
              consultationCategory: 'retorno',
              notes: 'Retorno com laudo de USG transvaginal',
            },
          ],
        };
      }
      return {};
    });

    render(
      <MemoryRouter>
        <DoctorDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Dashboard Clínico — Cana Med Mulher/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Maria Silva Teste')).toBeInTheDocument();
    });

    expect(screen.getByText('Primeira Consulta')).toBeInTheDocument();
    expect(screen.getByText('Joana Santos Retorno')).toBeInTheDocument();
    expect(screen.getByText('Retorno / Exames')).toBeInTheDocument();
    expect(screen.getByText(/Total Agendado Hoje/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Aguardando na Fila/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Consultas Atendidas/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltas Registradas/i)).toBeInTheDocument();
    expect(screen.getByText(/Prontuários em Aberto/i)).toBeInTheDocument();
  });
});
