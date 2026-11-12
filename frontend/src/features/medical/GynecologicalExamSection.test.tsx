import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GynecologicalExamSection, type GynecologicalExamState } from './GynecologicalExamSection';

describe('GynecologicalExamSection Component (Tri-State)', () => {
  const initialExam: GynecologicalExamState = {
    breastsStatus: 'NotEvaluated',
    breastsFindings: '',
    abdomenStatus: 'NotEvaluated',
    abdomenFindings: '',
    externalGenitaliaStatus: 'NotEvaluated',
    externalGenitaliaFindings: '',
    speculumExamStatus: 'NotEvaluated',
    speculumExamFindings: '',
    bimanualPalpationStatus: 'NotEvaluated',
    bimanualPalpationFindings: '',
  };

  it('renderiza os 5 segmentos anatômicos com 3 opções por segmento: Não Avaliado, Normal e Alterado', () => {
    const handleChange = vi.fn();

    render(<GynecologicalExamSection exam={initialExam} onChange={handleChange} />);

    expect(screen.getByText(/Exame das Mamas/i)).toBeInTheDocument();
    expect(screen.getByText(/Abdome/i)).toBeInTheDocument();
    expect(screen.getByText(/Genitália Externa/i)).toBeInTheDocument();
    expect(screen.getByText(/Exame Especular/i)).toBeInTheDocument();
    expect(screen.getByText(/Toque Bimanual/i)).toBeInTheDocument();

    const notEvalButtons = screen.getAllByRole('button', { name: /Não Avaliado/i });
    expect(notEvalButtons.length).toBe(5);

    const normalButtons = screen.getAllByRole('button', { name: /Normal/i });
    expect(normalButtons.length).toBe(5);

    const abnormalButtons = screen.getAllByRole('button', { name: /Alterado/i });
    expect(abnormalButtons.length).toBe(5);
  });

  it('ao alternar para Alterado, exibe textarea e alerta de detalhamento obrigatório', () => {
    const handleChange = vi.fn();

    render(<GynecologicalExamSection exam={initialExam} onChange={handleChange} />);

    const abnormalButtons = screen.getAllByRole('button', { name: /Alterado/i });
    fireEvent.click(abnormalButtons[3]); // Especular

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        speculumExamStatus: 'Abnormal',
      }),
    );
  });

  it('exibe textarea e aviso de obrigatoriedade quando o segmento está marcado como Alterado sem achados', () => {
    const alteredExam: GynecologicalExamState = {
      ...initialExam,
      speculumExamStatus: 'Abnormal',
      speculumExamFindings: '',
    };

    render(<GynecologicalExamSection exam={alteredExam} onChange={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Descreva aspecto do colo/i)).toBeInTheDocument();
    expect(screen.getByText(/Detalhamento obrigatório/i)).toBeInTheDocument();
  });

  it('ao marcar Exame Especular como Alterado, auto-expande a seção do Mapa Cervical 12h', () => {
    const alteredExam: GynecologicalExamState = {
      ...initialExam,
      speculumExamStatus: 'Abnormal',
      speculumExamFindings: 'Ectopia',
    };

    render(<GynecologicalExamSection exam={alteredExam} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Ocultar Mapa Cervical 12h/i })).toBeInTheDocument();
    expect(screen.getByTestId('cervical-hour-12')).toBeInTheDocument();
  });
});
