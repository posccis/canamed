import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CervicalClockMap } from './CervicalClockMap';

describe('CervicalClockMap Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o mostrador cervical de 12 horas com orifício e ZT', () => {
    render(
      <CervicalClockMap
        selectedHours={[]}
        findingType="acetobranco"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/Mapa Cervical /i)).toBeInTheDocument();
    expect(screen.getByTestId('cervical-hour-12')).toBeInTheDocument();
    expect(screen.getByTestId('cervical-hour-6')).toBeInTheDocument();
    expect(screen.getByTestId('cervical-hour-3')).toBeInTheDocument();
    expect(screen.getByTestId('cervical-hour-9')).toBeInTheDocument();
  });

  it('permite selecionar um quadrante horário ao clicar e emite callback com a hora selecionada', () => {
    render(
      <CervicalClockMap
        selectedHours={[]}
        findingType="acetobranco"
        onChange={mockOnChange}
      />
    );

    // Clica no setor das 2 horas
    const sector2 = screen.getByTestId('cervical-hour-2');
    fireEvent.click(sector2);

    expect(mockOnChange).toHaveBeenCalledWith([2]);
  });

  it('permite desselecionar uma hora já marcada', () => {
    render(
      <CervicalClockMap
        selectedHours={[2, 6]}
        findingType="acetobranco"
        onChange={mockOnChange}
      />
    );

    const sector2 = screen.getByTestId('cervical-hour-2');
    fireEvent.click(sector2);

    expect(mockOnChange).toHaveBeenCalledWith([6]);
  });
});
