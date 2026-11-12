import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrenatalWidget } from './PrenatalWidget';

describe('PrenatalWidget Component (SPEC-0036 / Stitch Serene Bloom)', () => {
  it('renderiza dados gestacionais com semântica ARIA de barra de progresso', () => {
    render(
      <PrenatalWidget
        currentWeeks={26}
        currentDays={3}
        totalWeeks={40}
        dueDate="22/01/2025"
        daysRemaining={98}
        fetalComparison={{
          emoji: '🍆',
          name: 'berinjela',
          sizeDescription: '~35 cm e 760g',
        }}
      />
    );

    expect(screen.getByText(/26ª Semana Gestacional/i)).toBeInTheDocument();
    expect(screen.getByText(/22\/01\/2025/i)).toBeInTheDocument();
    expect(screen.getByText(/98 dias restantes/i)).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '26');
    expect(progressBar).toHaveAttribute('aria-valuemin', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '40');
    expect(progressBar).toHaveAttribute('aria-valuetext', 'Semana 26 de 40 - 65% concluído');

    // Comparativo fetal
    expect(screen.getByText(/berinjela/i)).toBeInTheDocument();
    expect(screen.getByText(/35 cm e 760g/i)).toBeInTheDocument();
  });

  it('chama onAccessCard ao clicar no botão do Cartão da Gestante', () => {
    const handleAccessCard = vi.fn();
    render(
      <PrenatalWidget
        currentWeeks={26}
        dueDate="22/01/2025"
        onAccessCard={handleAccessCard}
      />
    );

    const btn = screen.getByRole('button', { name: /Acessar Cartão da Gestante/i });
    fireEvent.click(btn);
    expect(handleAccessCard).toHaveBeenCalledTimes(1);
  });
});
