import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Users,
  UserCog,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Session } from '../auth/authApi';
import type { StaffView } from '../../navigation/routes';
import { CanamedLogoLonga, CanamedLogoCurta } from '../../shared/CanamedLogo';

type SidebarProps = {
  session: Session;
  view: StaffView;
  onChangeView: (view: StaffView) => void;
  /** Abre a superfície dedicada do profissional de saúde (`/medico`). */
  onOpenDoctorSurface: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

function formatRole(role?: string): string {
  switch (role) {
    case 'admin':
      return 'Administrador Geral (Total)';
    case 'gestor':
      return 'Gestor Clínico';
    case 'recepcionista':
      return 'Recepção';
    case 'profissional':
      return 'Médico(a)';
    case 'dpo':
      return 'Encarregado DPO';
    default:
      return role || 'Colaborador';
  }
}

function getInitials(name?: string): string {
  if (!name) return 'CM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Sidebar administrativa e operacional moderna com visual SaaS limpo (SPEC-0032).
 * - Fundo branco (#ffffff) com borda suave lateral (#e2e8f0).
 * - Estrutura operacional enxuta: 5 itens centrais + Configurações no rodapé.
 * - Perfil do usuário e colapso responsivo (250px <-> 72px).
 */
export function Sidebar({
  session,
  view,
  onChangeView,
  onOpenDoctorSurface,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const canConfigureAgenda = session.permissions.includes('agenda:configure');
  const canReadClinic = session.permissions.includes('clinic:read');
  const canAccessWorkspace =
    session.permissions.includes('workspace:access') ||
    session.permissions.includes('records:read') ||
    session.role === 'profissional' ||
    session.role === 'gestor' ||
    session.role === 'admin';

  const canAccessSettings =
    session.permissions.includes('clinic:manage') ||
    session.permissions.includes('users:manage') ||
    session.permissions.includes('policy:manage') ||
    session.permissions.includes('dpo:manage') ||
    session.role === 'gestor' ||
    session.role === 'admin';

  function handleNav(target: StaffView) {
    onChangeView(target);
    onCloseMobile();
  }

  function handleOpenDoctorSurface() {
    onOpenDoctorSurface();
    onCloseMobile();
  }

  return (
    <>
      {/* Backdrop para navegação mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          role="presentation"
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 90,
            backdropFilter: 'blur(3px)',
          }}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
        aria-label="Navegação principal da aplicação"
      >
        {/* Botão Encolher/Expandir Flutuante (Protótipo Oficial) */}
        <button
          type="button"
          className="sidebar__floating-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflowY: 'auto' }}>
          {/* Cabeçalho com Logo Oficial */}
          <div className="sidebar__header">
            <a
              href="#dashboard"
              className="sidebar__logo-link"
              onClick={(e) => {
                e.preventDefault();
                handleNav('dashboard');
              }}
              title="CANA MED — Página Inicial"
            >
              {collapsed ? (
                <div className="sidebar__logo-icon-container">
                  <CanamedLogoCurta height={36} className="sidebar__logo-icon" />
                </div>
              ) : (
                <div className="sidebar__logo-img-container">
                  <CanamedLogoLonga height={36} className="sidebar__logo-img" />
                </div>
              )}
            </a>
          </div>

          {/* Navegação Operacional Principal */}
          <nav className="sidebar__nav">
            {!collapsed && <div className="sidebar__section-title">Operação da Clínica</div>}

            {/* Dashboard */}
            <button
              type="button"
              className={`sidebar__item ${view === 'dashboard' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('dashboard')}
              title={collapsed ? 'Dashboard' : 'Painel Geral e Indicadores'}
              aria-label={collapsed ? 'Dashboard' : undefined}
              data-tooltip="Dashboard"
            >
              {view === 'dashboard' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <LayoutDashboard size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Dashboard</span>}
            </button>

            {/* Agenda & Recepção (Consolidado - SPEC-0032) */}
            <button
              type="button"
              className={`sidebar__item ${view === 'agenda' || view === 'queue' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('agenda')}
              title={collapsed ? 'Agenda & Recepção' : 'Agenda de Consultas e Fila de Chegadas'}
              aria-label={collapsed ? 'Agenda & Recepção' : undefined}
              data-tooltip="Agenda & Recepção"
            >
              {(view === 'agenda' || view === 'queue') && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <CalendarDays size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Agenda & Recepção</span>}
            </button>

            {/* Pacientes */}
            <button
              type="button"
              className={`sidebar__item ${view === 'patients' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('patients')}
              title={collapsed ? 'Pacientes' : 'Gestão de Pacientes da Clínica'}
              aria-label={collapsed ? 'Pacientes' : undefined}
              data-tooltip="Pacientes"
            >
              {view === 'patients' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <Users size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Pacientes</span>}
            </button>

            {/* Equipe Médica & Profissionais */}
            {canConfigureAgenda || canReadClinic || session.role === 'gestor' ? (
              <button
                type="button"
                className={`sidebar__item ${view === 'professionals' ? 'sidebar__item--active' : ''}`}
                onClick={() => handleNav('professionals')}
                title={collapsed ? 'Equipe Médica' : 'Corpo Clínico e Especialistas'}
                aria-label={collapsed ? 'Equipe Médica' : undefined}
                data-tooltip="Equipe Médica"
              >
                {view === 'professionals' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <UserCog size={19} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sidebar__item-label">Equipe Médica</span>}
              </button>
            ) : null}

            {/* Caixa & Financeiro Básico */}
            <button
              type="button"
              className={`sidebar__item ${view === 'cashier' || view === 'financial' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('cashier')}
              title={collapsed ? 'Caixa Diário' : 'Frente de Caixa e Recebimentos'}
              aria-label={collapsed ? 'Caixa Diário' : undefined}
              data-tooltip="Caixa Diário"
            >
              {(view === 'cashier' || view === 'financial') && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <Receipt size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Caixa Diário</span>}
            </button>

            {/* Meu Consultório — superfície dedicada do médico em /medico (SPEC-0026/RN-001) */}
            {canAccessWorkspace ? (
              <button
                type="button"
                className="sidebar__item"
                onClick={handleOpenDoctorSurface}
                title={collapsed ? 'Consultório' : 'Meu Consultório Virtual e Prontuário Eletrônico (PEP)'}
                aria-label={collapsed ? 'Consultório' : undefined}
                data-tooltip="Consultório"
              >
                <span className="sidebar__item-icon">
                  <Stethoscope size={19} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sidebar__item-label">Consultório</span>}
              </button>
            ) : null}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Configurações, Perfil do Usuário e Botão de Colapso */}
        <div className="sidebar__footer">
          {/* Item Configurações da Clínica no rodapé (SPEC-0032) */}
          {canAccessSettings && (
            <button
              type="button"
              className={`sidebar__item ${view === 'settings' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('settings')}
              title={collapsed ? 'Configurações' : 'Configurações da Clínica (Salas, Convênios, Regras, Equipe e LGPD)'}
              aria-label={collapsed ? 'Configurações' : undefined}
              data-tooltip="Configurações"
              style={{ marginBottom: '0.5rem' }}
            >
              {view === 'settings' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <Settings size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Configurações</span>}
            </button>
          )}

          <div
            className="sidebar__user-profile"
            title={`${session.user.name} (${formatRole(session.role)})`}
          >
            <div className="sidebar__avatar">
              {getInitials(session.user.name)}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{session.user.name}</span>
                <span className="sidebar__user-role">{formatRole(session.role)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="sidebar__toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <>
                <ChevronLeft size={17} />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
