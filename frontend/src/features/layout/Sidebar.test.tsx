import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import type { Session } from '../auth/authApi';

const baseSession: Session = {
  user: { id: 'u1', name: 'Dra. Marina Rocha', email: 'marina@canamed.local' },
  clinicId: 'c1',
  clinicName: 'Clínica Cana Med',
  role: 'gestor',
  permissions: [
    'users:manage',
    'agenda:configure',
    'clinic:read',
    'agenda:write',
    'workspace:access',
    'dpo:manage',
    'policy:manage',
  ],
  professionalId: 'p1',
  mfaEnabled: true,
  mfaPending: false,
  clinics: [{ id: 'c1', name: 'Clínica Cana Med', role: 'gestor' }],
  expiresAt: '2026-10-15T00:00:00Z',
};

describe('Sidebar Component (Design SaaS Branco — SPEC-UI-001)', () => {
  it('renderiza todas as seções e itens de navegação quando usuário tem permissões completas', () => {
    const onChangeView = vi.fn();
    const onOpenDoctorSurface = vi.fn();
    const onToggleCollapse = vi.fn();
    const onCloseMobile = vi.fn();

    render(
      <Sidebar
        session={baseSession}
        view="dashboard"
        onChangeView={onChangeView}
        onOpenDoctorSurface={onOpenDoctorSurface}
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    // Seções
    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByText('Administração')).toBeInTheDocument();

    // Itens da seção Principal
    expect(screen.getByRole('button', { name: /^Dashboard$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Agenda$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Consultório$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Recepção$/ })).toBeInTheDocument();

    // Itens da seção Administração
    expect(screen.getByRole('button', { name: /^Operação$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Catálogo$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Usuários$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Central de Links$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Painel TV$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^DPO \(LGPD\)$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Políticas$/ })).toBeInTheDocument();

    // Perfil do usuário no rodapé
    expect(screen.getByText('Dra. Marina Rocha')).toBeInTheDocument();
    expect(screen.getByText('Gestor Clínico')).toBeInTheDocument();
    expect(screen.getByText('DR')).toBeInTheDocument();
  });

  it('destaca visualmente o item ativo e inclui o indicador accent lateral', () => {
    const { container } = render(
      <Sidebar
        session={baseSession}
        view="agenda"
        onChangeView={vi.fn()}
        onOpenDoctorSurface={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />
    );

    const agendaBtn = screen.getByRole('button', { name: /^Agenda$/ });
    expect(agendaBtn).toHaveClass('sidebar__item--active');

    const indicator = container.querySelector('.sidebar__item-indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('aciona onChangeView ao clicar em um item de navegação', () => {
    const onChangeView = vi.fn();
    const onCloseMobile = vi.fn();

    render(
      <Sidebar
        session={baseSession}
        view="dashboard"
        onChangeView={onChangeView}
        onOpenDoctorSurface={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    const agendaBtn = screen.getByRole('button', { name: /^Agenda$/ });
    fireEvent.click(agendaBtn);

    expect(onChangeView).toHaveBeenCalledWith('agenda');
    expect(onCloseMobile).toHaveBeenCalled();
  });

  it('aciona onOpenDoctorSurface ao clicar no botão Consultório', () => {
    const onOpenDoctorSurface = vi.fn();
    const onCloseMobile = vi.fn();

    render(
      <Sidebar
        session={baseSession}
        view="dashboard"
        onChangeView={vi.fn()}
        onOpenDoctorSurface={onOpenDoctorSurface}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={onCloseMobile}
      />
    );

    const consultorioBtn = screen.getByRole('button', { name: /^Consultório$/ });
    fireEvent.click(consultorioBtn);

    expect(onOpenDoctorSurface).toHaveBeenCalled();
    expect(onCloseMobile).toHaveBeenCalled();
  });

  it('oculta itens restritos quando usuário não possui permissões RBAC', () => {
    const restrictedSession: Session = {
      ...baseSession,
      role: 'recepcionista',
      permissions: ['agenda:write'], // apenas fila/recepção
    };

    render(
      <Sidebar
        session={restrictedSession}
        view="dashboard"
        onChangeView={vi.fn()}
        onOpenDoctorSurface={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^Dashboard$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Agenda$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Recepção$/ })).toBeInTheDocument();

    // Restritos
    expect(screen.queryByRole('button', { name: /^Consultório$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Operação$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Catálogo$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Usuários$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^DPO \(LGPD\)$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Políticas$/ })).not.toBeInTheDocument();
  });

  it('alterna o estado recolhido/expandido ao clicar no botão de toggle', () => {
    const onToggleCollapse = vi.fn();

    const { rerender } = render(
      <Sidebar
        session={baseSession}
        view="dashboard"
        onChangeView={vi.fn()}
        onOpenDoctorSurface={vi.fn()}
        collapsed={false}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /Recolher barra lateral/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.getByText('Recolher')).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);

    // Quando recolhido
    rerender(
      <Sidebar
        session={baseSession}
        view="dashboard"
        onChangeView={vi.fn()}
        onOpenDoctorSurface={vi.fn()}
        collapsed={true}
        onToggleCollapse={onToggleCollapse}
        mobileOpen={false}
        onCloseMobile={vi.fn()}
      />
    );

    const expandBtn = screen.getByRole('button', { name: /Expandir barra lateral/i });
    expect(expandBtn).toBeInTheDocument();
    expect(screen.queryByText('Recolher')).not.toBeInTheDocument();
    // Labels dos títulos de seção ficam ocultos no modo recolhido
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
    expect(screen.queryByText('Principal')).not.toBeInTheDocument();
  });
});
