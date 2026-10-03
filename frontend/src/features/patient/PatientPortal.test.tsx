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

  it('exibe tela de autenticação OTP quando não há sessão ativa', async () => {
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
      expect(screen.getByText('Portal do Paciente CANAMED')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('(81) 98765-4321')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('123.456.789-00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Receber Código de Acesso' })).toBeInTheDocument();
    });
  });

  it('renderiza o portal com abas quando o paciente está autenticado com sessão', async () => {
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

    render(
      <ToastProvider>
        <PatientPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Portal do Paciente')).toBeInTheDocument();
      expect(screen.getByText(/Maria Silva/i)).toBeInTheDocument();
      expect(screen.getByText('Agendar Consulta')).toBeInTheDocument();
      expect(screen.getByText('Minhas Consultas')).toBeInTheDocument();
      expect(screen.getByText('Carteira Digital')).toBeInTheDocument();
    });
  });
});
