import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrenatalCardSection, type PrenatalVisitItem } from './PrenatalCardSection';

describe('PrenatalCardSection Component (SPEC-0035 / RN-007)', () => {
  const dummyVisits: PrenatalVisitItem[] = [
    {
      id: 'visit-1',
      visitDate: '2026-08-15',
      gestationalAgeWeeks: 12,
      gestationalAgeDays: 2,
      weightKg: 63.5,
      bloodPressure: '110/70',
      uterineHeightCm: 12.0,
      fetalHeartRateBpm: 152,
      fetalMovementPresent: true,
      edemaClassification: 'Ausente',
      fetalPresentation: 'Cefálica',
    },
  ];

  it('renderiza título do cartão da gestante e tabela com consultas prévias', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
      />
    );

    expect(screen.getByText(/Cartão da Gestante & Consultas de Pré-Natal/i)).toBeInTheDocument();
    expect(screen.getByText(/12s 2d/i)).toBeInTheDocument();
    expect(screen.getByText(/110\/70/i)).toBeInTheDocument();
    expect(screen.getByText(/152/i)).toBeInTheDocument();
  });

  it('exibe botão de exportação e permite clique quando há consultas registradas', () => {
    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={dummyVisits}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /Exportar Cartão \(PDF\)/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).not.toBeDisabled();
  });

  it('abre modal de nova consulta e permite cadastrar visita', () => {
    const handleAdd = vi.fn().mockResolvedValue(undefined);

    render(
      <PrenatalCardSection
        patientId="pat-1"
        patientName="Juliana Silveira"
        visits={[]}
        onAddVisit={handleAdd}
      />
    );

    expect(screen.getByText(/Nenhuma consulta pré-natal registrada/i)).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /\+ Nova Consulta/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Registrar Consulta de Pré-Natal/i)).toBeInTheDocument();
  });
});
