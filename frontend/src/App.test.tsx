import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('exibe o nome e a tagline oficiais da marca', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('CANA MED');
    expect(screen.getByText('Eficiência para quem mais precisa.')).toBeInTheDocument();
  });
});
