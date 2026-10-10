import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GynecologicalExamSection, type GynecologicalExamState } from './GynecologicalExamSection';

describe('GynecologicalExamSection Component', () => {
  const initialExam: GynecologicalExamState = {
    breastsIsNormal: true,
    breastsFindings: '',
    abdomenIsNormal: true,
    abdomenFindings: '',
    externalGenitaliaIsNormal: true,
    externalGenitaliaFindings: '',
    speculumExamIsNormal: true,
    speculumExamFindings: '',
    bimanualPalpationIsNormal: true,
    bimanualPalpationFindings: '',
  };

  it('renderiza os 5 segmentos anatômicos com estado normal selecionado por padrão', () => {
    const handleChange = vi.fn();

    render(<GynecologicalExamSection exam={initialExam} onChange={handleChange} />);

    expect(screen.getByText(/Exame das Mamas/i)).toBeInTheDocument();
    expect(screen.getByText(/Abdome/i)).toBeInTheDocument();
    expect(screen.getByText(/Genitália Externa/i)).toBeInTheDocument();
    expect(screen.getByText(/Exame Especular/i)).toBeInTheDocument();
    expect(screen.getByText(/Toque Bimanual/i)).toBeInTheDocument();

    // 5 botões de Normal selecionados
    const normalButtons = screen.getAllByText(/Normal \/ Sem alterações/i);
    expect(normalButtons.length).toBe(5);
  });

  it('permite alternar segmento para alterado e aciona onChange', () => {
    const handleChange = vi.fn();

    render(<GynecologicalExamSection exam={initialExam} onChange={handleChange} />);

    // Clica em detalhar achado no exame especular
    const detailButtons = screen.getAllByText(/Detalhar achado/i);
    fireEvent.click(detailButtons[3]); // 4º segmento: especular

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        speculumExamIsNormal: false,
      }),
    );
  });

  it('renderiza em modo somente leitura quando readOnly é verdadeiro', () => {
    const alteredExam: GynecologicalExamState = {
      ...initialExam,
      speculumExamIsNormal: false,
      speculumExamFindings: 'Ectopia periorificial extensa, com sangramento de contato',
    };

    render(<GynecologicalExamSection exam={alteredExam} onChange={vi.fn()} readOnly={true} />);

    // Não deve conter botões de alternância
    expect(screen.queryByText(/Detalhar achado/i)).not.toBeInTheDocument();

    // Deve exibir badge de alterado e a descrição
    expect(screen.getByText('⚠️ Alterado')).toBeInTheDocument();
    expect(screen.getByText(/Ectopia periorificial extensa/i)).toBeInTheDocument();
  });
});
