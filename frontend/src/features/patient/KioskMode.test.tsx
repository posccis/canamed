import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KioskMode } from './KioskMode';
import { ToastProvider } from '../layout/Toast';

const mocks = vi.hoisted(() => ({
  getPortalMeta: vi.fn(),
  kioskSearch: vi.fn(),
  kioskCheckIn: vi.fn(),
  kioskTicketStatus: vi.fn(),
}));

vi.mock('./patientApi', () => ({
  patientApi: {
    getPortalMeta: mocks.getPortalMeta,
    kioskSearch: mocks.kioskSearch,
    kioskCheckIn: mocks.kioskCheckIn,
    kioskTicketStatus: mocks.kioskTicketStatus,
  },
}));

describe('KioskMode Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza a tela de check-in assistido e o teclado touch', async () => {
    mocks.getPortalMeta.mockResolvedValueOnce({
      clinicId: 'clinic-1',
      clinicName: 'Clínica CanaMed',
      specialties: [],
      professionals: [],
    });

    render(
      <ToastProvider>
        <KioskMode />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Check-in assistido')).toBeInTheDocument();
      expect(screen.getByText('Digite seu CPF ou Telefone')).toBeInTheDocument();
    });

    // Clica nos números do teclado touch
    const btn1 = screen.getByRole('button', { name: '1' });
    fireEvent.click(btn1);

    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(2);
  });
});
