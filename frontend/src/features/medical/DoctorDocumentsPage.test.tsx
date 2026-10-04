import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorDocumentsPage } from './DoctorDocumentsPage';

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

describe('DoctorDocumentsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os documentos emitidos e permite validar publicamente', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/patients') {
        return [
          {
            id: 'pat-1',
            name: 'Paciente Teste Doc',
            phone: '81999998888',
            email: 'doc@teste.com',
            birthDate: '1980-01-01',
            isActive: true,
          },
        ];
      }
      if (path === '/patients/pat-1/medical-documents') {
        return [
          {
            id: 'doc-1',
            clinicId: 'clinica-1',
            patientId: 'pat-1',
            doctorId: 'doc-1',
            documentType: 'receita_simples',
            status: 'assinado',
            contentPayload: 'Amoxicilina 500mg - 1 comprimido de 8/8h por 7 dias.',
            publicToken: 'CANAMED-DOC-12345',
            createdAt: '2026-10-02T10:00:00Z',
          },
        ];
      }
      return [];
    });

    render(
      <MemoryRouter>
        <DoctorDocumentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Documentos Clínicos & Prescrições')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Receita Simples')).toBeInTheDocument();
      expect(screen.getByText(/Amoxicilina 500mg/i)).toBeInTheDocument();
      expect(screen.getByText('CANAMED-DOC-12345')).toBeInTheDocument();
    });

    const validateLink = screen.getByTitle('Ver página de validação pública e QR Code em nova aba');
    expect(validateLink).toBeInTheDocument();
    expect(validateLink).toHaveAttribute('target', '_blank');
    expect(validateLink).toHaveAttribute('href', '/p/cana-med/validar/CANAMED-DOC-12345');
  });
});
