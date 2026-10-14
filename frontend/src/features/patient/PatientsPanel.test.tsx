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

import { PatientsPanel } from './PatientsPanel';

const fakePatients = [
  {
    id: 'pat-1',
    name: 'Juliana Costa Lima',
    phone: '81988887777',
    email: 'juliana@example.com',
    birthDate: '1992-05-14',
    document: '12345678901',
    healthPlanId: 'plan-1',
    healthPlanName: 'Unimed',
    isActive: true,
  },
  {
    id: 'pat-2',
    name: 'Beatriz Almeida Rocha',
    phone: '81977776666',
    email: 'beatriz@example.com',
    birthDate: '1985-11-20',
    document: '98765432100',
    healthPlanId: null,
    healthPlanName: null,
    isActive: false,
  },
];

const fakePlans = [
  { id: 'plan-1', name: 'Unimed', active: true },
  { id: 'plan-2', name: 'Bradesco Saúde', active: true },
];

describe('PatientsPanel Component (SPEC-0030 / Módulo 3.2)', () => {
  beforeEach(() => {
    mocks.apiGet.mockReset();
    mocks.apiPost.mockReset();

    mocks.apiGet.mockImplementation(async (path: string) => {
      if (path === '/patients') return fakePatients;
      if (path === '/health-plans') return fakePlans;
      if (path.includes('/appointments')) {
        return [
          {
            id: 'app-1',
            appointmentTypeName: 'Consulta Ginecológica',
            specialtyName: 'Ginecologia Geral',
            startsAt: '2026-10-15T14:00:00Z',
            endsAt: '2026-10-15T14:45:00Z',
            status: 'agendado',
          },
        ];
      }
      return [];
    });
  });

  it('renderiza o cabeçalho, tabela de pacientes e badges de status e convênio', async () => {
    render(<PatientsPanel />);

    expect(screen.getByText('Gestão de Pacientes')).toBeInTheDocument();
    expect(screen.getByText('Carregando lista de pacientes...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Juliana Costa Lima')).toBeInTheDocument();
    });

    expect(screen.getByText('juliana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Unimed')).toBeInTheDocument();
    expect(screen.getByText('Ativa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nova Paciente' })).toBeInTheDocument();
  });

  it('filtra pacientes por busca de texto (nome e CPF) com atualização em tempo real', async () => {
    render(<PatientsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Juliana Costa Lima')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Buscar por nome, CPF ou telefone...');

    // Filtrar por CPF da Beatriz
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: '987.654' } });
    });

    expect(screen.queryByText('Juliana Costa Lima')).not.toBeInTheDocument();
    // Beatriz está inativa, se filtro de status for "Ativas" não aparece a menos que clique em Todas
    const todasBtn = screen.getByRole('button', { name: /^Todas/ });
    await act(async () => {
      fireEvent.click(todasBtn);
    });

    expect(screen.getByText('Beatriz Almeida Rocha')).toBeInTheDocument();
  });

  it('abre o drawer lateral ao clicar em Nova Paciente e valida campos obrigatórios', async () => {
    render(<PatientsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Juliana Costa Lima')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: 'Nova Paciente' });
    await act(async () => {
      fireEvent.click(newBtn);
    });

    // O Drawer deve estar aberto com o título "Nova Paciente"
    expect(screen.getByText('Preencha os dados cadastrais mínimos para agendamento')).toBeInTheDocument();

    // Tentar salvar sem preencher
    const saveBtn = screen.getByRole('button', { name: 'Cadastrar Paciente' });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    expect(screen.getByText('Nome da paciente é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Telefone para contato é obrigatório.')).toBeInTheDocument();
  });

  it('exibe modal de inativação lógica com salvaguarda legal da Lei nº 13.787/2018', async () => {
    mocks.apiPost.mockResolvedValueOnce(undefined);

    render(<PatientsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Juliana Costa Lima')).toBeInTheDocument();
    });

    const inativarBtn = screen.getByLabelText('Inativar Juliana Costa Lima');
    await act(async () => {
      fireEvent.click(inativarBtn);
    });

    expect(screen.getByText('Inativar Cadastro de Paciente')).toBeInTheDocument();
    expect(screen.getByText(/Salvaguarda Legal \(Lei nº 13.787\/2018\)/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Confirmar Inativação' });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mocks.apiPost).toHaveBeenCalledWith('/patients/pat-1/deactivate', undefined, undefined);
  });

  it('segrega dados cadastrais de anamnese clínica conforme MED-01', async () => {
    render(<PatientsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Juliana Costa Lima')).toBeInTheDocument();
    });

    // Certificar que campos estritamente clínicos não aparecem no painel administrativo
    expect(screen.queryByText('Anamnese')).not.toBeInTheDocument();
    expect(screen.queryByText('Queixa Principal')).not.toBeInTheDocument();
    expect(screen.queryByText('DUM')).not.toBeInTheDocument();
    expect(screen.queryByText('Exame Especular')).not.toBeInTheDocument();
  });
});
