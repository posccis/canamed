import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrivacyPortal } from './PrivacyPortal';
import { ToastProvider } from '../layout/Toast';

const mocks = vi.hoisted(() => ({
  getPortalMeta: vi.fn(),
  exportMyData: vi.fn(),
  getConsents: vi.fn(),
  updateConsent: vi.fn(),
  openPrivacyRequest: vi.fn(),
  getPrivacyRequestStatus: vi.fn(),
}));

vi.mock('./patientApi', () => ({
  patientApi: {
    getPortalMeta: mocks.getPortalMeta,
    exportMyData: mocks.exportMyData,
    getConsents: mocks.getConsents,
    updateConsent: mocks.updateConsent,
    openPrivacyRequest: mocks.openPrivacyRequest,
    getPrivacyRequestStatus: mocks.getPrivacyRequestStatus,
  },
}));

describe('PrivacyPortal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('exibe aviso de login quando não há sessão ativa', async () => {
    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed',
      specialties: [],
      professionals: [],
    });

    render(
      <ToastProvider>
        <PrivacyPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Portal de Privacidade e LGPD')).toBeInTheDocument();
      expect(screen.getByText(/Art\. 18 da LGPD/i)).toBeInTheDocument();
    });
  });

  it('renderiza o portal de privacidade LGPD com abas de direitos do titular quando autenticado', async () => {
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
      clinicName: 'Clínica CanaMed',
      specialties: [],
      professionals: [],
    });
    mocks.exportMyData.mockResolvedValueOnce({
      patientId: 'pat-1',
      name: 'Maria Silva',
      phone: '81999998888',
      createdAt: '2026-01-01',
      appointments: [],
      legalRetentionNotice: 'Art. 16 da LGPD',
    });

    render(
      <ToastProvider>
        <PrivacyPortal />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Privacidade e Autonomia do Titular (LGPD)')).toBeInTheDocument();
      expect(screen.getByText('Extrato Completo de Dados')).toBeInTheDocument();
      expect(screen.getByText('Gestão de Consentimentos')).toBeInTheDocument();
      expect(screen.getByText('Abrir Solicitação LGPD')).toBeInTheDocument();
      expect(screen.getByText('Acompanhar Protocolo')).toBeInTheDocument();
    });
  });
});
