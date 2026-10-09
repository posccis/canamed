import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GynecologicalProfileCard } from './GynecologicalProfileCard';
import type { GynecologicalProfileDto } from './medicalRecordsApi';

const mocks = vi.hoisted(() => ({
  apiPut: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiPut: mocks.apiPut,
}));

describe('GynecologicalProfileCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProfile: GynecologicalProfileDto = {
    id: 'prof-1',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    menarcheAge: 13,
    sexarcheAge: 18,
    cycleIntervalDays: 28,
    cycleDurationDays: 5,
    isCycleRegular: true,
    flowIntensity: 'moderado',
    dysmenorrhea: 'leve',
    hasPms: true,
    pmsSymptoms: 'Mastalgia e cefaleia',
    menopauseStatus: 'menacme',
    menopauseAge: null,
    hrtInUse: false,
    gravida: 3,
    para: 2,
    cesareans: 1,
    abortions: 1,
    livingChildren: 2,
    ectopicPregnancies: 0,
    obstetricNotes: 'Parto normal em 2018, cesárea em 2021',
    currentMethod: 'DIU Hormonal (Mirena)',
    currentMethodUsageMonths: 24,
    previousMethods: 'ACO combinado por 5 anos',
    reproductivePlan: 'sem_desejo',
    pelvicSurgeries: 'Cesárea prévia',
    stiHistory: 'Nega',
    familyCancerHistory: 'Mãe com CA de mama aos 62 anos',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  };

  it('exibe resumo dos dados obstétricos (GPA), menstruais e contraceptivos', () => {
    render(<GynecologicalProfileCard profile={mockProfile} onProfileUpdated={vi.fn()} />);

    expect(screen.getByText('Ficha Gineco-Obstétrica Longitudinal')).toBeInTheDocument();
    expect(screen.getByText('G3 P2 PC1 A1 F2')).toBeInTheDocument();
    expect(screen.getByText(/DIU HORMONAL \(MIRENA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/13 anos/i)).toBeInTheDocument();
    expect(screen.getByText(/28d \/ 5d/i)).toBeInTheDocument();
    expect(screen.getByText(/Mãe com CA de mama/i)).toBeInTheDocument();
  });

  it('permite abrir formulário de edição e salvar alterações', async () => {
    const handleUpdated = vi.fn();
    mocks.apiPut.mockResolvedValueOnce({
      ...mockProfile,
      gravida: 4,
      abortions: 2,
    });

    render(<GynecologicalProfileCard profile={mockProfile} onProfileUpdated={handleUpdated} />);

    // Clica para editar
    const editBtn = screen.getByText('✏️ Editar Histórico');
    fireEvent.click(editBtn);

    expect(screen.getByText('Salvar Ficha')).toBeInTheDocument();

    // Altera gestações
    const gInput = screen.getByLabelText(/Gestações \(G\)/i);
    fireEvent.change(gInput, { target: { value: '4' } });

    // Salva
    const saveBtn = screen.getByText('Salvar Ficha');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mocks.apiPut).toHaveBeenCalledWith(
        '/medical-records/patients/patient-1/gynecological-profile',
        expect.objectContaining({
          gravida: 4,
        }),
      );
      expect(handleUpdated).toHaveBeenCalled();
    });
  });
});
