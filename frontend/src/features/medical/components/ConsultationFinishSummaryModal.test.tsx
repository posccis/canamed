import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConsultationFinishSummaryModal } from './ConsultationFinishSummaryModal';

describe('ConsultationFinishSummaryModal Component', () => {
  it('renderiza o resumo da consulta com diagnósticos, receitas e prazo de retorno CFM 1.958/2010', () => {
    const handleConfirmClose = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConsultationFinishSummaryModal
        isOpen={true}
        patientName="Maria Silva Santos"
        diagnoses={[
          { code: 'N86', description: 'Erosão e ectrópio do colo do útero', category: 'confirmed' },
          { code: 'N72', description: 'Suspeita de cervicite', category: 'hypothesis' },
        ]}
        prescriptionsCount={2}
        plannedReturnDays={15}
        onConfirmClose={handleConfirmClose}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/Resumo de Alta & Fechamento/i)).toBeInTheDocument();
    expect(screen.getByText(/Maria Silva Santos/i)).toBeInTheDocument();
    expect(screen.getByText(/Erosão e ectrópio do colo do útero/i)).toBeInTheDocument();
    expect(screen.getByText(/Suspeita de cervicite/i)).toBeInTheDocument();
    expect(screen.getByText(/2 prescrições emitidas/i)).toBeInTheDocument();
    expect(screen.getByText(/Retorno programado em 15 dias/i)).toBeInTheDocument();
    expect(screen.getByText(/CFM nº 1\.958\/2010/i)).toBeInTheDocument();

    const finishBtn = screen.getByRole('button', { name: /Concluir e Liberar Consultório/i });
    expect(finishBtn).toBeInTheDocument();
    fireEvent.click(finishBtn);
    expect(handleConfirmClose).toHaveBeenCalledTimes(1);
  });

  it('exibe a esteira trimestral com matriz de exames e vacinas obstétricas para gestantes', () => {
    render(
      <ConsultationFinishSummaryModal
        isOpen={true}
        patientName="Ana Paula Gestante"
        plannedReturnDays={28}
        gestationalInfo={{
          weeks: 26,
          days: 3,
          trimester: '2º Trimestre',
          nextRecommendedExams: [
            'Teste Oral de Tolerância à Glicose - TOTG 75g (24 a 28 semanas - DMG)',
          ],
          nextRecommendedVaccines: [
            'dTpa (a partir da 20ª semana gestacional)',
          ],
        }}
        onConfirmClose={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Esteira Trimestral Obstétrica/i)).toBeInTheDocument();
    expect(screen.getByText(/26 semanas e 3 dias/i)).toBeInTheDocument();
    expect(screen.getByText(/2º Trimestre/i)).toBeInTheDocument();
    expect(screen.getByText(/TOTG 75g/i)).toBeInTheDocument();
    expect(screen.getByText(/dTpa/i)).toBeInTheDocument();
  });
});
