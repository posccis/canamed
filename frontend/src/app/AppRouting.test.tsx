import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../api/client', () => ({
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

import { App } from '../App';

const session = {
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

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
}

describe('Roteamento por URL das superfícies (SPEC-0026 / ADR-0011)', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
  });

  afterEach(() => {
    navigateTo('/');
  });

  it('renderiza a superfície pública do paciente sem a moldura do sistema', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path.startsWith('/public/clinics/')) {
        return {
          clinicId: 'clinica-1',
          slug: 'cana-med',
          name: 'Clínica Cana Med',
          publicName: 'Cana Med',
          allowWaitlist: false,
          allowSelfReschedule: true,
          specialties: [],
          professionals: [],
          appointmentTypes: [],
        };
      }
      return { clinicId: 'clinica-1', clinicName: 'Cana Med', specialties: [], professionals: [] };
    });

    navigateTo('/p/cana-med');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Cana Med', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Agendar consulta/i })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Navegação principal da aplicação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sair$/ })).not.toBeInTheDocument();
  });

  it('não expõe telas do paciente no menu do sistema e oferece a Central de Links', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/auth/session') return session;
      if (path.startsWith('/dashboard/summary')) {
        return {
          date: '2026-10-03',
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
      return [];
    });

    navigateTo('/app/dashboard');
    render(<App />);

    expect(await screen.findByRole('button', { name: /Central de Links/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Portal Paciente/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Totem Check-in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Privacidade \(LGPD\)/i })).not.toBeInTheDocument();
  });

  it('renderiza a superfície do médico com shell próprio em /medico', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/auth/session') {
        return { ...session, role: 'profissional', permissions: ['workspace:access'] };
      }
      if (path === '/doctor-workspace/state') {
        return {
          doctorId: 'doc-1',
          doctorName: 'Dra. Teste',
          clinicId: 'clinica-1',
          waitingQueue: [],
        };
      }
      return [];
    });

    navigateTo('/medico');
    render(<App />);

    expect(await screen.findByRole('link', { name: 'Minha fila' })).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Navegação principal da aplicação' })).not.toBeInTheDocument();
  });
});
