import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SoapEvolutionSection } from './SoapEvolutionSection';

describe('SoapEvolutionSection', () => {
  it('renderiza os 4 campos do SOAP e os chips de hipóteses diagnósticas', () => {
    render(
      <SoapEvolutionSection
        subjective=""
        onSubjectiveChange={vi.fn()}
        objective=""
        onObjectiveChange={vi.fn()}
        assessment=""
        onAssessmentChange={vi.fn()}
        plan=""
        onPlanChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Evolução Clínica Estruturada \(SOAP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/\[S\] Subjetivo/i)).toBeInTheDocument();
    expect(screen.getByText(/\[O\] Objetivo/i)).toBeInTheDocument();
    expect(screen.getByText(/\[A\] Avaliação/i)).toBeInTheDocument();
    expect(screen.getByText(/\[P\] Plano/i)).toBeInTheDocument();
    expect(screen.getByText('Rotina Ginecológica Anual')).toBeInTheDocument();
  });

  it('insere a hipótese diagnóstica com CID-10 no campo de Avaliação ao clicar no chip', () => {
    const handleAssessmentChange = vi.fn();
    render(
      <SoapEvolutionSection
        subjective=""
        onSubjectiveChange={vi.fn()}
        objective=""
        onObjectiveChange={vi.fn()}
        assessment=""
        onAssessmentChange={handleAssessmentChange}
        plan=""
        onPlanChange={vi.fn()}
      />
    );

    const chipRotina = screen.getByText('Rotina Ginecológica Anual');
    fireEvent.click(chipRotina);

    expect(handleAssessmentChange).toHaveBeenCalledWith(
      expect.stringContaining('Z01.4 - Exame ginecológico geral de rotina')
    );
  });

  it('renderiza distinção visual entre Hipótese Preliminar (âmbar) e Diagnóstico Confirmado (verde)', () => {
    const initialDiagnoses = JSON.stringify([
      { code: 'N86', description: 'Erosão e ectrópio do colo do útero', category: 'confirmed' },
      { code: 'N72', description: 'Suspeita de cervicite', category: 'hypothesis' },
    ]);

    render(
      <SoapEvolutionSection
        subjective=""
        onSubjectiveChange={vi.fn()}
        objective=""
        onObjectiveChange={vi.fn()}
        assessment=""
        onAssessmentChange={vi.fn()}
        plan=""
        onPlanChange={vi.fn()}
        diagnosesJson={initialDiagnoses}
        onDiagnosesJsonChange={vi.fn()}
      />
    );

    const confirmedBadge = screen.getByText('Diagnóstico Confirmado');
    const hypothesisBadge = screen.getByText('Hipótese Preliminar');

    expect(confirmedBadge).toBeInTheDocument();
    expect(hypothesisBadge).toBeInTheDocument();
    expect(screen.getByText(/N86/)).toBeInTheDocument();
    expect(screen.getByText(/N72/)).toBeInTheDocument();
  });

  it('permite alternar entre Hipótese e Confirmado e adicionar diagnóstico estruturado', () => {
    const handleDiagnosesChange = vi.fn();
    render(
      <SoapEvolutionSection
        subjective=""
        onSubjectiveChange={vi.fn()}
        objective=""
        onObjectiveChange={vi.fn()}
        assessment=""
        onAssessmentChange={vi.fn()}
        plan=""
        onPlanChange={vi.fn()}
        diagnosesJson="[]"
        onDiagnosesJsonChange={handleDiagnosesChange}
      />
    );

    const toggleConfirmado = screen.getByRole('button', { name: /confirmado/i });
    fireEvent.click(toggleConfirmado);

    const chipRotina = screen.getByText('Rotina Ginecológica Anual');
    fireEvent.click(chipRotina);

    expect(handleDiagnosesChange).toHaveBeenCalledWith(
      expect.stringContaining('"category":"confirmed"')
    );
  });
});
