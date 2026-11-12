import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickChiefComplaintSelector } from './QuickChiefComplaintSelector';

describe('QuickChiefComplaintSelector', () => {
  it('renderiza os chips rápidos de queixa e o input de texto', () => {
    const handleChange = vi.fn();
    render(<QuickChiefComplaintSelector value="" onChange={handleChange} />);

    expect(screen.getByText('Rotina / Preventivo')).toBeInTheDocument();
    expect(screen.getByText('Dor Pélvica / Dismenorreia')).toBeInTheDocument();
    expect(screen.getByText('Sangramento Anormal (SUA)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Rotina ginecológica anual/i)).toBeInTheDocument();
  });

  it('preenche o template ao clicar em um chip', () => {
    const handleChange = vi.fn();
    render(<QuickChiefComplaintSelector value="" onChange={handleChange} />);

    const chipRotina = screen.getByText('Rotina / Preventivo');
    fireEvent.click(chipRotina);

    expect(handleChange).toHaveBeenCalledWith(
      'Consulta de rotina ginecológica e realização de exames preventivos periódicos.'
    );
  });

  it('permite digitação livre no campo de texto', () => {
    const handleChange = vi.fn();
    render(<QuickChiefComplaintSelector value="" onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/Rotina ginecológica anual/i);
    fireEvent.change(input, { target: { value: 'Paciente com sangramento pós-coito há 2 semanas' } });

    expect(handleChange).toHaveBeenCalledWith('Paciente com sangramento pós-coito há 2 semanas');
  });
});
