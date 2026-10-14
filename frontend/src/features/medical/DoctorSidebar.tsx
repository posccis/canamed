import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  Users,
  ClipboardList,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Session } from '../auth/authApi';
import { DOCTOR_PATHS } from '../../navigation/routes';
import { CanamedLogoLonga, CanamedLogoCurta } from '../../shared/CanamedLogo';

interface DoctorSidebarProps {
  session?: Session;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut?: () => void;
  badges?: Record<string, number | string>;
}

const DOCTOR_NAV_MAIN = [
  { to: DOCTOR_PATHS.home, label: 'Dashboard Clínico', icon: LayoutDashboard, end: true },
  { to: DOCTOR_PATHS.consultation, label: 'Consultório Virtual', icon: Stethoscope, end: false },
  { to: DOCTOR_PATHS.agenda, label: 'Minha Agenda', icon: CalendarDays, end: false },
  { to: DOCTOR_PATHS.queue, label: 'Minha fila', icon: Users, end: false },
  { to: DOCTOR_PATHS.records, label: 'Prontuário (PEP)', icon: ClipboardList, end: false },
] as const;

const DOCTOR_NAV_DOCS = [
  { to: DOCTOR_PATHS.documents, label: 'Documentos', icon: FileText, end: false },
  { to: DOCTOR_PATHS.returns, label: 'Retornos e Prazos', icon: Clock, end: false },
] as const;

/**
 * Sidebar médica moderna, com visual SaaS limpo sobre fundo branco (SPEC-UI-001 & protótipo oficial).
 * - Fundo branco (#ffffff) com borda suave lateral.
 * - Indicador visual ativo no Accent Color (#66CDAA) e destaque no Teal oficial (#008080).
 * - Colapsável de 250px para 72px com transições suaves e acessibilidade preservada.
 */
export function DoctorSidebar({
  session,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  badges = {},
}: DoctorSidebarProps) {
  function getInitials(name?: string): string {
    if (!name) return 'DR';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        aria-label="Navegação do consultório médico"
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
            <NavLink
              to={DOCTOR_PATHS.home}
              className="sidebar__logo-link"
              onClick={onCloseMobile}
              title="CANA MED — Início do Médico"
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
            </NavLink>
          </div>

          {/* Navegação Principal */}
          <nav className="sidebar__nav">
            {!collapsed && <div className="sidebar__section-title">Principal</div>}

            {DOCTOR_NAV_MAIN.map((item) => {
              const IconComponent = item.icon;
              const hasBadge = badges[item.to] !== undefined;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="sidebar__item-indicator" />}
                      <span className="sidebar__item-icon">
                        <IconComponent size={19} strokeWidth={2} />
                      </span>

                      {!collapsed && (
                        <>
                          <span className="sidebar__item-text">{item.label}</span>
                          {hasBadge && (
                            <span className="sidebar__badge">{badges[item.to]}</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}

            <div className="sidebar__divider" />
            {!collapsed && <div className="sidebar__section-title">Documentos & Prazos</div>}

            {DOCTOR_NAV_DOCS.map((item) => {
              const IconComponent = item.icon;
              const hasBadge = badges[item.to] !== undefined;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="sidebar__item-indicator" />}
                      <span className="sidebar__item-icon">
                        <IconComponent size={19} strokeWidth={2} />
                      </span>

                      {!collapsed && (
                        <>
                          <span className="sidebar__item-text">{item.label}</span>
                          {hasBadge && (
                            <span className="sidebar__badge">{badges[item.to]}</span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Perfil do Usuário e Botão de Colapso */}
        <div className="sidebar__footer">
          <div
            className="sidebar__user-profile"
            title={session?.user.name ? `${session.user.name} (${session.role})` : 'Dra. Ana Ribeiro'}
          >
            <div className="sidebar__avatar">
              {getInitials(session?.user.name)}
            </div>
            {!collapsed && (
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">
                  {session?.user.name || 'Dra. Ana Ribeiro'}
                </span>
                <span className="sidebar__user-role">
                  {session?.role === 'gestor' ? 'Gestor Clínico' : 'Ginecologista'}
                </span>
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
