import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
  apiPut: mocks.apiPut,
  apiDelete: mocks.apiDelete,
}));

vi.mock('../auth/useSession', () => ({
  useSession: () => ({
    state: {
      status: 'authenticated',
      session: {
        user: { id: 'u1', name: 'Gestor Teste', email: 'gestor@canamed.local' },
        clinicId: 'c1',
        clinicName: 'Clínica Operação',
        role: 'gestor',
        permissions: ['clinic:read', 'clinic:manage'],
      },
    },
  }),
}));

import { OperationPanel } from './OperationPanel';

describe('OperationPanel', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();
    mocks.apiPut.mockReset();
    mocks.apiDelete.mockReset();

    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/health-plans') {
        return [
          { id: 'p1', name: 'Unimed Regional', ansCode: '123456', isActive: true, createdAt: '', updatedAt: '' },
        ];
      }
      if (path === '/rooms') {
        return [
          { id: 'r1', name: 'Consultório Principal', isActive: true, createdAt: '', updatedAt: '' },
        ];
      }
      if (path === '/operating-hours') {
        return [
          { id: 'h1', dayOfWeek: 1, startsAt: '08:00:00', endsAt: '12:00:00' },
        ];
      }
      if (path === '/clinic-closures') {
        return [
          { id: 'cl1', date: '2026-12-25', description: 'Natal', createdAt: '' },
        ];
      }
      return [];
    });
  });

  it('renderiza o título da gestão operacional e lista os convênios', async () => {
    render(<OperationPanel />);

    expect(screen.getByText('Gestão Operacional da Clínica')).toBeInTheDocument();
    expect(await screen.findByText('Unimed Regional')).toBeInTheDocument();
    expect(screen.getByText('123456')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Novo convênio' })).toBeInTheDocument();
  });

  it('permite alternar para a aba de salas e exibe as salas cadastradas', async () => {
    render(<OperationPanel />);

    const salasTab = await screen.findByRole('button', { name: /Salas/ });
    salasTab.click();

    expect(await screen.findByText('Consultório Principal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nova sala' })).toBeInTheDocument();
  });
});
