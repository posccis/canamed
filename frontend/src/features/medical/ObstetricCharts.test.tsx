import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AtalahWeightGainChart } from './AtalahWeightGainChart';
import { UterineHeightChart } from './UterineHeightChart';
import type { PrenatalVisitDto } from './medicalRecordsApi';

describe('ObstetricCharts Components (Atalah & Altura Uterina)', () => {
  const mockVisits: PrenatalVisitDto[] = [
    {
      id: 'v1',
      clinicId: 'c1',
      patientId: 'p1',
      medicalRecordId: 'm1',
      visitDate: '2026-01-10',
      gestationalAgeWeeks: 12,
      gestationalAgeDays: 0,
      weightKg: 60.5,
      bmi: 22.8,
      bloodPressure: '110/70',
      uterineHeightCm: 12,
      fetalHeartRateBpm: 155,
      fetalMovementPresent: true,
      fetalPresentation: 'cefalico',
      clinicalNotes: 'Rotina de 1º trimestre',
      createdAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'v2',
      clinicId: 'c1',
      patientId: 'p1',
      medicalRecordId: 'm2',
      visitDate: '2026-03-10',
      gestationalAgeWeeks: 20,
      gestationalAgeDays: 0,
      weightKg: 64.0,
      bmi: 24.1,
      bloodPressure: '115/75',
      uterineHeightCm: 20,
      fetalHeartRateBpm: 148,
      fetalMovementPresent: true,
      fetalPresentation: 'cefalico',
      clinicalNotes: 'USG morfológico normal',
      createdAt: '2026-03-10T10:00:00Z',
    },
  ];

  it('renderiza o gráfico da Curva de Atalah com as faixas de normalidade de IMC gestacional', () => {
    render(<AtalahWeightGainChart visits={mockVisits} />);

    expect(screen.getByText(/Curva de Ganho de Peso Gestacional/i)).toBeInTheDocument();
    expect(screen.getByText(/Baixo Peso/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Adequado/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Sobrepeso/i)).toBeInTheDocument();
    expect(screen.getByText(/Obesidade/i)).toBeInTheDocument();
  });

  it('calcula IMC automaticamente na Curva de Atalah a partir do peso e da estatura materna quando bmi estiver ausente', () => {
    const visitsWithoutBmi = [
      {
        gestationalAgeWeeks: 16,
        weightKg: 65.0,
        bmi: null,
      },
    ];

    render(<AtalahWeightGainChart visits={visitsWithoutBmi} heightCm={165} />);

    // IMC esperado: 65 / (1.65^2) = 23.9
    expect(screen.getByText(/16s: IMC 23.9/i)).toBeInTheDocument();
  });

  it('exibe mensagem orientadora na Curva de Atalah quando não há registros com peso ou IMC', () => {
    render(<AtalahWeightGainChart visits={[]} />);

    expect(
      screen.getByText(/Nenhum registro com peso\/IMC disponível/i)
    ).toBeInTheDocument();
  });

  it('renderiza o gráfico da Curva de Altura Uterina com percentis P10 e P90', () => {
    render(<UterineHeightChart visits={mockVisits} />);

    expect(screen.getByText(/Curva de Altura Uterina \(P10 a P90 - FEBRASGO\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Percentil 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Percentil 90/i)).toBeInTheDocument();
  });

  it('exibe aviso explicativo na Curva de Altura Uterina quando não há medidas de AU', () => {
    render(<UterineHeightChart visits={[]} />);

    expect(
      screen.getByText(/A aferição da altura uterina inicia-se habitualmente a partir da 12ª/i)
    ).toBeInTheDocument();
  });

  it('representa consultas precoces (ex: 5 semanas) e valores elevados nos gráficos sem ocultar os dados', () => {
    const earlyVisits = [
      {
        gestationalAgeWeeks: 5,
        weightKg: 68.0,
        bmi: 24.5,
        uterineHeightCm: 16.0,
      },
    ];

    render(
      <div>
        <AtalahWeightGainChart visits={earlyVisits} />
        <UterineHeightChart visits={earlyVisits} />
      </div>
    );

    // Na Curva de Atalah, 5 semanas deve ser plotado e não deve mostrar a mensagem de vazio
    expect(screen.queryByText(/Nenhum registro com peso\/IMC disponível/i)).not.toBeInTheDocument();
    expect(screen.getByText(/5s • IMC 24.5/i)).toBeInTheDocument();

    // Na Curva de Altura Uterina, 16cm deve ser plotado e não deve mostrar o aviso de ausência
    expect(screen.queryByText(/A aferição da altura uterina inicia-se habitualmente a partir da 12ª/i)).not.toBeInTheDocument();
    expect(screen.getByText(/5s • AU 16cm/i)).toBeInTheDocument();
  });
});
