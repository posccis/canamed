import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorReturnsPage } from './DoctorReturnsPage';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;
    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
    }
  },
  apiGet: mocks.apiGet,
  apiPost: vi.fn(),
}));

describe('DoctorReturnsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os prazos de retorno dos pacientes com links para nova aba', async () => {
    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/patients') {
        return [
          {
            id: 'pat-1',
            name: 'Guilherme Silveira',
            phone: '81988887777',
            email: 'guilherme@teste.com',
            birthDate: '1995-02-10',
            isActive: true,
          },
        ];
      }
      return [];
    });

    render(
      <MemoryRouter>
        <DoctorReturnsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Gestão de Retornos & Prazos')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Guilherme Silveira')).toBeInTheDocument();
      expect(screen.getByText('81988887777')).toBeInTheDocument();
    });

    const pepLinks = screen.getAllByTitle('Abrir prontuário em nova aba');
    expect(pepLinks.length).toBeGreaterThan(0);
    expect(pepLinks[0]).toHaveAttribute('target', '_blank');
    expect(pepLinks[0]).toHaveAttribute('href', '/medico/prontuario/pat-1');
  });
});
