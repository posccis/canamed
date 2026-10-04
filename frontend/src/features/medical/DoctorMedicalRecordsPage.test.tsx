import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorMedicalRecordsPage } from './DoctorMedicalRecordsPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
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
  apiPut: mocks.apiPut,
}));

describe('DoctorMedicalRecordsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o catálogo de pacientes com links para abrir em nova aba quando nenhum patientId está na URL', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/patients') {
        return [
          {
            id: 'patient-1',
            name: 'Ana Maria Ferreira',
            phone: '81987654321',
            email: 'ana@example.com',
            birthDate: '1990-05-15',
            isActive: true,
          },
          {
            id: 'patient-2',
            name: 'Carlos Eduardo Souza',
            phone: '81999887766',
            email: 'carlos@example.com',
            birthDate: '1982-11-20',
            isActive: true,
          },
        ];
      }
      return [];
    });

    render(
      <MemoryRouter initialEntries={['/medico/prontuario']}>
        <Routes>
          <Route path="/medico/prontuario" element={<DoctorMedicalRecordsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Prontuário Eletrônico do Paciente (PEP)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Ana Maria Ferreira')).toBeInTheDocument();
      expect(screen.getByText('Carlos Eduardo Souza')).toBeInTheDocument();
    });

    // Links de abrir em nova aba presentes
    const newTabLinks = screen.getAllByTitle(/Abrir este prontuário em uma nova aba/i);
    expect(newTabLinks.length).toBe(2);
    expect(newTabLinks[0]).toHaveAttribute('target', '_blank');
    expect(newTabLinks[0]).toHaveAttribute('href', '/medico/prontuario/patient-1');
  });

  it('renderiza o histórico SOAP e permite visualizar adendos quando patientId está na rota', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/patients') {
        return [
          {
            id: 'patient-1',
            name: 'Ana Maria Ferreira',
            phone: '81987654321',
            email: 'ana@example.com',
            birthDate: '1990-05-15',
            isActive: true,
          },
        ];
      }
      if (path === '/patients/patient-1/medical-records') {
        return [
          {
            id: 'rec-1',
            clinicId: 'clinic-1',
            patientId: 'patient-1',
            doctorId: 'doc-1',
            status: 'finalizado',
            subjective: 'Dor torácica atípica há 3 dias.',
            objective: 'Ausculta pulmonar limpa, murmúrio vesicular preservado.',
            assessment: 'Dor muscular intercostal.',
            plan: 'Prescrito analgésico e retorno em 15 dias.',
            createdAt: '2026-10-01T14:00:00Z',
            finalizedAt: '2026-10-01T14:30:00Z',
            addenda: [
              {
                id: 'add-1',
                medicalRecordId: 'rec-1',
                doctorId: 'doc-1',
                justification: 'Exame de ECG normal',
                notes: 'Paciente realizou eletrocardiograma sem alterações isquêmicas.',
                createdAt: '2026-10-01T15:00:00Z',
              },
            ],
          },
        ];
      }
      if (path === '/patients/patient-1/medical-documents') {
        return [];
      }
      return [];
    });

    render(
      <MemoryRouter initialEntries={['/medico/prontuario/patient-1']}>
        <Routes>
          <Route path="/medico/prontuario/:patientId" element={<DoctorMedicalRecordsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Ana Maria Ferreira')).toBeInTheDocument();
      expect(screen.getByText('Dor torácica atípica há 3 dias.')).toBeInTheDocument();
      expect(screen.getByText('Dor muscular intercostal.')).toBeInTheDocument();
      expect(screen.getByText(/Exame de ECG normal/i)).toBeInTheDocument();
    });

    // Botão de abrir em nova aba
    const openNewTabBtn = screen.getByTitle(/Abrir a ficha deste paciente em uma nova aba do navegador/i);
    expect(openNewTabBtn).toHaveAttribute('target', '_blank');
    expect(openNewTabBtn).toHaveAttribute('href', '/medico/prontuario/patient-1');

    // Botão de novo adendo clínico
    expect(screen.getByText('+ Inserir Adendo Clínico')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ Inserir Adendo Clínico'));

    expect(screen.getByPlaceholderText(/Justificativa formal obrigatória/i)).toBeInTheDocument();
  });
});
