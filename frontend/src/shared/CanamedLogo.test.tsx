import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CanamedLogoLonga, CanamedLogoCurta } from './CanamedLogo';

describe('CanamedLogo', () => {
  it('renderiza a logo longa com acessibilidade e viewBox calibrado', () => {
    render(<CanamedLogoLonga className="custom-logo" data-testid="logo-longa" />);
    const logo = screen.getByTestId('logo-longa');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('viewBox', '45 130 580 110');
    expect(logo).toHaveAttribute('aria-label', 'CANA MED Mulher');
    expect(logo).toHaveClass('custom-logo');
  });

  it('renderiza a logo curta com acessibilidade e viewBox calibrado', () => {
    render(<CanamedLogoCurta className="custom-short-logo" data-testid="logo-curta" />);
    const logo = screen.getByTestId('logo-curta');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('viewBox', '180 80 305 210');
    expect(logo).toHaveAttribute('aria-label', 'CANA MED Mulher');
    expect(logo).toHaveClass('custom-short-logo');
  });
});
