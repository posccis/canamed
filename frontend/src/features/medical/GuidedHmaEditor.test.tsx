import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GuidedHmaEditor } from './GuidedHmaEditor';

describe('GuidedHmaEditor', () => {
  it('renderiza o campo de texto e as pílulas de inserção de frases', () => {
    const handleChange = vi.fn();
    render(<GuidedHmaEditor value="" onChange={handleChange} />);

    expect(screen.getByText(/História da Moléstia Atual/i)).toBeInTheDocument();
    expect(screen.getByText('+ Início/Tempo')).toBeInTheDocument();
    expect(screen.getByText('+ Relação com Ciclo')).toBeInTheDocument();
    expect(screen.getByText('+ Melhora / Piora')).toBeInTheDocument();
  });

  it('insere o snippet no texto ao clicar na pílula correspondente', () => {
    const handleChange = vi.fn();
    render(<GuidedHmaEditor value="Paciente assintomática." onChange={handleChange} />);

    const btnNega = screen.getByText('+ Nega Sistêmicos');
    fireEvent.click(btnNega);

    expect(handleChange).toHaveBeenCalledWith(
      expect.stringContaining('Nega febre, disúria, hematúria')
    );
  });
});
