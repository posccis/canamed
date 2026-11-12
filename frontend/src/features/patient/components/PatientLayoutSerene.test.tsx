import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PatientLayoutSerene } from './PatientLayoutSerene';

describe('PatientLayoutSerene Component (Task 10 - SPEC-0036 / Serene Bloom Shell)', () => {
  it('renderiza barra de navegação inferior mobile com 5 itens e alvos de toque adequados', () => {
    const handleTabChange = vi.fn();
    render(
      <PatientLayoutSerene activeTab="inicio" onTabChange={handleTabChange}>
        <div>Conteúdo de teste</div>
      </PatientLayoutSerene>
    );

    // Conteúdo filho
    expect(screen.getByText('Conteúdo de teste')).toBeInTheDocument();

    // Mobile nav
    const mobileNav = screen.getByRole('navigation', { name: /Navegação Principal Mobile/i });
    expect(mobileNav).toBeInTheDocument();

    // 5 tabs mobile dentro de mobileNav
    expect(within(mobileNav).getByRole('button', { name: /Início/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Agendar/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Consultas/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Pré-natal/i })).toBeInTheDocument();
    expect(within(mobileNav).getByRole('button', { name: /Perfil/i })).toBeInTheDocument();

    // Clicar em uma tab
    fireEvent.click(within(mobileNav).getByRole('button', { name: /Pré-natal/i }));
    expect(handleTabChange).toHaveBeenCalledWith('cartao-gestante');
  });

  it('oculta completamente a navegação inferior mobile quando hideBottomNav for true (RN-020 / [P0-2])', () => {
    render(
      <PatientLayoutSerene hideBottomNav={true}>
        <div>Formulário Transacional</div>
      </PatientLayoutSerene>
    );

    expect(screen.getByText('Formulário Transacional')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /Navegação Principal Mobile/i })).not.toBeInTheDocument();
  });

  it('renderiza SideNavBar desktop de 288px com links, perfil e botão de sair', () => {
    const handleLogout = vi.fn();
    render(
      <PatientLayoutSerene
        patientName="Juliana Rocha Mendes"
        gestationalWeekText="26ª Semana"
        onLogout={handleLogout}
      >
        <div>Dashboard desktop</div>
      </PatientLayoutSerene>
    );

    const sideNav = screen.getByRole('complementary', { name: /Menu Lateral Desktop/i });
    expect(sideNav).toBeInTheDocument();
    expect(sideNav).toHaveClass('w-72');

    // Identidade do portal
    expect(within(sideNav).getByText(/Portal da Paciente/i)).toBeInTheDocument();

    // Dados da paciente no rodapé da sidebar
    expect(within(sideNav).getByText(/Juliana Rocha Mendes/i)).toBeInTheDocument();
    expect(within(sideNav).getByText(/26ª Semana/i)).toBeInTheDocument();

    // Botão Sair
    const logoutBtn = within(sideNav).getByRole('button', { name: /Sair da conta/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it('renderiza TopNavBar desktop com breadcrumbs e botão Plantão de Emergência', () => {
    render(
      <PatientLayoutSerene
        breadcrumbs={[
          { label: 'Início', href: '#inicio' },
          { label: 'Pré-Natal', href: '#prenatal' },
          { label: 'Cartão da Gestante' },
        ]}
      >
        <div>Área com breadcrumbs</div>
      </PatientLayoutSerene>
    );

    const topNav = screen.getByRole('banner', { name: /Barra Superior Desktop/i });
    expect(topNav).toBeInTheDocument();

    // Breadcrumbs dentro do TopNav
    expect(within(topNav).getByText('Início')).toBeInTheDocument();
    expect(within(topNav).getByText('Pré-Natal')).toBeInTheDocument();
    expect(within(topNav).getByText('Cartão da Gestante')).toBeInTheDocument();

    // Botão de Plantão de Emergência
    const emergencyBtn = within(topNav).getByRole('link', { name: /Plantão de Emergência/i });
    expect(emergencyBtn).toBeInTheDocument();
  });
});
