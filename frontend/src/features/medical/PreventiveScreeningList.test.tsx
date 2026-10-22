import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreventiveScreeningList } from './PreventiveScreeningList';
import type { PreventiveScreeningDto } from './medicalRecordsApi';

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiPost: mocks.apiPost,
}));

describe('PreventiveScreeningList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockScreenings: PreventiveScreeningDto[] = [
    {
      id: 'scr-1',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      examType: 'citopatologico',
      performedAt: '2026-03-15T00:00:00Z',
      resultSummary: 'Negativo para células neoplásicas. Flora bacilar habitual.',
      classification: 'normal',
      nextDueDate: '2027-03-15T00:00:00Z',
      createdAt: '2026-03-15T00:00:00Z',
    },
    {
      id: 'scr-2',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      examType: 'mamografia',
      performedAt: '2025-08-20T00:00:00Z',
      resultSummary: 'Composição mamária mista, sem nódulos ou calcificações suspeitas.',
      classification: 'BI-RADS 2',
      nextDueDate: '2026-08-20T00:00:00Z',
      createdAt: '2025-08-20T00:00:00Z',
    },
  ];

  it('renderiza a lista de exames preventivos com títulos e classificações', () => {
    render(
      <PreventiveScreeningList
        patientId="patient-1"
        screenings={mockScreenings}
        onScreeningAdded={vi.fn()}
      />,
    );

    expect(screen.getByText(/Rastreamento Preventivo Oncológico & Linha do Tempo \(2\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Citopatológico \(Papanicolau \/ Bethesda\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Mamografia Bilateral \(BI-RADS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/BI-RADS 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Negativo para células neoplásicas/i)).toBeInTheDocument();
  });

  it('exibe estado vazio acolhedor quando nenhum exame está cadastrado', () => {
    render(
      <PreventiveScreeningList
        patientId="patient-1"
        screenings={[]}
        onScreeningAdded={vi.fn()}
      />,
    );

    expect(screen.getByText(/Nenhum exame preventivo registrado ainda/i)).toBeInTheDocument();
    expect(screen.getByText(/Registre os resultados de Citopatológico/i)).toBeInTheDocument();
  });

  it('permite registrar novo exame preventivo e aciona callback', async () => {
    const handleAdded = vi.fn();
    mocks.apiPost.mockResolvedValueOnce({
      id: 'scr-new',
      clinicId: 'clinic-1',
      patientId: 'patient-1',
      examType: 'pesquisa_hpv',
      performedAt: '2026-10-09',
      resultSummary: 'DNA-HPV Não detectado (negativo para subtipos de alto risco)',
      classification: 'negativo',
      nextDueDate: null,
      createdAt: '2026-10-09T00:00:00Z',
    });

    render(
      <PreventiveScreeningList
        patientId="patient-1"
        screenings={mockScreenings}
        onScreeningAdded={handleAdded}
      />,
    );

    // Clica para registrar exame
    const addBtn = screen.getByText('➕ Registrar Exame Preventivo');
    fireEvent.click(addBtn);

    // Modal aberto
    expect(screen.getByText('Novo Exame Preventivo Oncológico')).toBeInTheDocument();

    // Preenche campos
    const summaryInput = screen.getByPlaceholderText(/Descreva detalhadamente a conclusão do exame preventivo/i);
    fireEvent.change(summaryInput, {
      target: { value: 'DNA-HPV Não detectado (negativo para subtipos de alto risco)' },
    });

    // Salva
    const saveBtn = screen.getByText('Salvar Exame');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        '/medical-records/patients/patient-1/screenings',
        expect.objectContaining({
          resultSummary: 'DNA-HPV Não detectado (negativo para subtipos de alto risco)',
        }),
      );
      expect(handleAdded).toHaveBeenCalled();
    });
  });
});
