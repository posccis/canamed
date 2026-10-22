import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClinicalAlertsBar } from './ClinicalAlertsBar';

describe('ClinicalAlertsBar Component (SPEC-0035 / RN-008)', () => {
  it('renderiza badge âmbar para gestante Rh negativo com alerta de Coombs / Profilaxia Anti-D', () => {
    render(
      <ClinicalAlertsBar
        rhFactor="Negativo"
        bloodType="O"
        bloodPressure="120/80"
        fastingBloodGlucose={85}
      />
    );

    expect(screen.getByText(/Gestante Rh Negativo/i)).toBeInTheDocument();
    expect(screen.getByText(/Checar Coombs Indireto \/ Profilaxia Anti-D/i)).toBeInTheDocument();
  });

  it('renderiza badge vermelho de alerta quando pressão arterial indica risco de hipertensão gestacional / pré-eclâmpsia', () => {
    render(
      <ClinicalAlertsBar
        rhFactor="Positivo"
        bloodType="A"
        bloodPressure="150/100"
        fastingBloodGlucose={85}
      />
    );

    expect(screen.getByText(/Alerta de Hipertensão Gestacional \/ Risco de Pré-Eclâmpsia/i)).toBeInTheDocument();
    expect(screen.getByText(/PA aferida: 150\/100 mmHg/i)).toBeInTheDocument();
  });

  it('renderiza alerta de suspeita de DMG quando glicemia de jejum for >= 92 mg/dL', () => {
    render(
      <ClinicalAlertsBar
        rhFactor="Positivo"
        bloodType="B"
        bloodPressure="110/70"
        fastingBloodGlucose={95}
      />
    );

    expect(screen.getByText(/Suspeita de Diabetes Melito Gestacional \(DMG\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Glicemia de jejum: 95 mg\/dL \(referência: < 92\)/i)).toBeInTheDocument();
  });

  it('não renderiza alertas indevidos quando todos os parâmetros estão normais', () => {
    const { container } = render(
      <ClinicalAlertsBar
        rhFactor="Positivo"
        bloodType="O"
        bloodPressure="115/75"
        fastingBloodGlucose={80}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
