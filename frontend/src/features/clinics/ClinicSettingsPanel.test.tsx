import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClinicSettingsPanel } from './ClinicSettingsPanel';

// Mocks dos subpainéis
vi.mock('./OperationPanel', () => ({
  OperationPanel: () => <div data-testid="mock-operation-panel">Painel de Operação</div>,
}));

vi.mock('../admin/RevenueTypesSettings', () => ({
  RevenueTypesSettings: () => <div data-testid="mock-revenue-settings">Configuração de Tipos de Entrada</div>,
}));

vi.mock('../admin/ClinicPolicyPanel', () => ({
  ClinicPolicyPanel: () => <div data-testid="mock-policy-panel">Políticas de Agendamento</div>,
}));

vi.mock('../auth/UsersPanel', () => ({
  UsersPanel: () => <div data-testid="mock-users-panel">Painel de Usuários</div>,
}));

vi.mock('../layout/LinksPanel', () => ({
  LinksPanel: () => <div data-testid="mock-links-panel">Central de Links</div>,
}));

vi.mock('../admin/DpoWorkspace', () => ({
  DpoWorkspace: () => <div data-testid="mock-dpo-workspace">Painel do DPO</div>,
}));

vi.mock('../auth/useSession', () => ({
  useSession: () => ({
    state: {
      status: 'authenticated',
      session: {
        clinicId: 'clinic-1',
        clinicName: 'Cana Med Mulher',
        role: 'gestor',
        permissions: ['clinic:manage', 'users:manage', 'policy:manage', 'dpo:manage'],
        user: { name: 'Dra. Gestora', email: 'gestora@canamed.com.br' },
      },
    },
  }),
}));

describe('ClinicSettingsPanel', () => {
  it('renderiza o título das configurações e as abas principais', () => {
    render(<ClinicSettingsPanel />);

    expect(screen.getByText('Configurações da Clínica')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Salas & Convênios/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tipos de Entrada Financeira/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Regras de Agendamento/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Equipe & Acessos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Link de Agendamento/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Privacidade LGPD/i })).toBeInTheDocument();
  });

  it('permite alternar entre as abas e renderizar os módulos correspondentes', () => {
    render(<ClinicSettingsPanel />);

    // Aba inicial: Salas & Convênios
    expect(screen.getByTestId('mock-operation-panel')).toBeInTheDocument();

    // Clica na aba de Tipos de Entrada Financeira
    fireEvent.click(screen.getByRole('tab', { name: /Tipos de Entrada Financeira/i }));
    expect(screen.getByTestId('mock-revenue-settings')).toBeInTheDocument();

    // Clica na aba de Regras de Agendamento
    fireEvent.click(screen.getByRole('tab', { name: /Regras de Agendamento/i }));
    expect(screen.getByTestId('mock-policy-panel')).toBeInTheDocument();

    // Clica na aba de Link de Agendamento
    fireEvent.click(screen.getByRole('tab', { name: /Link de Agendamento/i }));
    expect(screen.getByTestId('mock-links-panel')).toBeInTheDocument();
  });
});
