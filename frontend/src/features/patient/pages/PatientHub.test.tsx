import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PatientHub } from './PatientHub';
import { ToastProvider } from '../../layout/Toast';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  getMyAppointments: vi.fn(),
  getPortalMeta: vi.fn(),
}));

vi.mock('../patientApi', () => ({
  patientApi: {
    getMyAppointments: mocks.getMyAppointments,
    getPortalMeta: mocks.getPortalMeta,
  },
}));

vi.mock('../useClinicBySlug', () => ({
  useClinicBySlug: () => ({
    status: 'ready',
    clinic: {
      clinicId: 'c-1',
      slug: 'cana-med',
      publicName: 'Cana Med Mulher',
      name: 'Cana Med Mulher',
      helpPhone: '(81) 98765-4321',
      specialties: [],
      professionals: [],
      appointmentTypes: [],
    },
  }),
}));

describe('PatientHub Component — Protótipo Oficial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.getPortalMeta.mockResolvedValue({
      clinicId: 'c-1',
      clinicName: 'Cana Med Mulher',
      specialties: [],
      professionals: [],
    });
  });

  it('renderiza o protótipo da área do paciente com header oficial, ações rápidas e botão entrar quando não autenticado', async () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/p/cana-med']}>
          <Routes>
            <Route path="/p/:slug" element={<PatientHub />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Cana Med Mulher')).toBeInTheDocument();
      expect(screen.getByText(/Bem-vinda à sua área de saúde e agendamento digital/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      expect(screen.getByText('Seu próximo compromisso')).toBeInTheDocument();
      expect(screen.getByText('Nova Consulta')).toBeInTheDocument();
      expect(screen.getByText('Falar com Clínica')).toBeInTheDocument();
      // "Perfil", "Meus Dados", "Histórico" e "Consultas" devem ser exibidos apenas após autenticação
      expect(screen.queryByText('Histórico')).not.toBeInTheDocument();
      expect(screen.queryByText('Meus Dados')).not.toBeInTheDocument();
    });
  });

  it('exibe a próxima consulta e saudação personalizada quando a paciente possui agendamento', async () => {
    localStorage.setItem(
      'canamed_patient_session_cana-med',
      JSON.stringify({
        token: 'token-123',
        patientId: 'pat-1',
        patientName: 'Juliana Mendes',
      })
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    futureDate.setHours(14, 30, 0, 0);

    mocks.getMyAppointments.mockResolvedValueOnce([
      {
        id: 'apt-1',
        clinicId: 'c-1',
        professionalId: 'doc-1',
        professionalName: 'Dra. Beatriz Santos',
        specialtyName: 'Ginecologia Geral',
        startsAt: futureDate.toISOString(),
        endsAt: new Date(futureDate.getTime() + 30 * 60000).toISOString(),
        status: 'confirmado',
        paymentStatus: 'pendente',
      },
    ]);

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/p/cana-med']}>
          <Routes>
            <Route path="/p/:slug" element={<PatientHub />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Olá, Juliana!/i)).toBeInTheDocument();
      expect(screen.getByText('Seu próximo compromisso')).toBeInTheDocument();
      expect(screen.getByText('Dra. Beatriz Santos')).toBeInTheDocument();
      expect(screen.getByText('Ginecologia Geral')).toBeInTheDocument();
      expect(screen.getByText('confirmado')).toBeInTheDocument();
    });
  });

  it('exibe estado vazio acolhedor quando a paciente autenticada não possui consultas futuras', async () => {
    localStorage.setItem(
      'canamed_patient_session_cana-med',
      JSON.stringify({
        token: 'token-123',
        patientId: 'pat-1',
        patientName: 'Juliana Mendes',
      })
    );

    mocks.getMyAppointments.mockResolvedValueOnce([]);

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/p/cana-med']}>
          <Routes>
            <Route path="/p/:slug" element={<PatientHub />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Olá, Juliana!/i)).toBeInTheDocument();
      expect(screen.getByText('Nenhuma consulta agendada')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Agendar Agora/i })).toBeInTheDocument();
    });
  });
});
