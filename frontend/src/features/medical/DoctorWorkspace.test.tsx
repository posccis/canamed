import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorWorkspace } from './DoctorWorkspace';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;
    public readonly detail: string | undefined;
    public readonly extensions: Record<string, unknown> = {};

    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
      this.detail = title;
    }
  },
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPut: mocks.apiPut,
}));

describe('DoctorWorkspace Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe mensagem quando a fila esta vazia e nao ha atendimento ativo', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      doctorId: 'doc-1',
      doctorName: 'Dr. Roberto Canamed',
      clinicId: 'clinic-1',
      activeConsultation: null,
      waitingQueue: [],
    });

    render(<DoctorWorkspace />);

    expect(screen.getByText('Carregando consultório virtual…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Meu Consultório Virtual')).toBeInTheDocument();
      expect(screen.getByText(/Dr\. Roberto Canamed/i)).toBeInTheDocument();
      expect(screen.getByText('Nenhum paciente aguardando no momento.')).toBeInTheDocument();
      expect(screen.getByText('Nenhum paciente em atendimento no momento')).toBeInTheDocument();
    });
  });

  it('renderiza atendimento ativo com dados do paciente, alerta de alergias e editor SOAP', async () => {
    mocks.apiGet.mockResolvedValueOnce({
      doctorId: 'doc-1',
      doctorName: 'Dr. Roberto Canamed',
      clinicId: 'clinic-1',
      activeConsultation: {
        queueEntryId: 'queue-10',
        patientId: 'patient-5',
        patientName: 'Maria Francisca da Silva',
        patientBirthDate: '1985-04-12',
        allergies: 'Dipirona e Anti-inflamatórios Não Esteroidais (AINEs)',
        chronicConditions: 'Hipertensão Arterial Sistêmica',
        healthPlanName: 'Bradesco Saúde',
        triage: {
          id: 'triage-1',
          clinicId: 'clinic-1',
          queueEntryId: 'queue-10',
          riskClassification: 'amarelo',
          bloodPressure: '140x90',
          heartRate: 88,
          temperature: 36.8,
          oxygenSaturation: 98,
          chiefComplaint: 'Cefaleia pulsátil há 2 dias',
          triageNotes: 'Paciente lúcida e orientada',
          evaluatedAt: '2026-10-02T10:00:00Z',
          evaluatedByUserId: 'user-triage',
          operatorName: 'Enf. Juliana',
        },
        medicalRecord: {
          id: 'rec-1',
          clinicId: 'clinic-1',
          patientId: 'patient-5',
          doctorId: 'doc-1',
          doctorName: 'Dr. Roberto Canamed',
          status: 'draft',
          subjective: 'Paciente relata cefaleia frontal.',
          objective: 'PA 140x90 mmHg, sem sinais focais.',
          assessment: 'Cefaleia tensional.',
          plan: 'Prescrito analgésico e repouso.',
          createdAt: '2026-10-02T10:05:00Z',
          finalizedAt: null,
          addenda: [],
        },
        startedAt: '2026-10-02T10:05:00Z',
      },
      waitingQueue: [
        {
          queueEntryId: 'queue-11',
          patientId: 'patient-6',
          patientName: 'José Carlos',
          priority: 'preferencial',
          status: 'aguardando',
          riskClassification: 'laranja',
          waitingTimeMinutes: 12,
          arrivedAt: '2026-10-02T10:15:00Z',
        },
      ],
    });

    render(<DoctorWorkspace />);

    await waitFor(() => {
      // Paciente na fila
      expect(screen.getByText('José Carlos')).toBeInTheDocument();
      expect(screen.getByText(/Preferencial/i)).toBeInTheDocument();

      // Atendimento ativo
      expect(screen.getByRole('heading', { level: 2, name: 'Maria Francisca da Silva' })).toBeInTheDocument();

      // Alerta de alergia em destaque
      expect(screen.getByText(/ALERTA DE ALERGIA DECLARADA/i)).toBeInTheDocument();

      // Sinais vitais da triagem
      expect(screen.getByText('140x90')).toBeInTheDocument();
      expect(screen.getByText('88 bpm')).toBeInTheDocument();

      // Seções do SOAP preenchidas
      const subjectiveTextarea = screen.getByPlaceholderText(/Relato dos sintomas pelo paciente/i);
      expect(subjectiveTextarea).toHaveValue('Paciente relata cefaleia frontal.');

      // Botões de ação clínica
      expect(screen.getByText(/Receita \/ Documento/i)).toBeInTheDocument();
      expect(screen.getByText(/Histórico do Paciente/i)).toBeInTheDocument();
      expect(screen.getByText('Salvar Rascunho')).toBeInTheDocument();
      expect(screen.getByText(/Finalizar Atendimento Clínico/i)).toBeInTheDocument();
    });
  });
});
