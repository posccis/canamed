import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('../../api/client', () => ({
  ApiError: class ApiError extends Error {
    public readonly status: number;
    public readonly detail: string | undefined;
    public constructor(status: number, title: string) {
      super(title);
      this.status = status;
      this.detail = title;
    }
  },
  apiGet: mocks.apiGet,
  apiPost: mocks.apiPost,
}));

import { ProfessionalsPanel } from './ProfessionalsPanel';

const fakeProfessionals = [
  {
    id: 'prof-1',
    name: 'Dra. Marina Rocha',
    specialtyId: 'spec-1',
    specialtyName: 'Ginecologia e Obstetrícia',
    registrationNumber: 'CRM/PE 12345',
    isActive: true,
  },
  {
    id: 'prof-2',
    name: 'Dr. Lucas Silveira',
    specialtyId: 'spec-2',
    specialtyName: 'Mastologia',
    registrationNumber: 'CRM/PE 67890',
    isActive: false,
  },
];

const fakeSpecialties = [
  { id: 'spec-1', name: 'Ginecologia e Obstetrícia', isActive: true },
  { id: 'spec-2', name: 'Mastologia', isActive: true },
];

describe('ProfessionalsPanel Component (SPEC-0030 / Módulo 3.3)', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();

    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/professionals') return fakeProfessionals;
      if (path === '/specialties') return fakeSpecialties;
      return [];
    });
  });

  it('renderiza o cabeçalho, tabela do corpo clínico e badges de CRM/UF e especialidade', async () => {
    render(<ProfessionalsPanel />);

    expect(screen.getByText('Corpo Clínico & Profissionais')).toBeInTheDocument();
    expect(screen.getByText('Carregando corpo clínico...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dra. Marina Rocha')).toBeInTheDocument();
    });

    expect(screen.getByText('Ginecologia e Obstetrícia')).toBeInTheDocument();
    expect(screen.getByText('CRM/PE 12345')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo Profissional' })).toBeInTheDocument();
  });

  it('filtra profissionais por busca em tempo real e alternador de status', async () => {
    render(<ProfessionalsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Dra. Marina Rocha')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nome, CRM ou especialidade...');

    // Filtrar por CRM do Dr. Lucas
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '67890' } });
    });

    expect(screen.queryByText('Dra. Marina Rocha')).not.toBeInTheDocument();

    // Dr. Lucas está inativo, selecionando filtro "Inativos"
    const inativosBtn = screen.getByRole('button', { name: /^Inativos/ });
    await act(async () => {
      fireEvent.click(inativosBtn);
    });

    expect(screen.getByText('Dr. Lucas Silveira')).toBeInTheDocument();
  });

  it('abre drawer ao clicar em Novo Profissional e valida formulário de cadastro', async () => {
    render(<ProfessionalsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Dra. Marina Rocha')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: 'Novo Profissional' });
    await act(async () => {
      fireEvent.click(newBtn);
    });

    expect(screen.getByText('Cadastre um médico ou especialista para vincular à agenda')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: 'Cadastrar Profissional' });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(screen.getByText('Nome do profissional é obrigatório.')).toBeInTheDocument();
  });

  it('exibe modal de inativação com aviso de trava assistencial (MED-03)', async () => {
    mocks.apiPost.mockResolvedValueOnce(undefined);

    render(<ProfessionalsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Dra. Marina Rocha')).toBeInTheDocument();
    });

    const inativarBtn = screen.getByLabelText('Inativar Dra. Marina Rocha');
    await act(async () => {
      fireEvent.click(inativarBtn);
    });

    expect(screen.getByText('Inativar Profissional')).toBeInTheDocument();
    expect(screen.getByText(/Salvaguarda Ética e Assistencial \(CFM\)/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Inativação' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mocks.apiPost).toHaveBeenCalledWith('/professionals/prof-1/deactivate', undefined, undefined);
  });
});
