import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ObstetricCalculatorWidget } from './ObstetricCalculatorWidget';

describe('ObstetricCalculatorWidget Component (SPEC-0035 / RN-005, RN-006)', () => {
  it('calcula Naegele e exibe estimativa por DUM corretamente', () => {
    render(
      <ObstetricCalculatorWidget
        dum="2026-05-01"
        isDumUncertain={false}
      />
    );

    expect(screen.getByText(/Calculadora Obstétrica & Reconciliação FEBRASGO/i)).toBeInTheDocument();
    expect(screen.getByText(/DPP \(Naegele\):/i)).toBeInTheDocument();
    // 01/05 + 7 dias = 08; 05 - 3 meses = 02 -> 08/02/2027
    expect(screen.getByText(/08\/02\/2027/i)).toBeInTheDocument();
  });

  it('exibe reconciliação priorizando 1º USG quando discordância > 5 dias no 1º trimestre', () => {
    const handleApply = vi.fn();

    render(
      <ObstetricCalculatorWidget
        dum="2026-05-01"
        isDumUncertain={false}
        firstUsgDate="2026-06-15"
        firstUsgWeeks={8}
        firstUsgDays={0}
        onApplyCalculatedValues={handleApply}
      />
    );

    expect(screen.getByText(/Reconciliação Oficial Adotada:/i)).toBeInTheDocument();
    const applyBtn = screen.getByRole('button', { name: /Aplicar ao Prontuário/i });
    expect(applyBtn).toBeInTheDocument();

    fireEvent.click(applyBtn);
    expect(handleApply).toHaveBeenCalled();
  });

  it('orienta profissional com segurança quando DUM for desconhecida ou incerta', () => {
    render(
      <ObstetricCalculatorWidget
        dum=""
        isDumUncertain={true}
        firstUsgDate="2026-06-20"
        firstUsgWeeks={10}
        firstUsgDays={2}
      />
    );

    expect(screen.getByText(/DUM incerta ou desconhecida/i)).toBeInTheDocument();
    expect(screen.getByText(/Idade gestacional balizada exclusivamente pelo 1º USG/i)).toBeInTheDocument();
  });
});
