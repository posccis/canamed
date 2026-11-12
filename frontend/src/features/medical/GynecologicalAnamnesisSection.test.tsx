import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GynecologicalAnamnesisSection } from './GynecologicalAnamnesisSection';
import type { GynecologicalProfileDto } from './medicalRecordsApi';

const mockProfile: GynecologicalProfileDto = {
  id: 'profile-123',
  createdAt: new Date().toISOString(),
  patientId: 'patient-123',
  clinicId: 'clinic-123',
  menarcheAge: 12,
  sexarcheAge: 17,
  cycleIntervalDays: 28,
  cycleDurationDays: 4,
  isCycleRegular: true,
  flowIntensity: 'moderado',
  dysmenorrhea: 'ausente',
  hasPms: false,
  pmsSymptoms: null,
  menopauseStatus: 'menacme',
  menopauseAge: null,
  hrtInUse: false,
  gravida: 2,
  para: 1,
  cesareans: 1,
  abortions: 0,
  livingChildren: 1,
  ectopicPregnancies: 0,
  obstetricNotes: null,
  currentMethod: 'DIU de Cobre',
  currentMethodUsageMonths: 12,
  previousMethods: null,
  reproductivePlan: 'sem_desejo',
  pelvicSurgeries: null,
  stiHistory: null,
  familyCancerHistory: null,
  updatedAt: new Date().toISOString(),
};

describe('GynecologicalAnamnesisSection', () => {
  it('renderiza o cabeçalho, a mini-barra longitudinal e os blocos de anamnese', () => {
    render(
      <GynecologicalAnamnesisSection
        chiefComplaint="Consulta de rotina"
        onChiefComplaintChange={vi.fn()}
        hma="Paciente sem queixas"
        onHmaChange={vi.fn()}
        dum="2026-10-01"
        onDumChange={vi.fn()}
        isDumUncertain={false}
        onIsDumUncertainChange={vi.fn()}
        isMenopausal={false}
        onIsMenopausalChange={vi.fn()}
        isSexuallyActive={true}
        onIsSexuallyActiveChange={vi.fn()}
        dyspareunia="ausente"
        onDyspareuniaChange={vi.fn()}
        profile={mockProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    expect(screen.getByText('Anamnese Ginecológica Integrada')).toBeInTheDocument();
    expect(screen.getByText('G2 P1 PC1 A0 F1')).toBeInTheDocument();
    expect(screen.getByText('DIU de Cobre')).toBeInTheDocument();
    expect(screen.getByText('Queixa Principal (Motivo da Consulta)')).toBeInTheDocument();
    expect(screen.getByText(/História da Moléstia Atual/i)).toBeInTheDocument();
  });

  it('permite alternar o modo privacidade', () => {
    render(
      <GynecologicalAnamnesisSection
        chiefComplaint=""
        onChiefComplaintChange={vi.fn()}
        hma=""
        onHmaChange={vi.fn()}
        dum=""
        onDumChange={vi.fn()}
        isDumUncertain={false}
        onIsDumUncertainChange={vi.fn()}
        isMenopausal={false}
        onIsMenopausalChange={vi.fn()}
        isSexuallyActive={true}
        onIsSexuallyActiveChange={vi.fn()}
        dyspareunia="ausente"
        onDyspareuniaChange={vi.fn()}
        profile={mockProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    const btnPrivacidade = screen.getByText(/Modo Privacidade/i);
    fireEvent.click(btnPrivacidade);

    expect(screen.getByText(/Modo Privacidade Ativo/i)).toBeInTheDocument();
  });
});
