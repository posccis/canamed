import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientPortal } from './PatientPortal';
import { ToastProvider } from '../layout/Toast';

const mocks = vi.hoisted(() => ({
  getPortalMeta: vi.fn(),
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getAvailableSlots: vi.fn(),
  getMyAppointments: vi.fn(),
  getMyDocuments: vi.fn(),
}));

vi.mock('./patientApi', () => ({
  patientApi: {
    getPortalMeta: mocks.getPortalMeta,
    requestOtp: mocks.requestOtp,
    verifyOtp: mocks.verifyOtp,
    getAvailableSlots: mocks.getAvailableSlots,
    getMyAppointments: mocks.getMyAppointments,
    getMyDocuments: mocks.getMyDocuments,
  },
}));

describe('PatientPortal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza a tela inicial acolhedora com header CANA MED Mulher e botão para autenticar quando não há sessão', async () => {
    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [],
      professionals: [],
    });

    render(
      <ToastProvider>
        <PatientPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('CANA MED')).toBeInTheDocument();
      expect(screen.getByText('Mulher')).toBeInTheDocument();
      expect(screen.getByText(/Bem-vinda à sua área de saúde/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
      expect(screen.getByText('Seu próximo compromisso')).toBeInTheDocument();
      expect(screen.getByText('Nova Consulta')).toBeInTheDocument();
      expect(screen.getByText('Falar com Clínica')).toBeInTheDocument();
    });
  });

  it('renderiza o portal com abas inferiores e saudação quando o paciente está autenticado', async () => {
    localStorage.setItem(
      'canamed_patient_session',
      JSON.stringify({
        token: 'test-token',
        patientId: 'pat-1',
        patientName: 'Maria Silva',
      })
    );

    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [{ id: 'spec-1', name: 'Clínica Geral' }],
      professionals: [{ id: 'doc-1', name: 'Dr. Roberto', specialtyId: 'spec-1' }],
    });
    mocks.getAvailableSlots.mockResolvedValueOnce([]);
    mocks.getMyAppointments.mockResolvedValueOnce([]);

    render(
      <ToastProvider>
        <PatientPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Olá, Maria!/i)).toBeInTheDocument();
      expect(screen.getByText('Início')).toBeInTheDocument();
      expect(screen.getByText('Agendar')).toBeInTheDocument();
      expect(screen.getByText('Consultas')).toBeInTheDocument();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
    });
  });

  it('renderiza o fluxo de agendamento em etapas progressivas', async () => {
    localStorage.setItem(
      'canamed_patient_session',
      JSON.stringify({
        token: 'test-token',
        patientId: 'pat-1',
        patientName: 'Maria Silva',
      })
    );

    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed Recife',
      specialties: [{ id: 'spec-1', name: 'Ginecologia Geral' }],
      professionals: [{ id: 'doc-1', name: 'Dra. Helena Costa', specialtyId: 'spec-1' }],
    });
    mocks.getAvailableSlots.mockResolvedValueOnce([]);
    mocks.getMyAppointments.mockResolvedValueOnce([]);

    render(
      <ToastProvider>
        <PatientPortal initialTab="schedule" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Com quem deseja passar?')).toBeInTheDocument();
      expect(screen.getByText('Especialista')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Horário')).toBeInTheDocument();
      expect(screen.getByText('Confirmação')).toBeInTheDocument();
    });
  });
});

