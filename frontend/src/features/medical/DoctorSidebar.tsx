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

interface DoctorSidebarProps {
  session?: Session;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSignOut?: () => void;
  badges?: Record<string, number | string>;
}

const DOCTOR_NAV_ITEMS = [
  { to: DOCTOR_PATHS.home, label: 'Dashboard Clínico', icon: LayoutDashboard, end: true },
  { to: DOCTOR_PATHS.consultation, label: 'Consultório Virtual', icon: Stethoscope, end: false },
  { to: DOCTOR_PATHS.agenda, label: 'Minha Agenda', icon: CalendarDays, end: false },
  { to: DOCTOR_PATHS.queue, label: 'Minha fila', icon: Users, end: false },
  { to: DOCTOR_PATHS.records, label: 'Prontuário (PEP)', icon: ClipboardList, end: false },
  { to: DOCTOR_PATHS.documents, label: 'Documentos', icon: FileText, end: false },
  { to: DOCTOR_PATHS.returns, label: 'Retornos e Prazos', icon: Clock, end: false },
] as const;

/**
 * Sidebar médica moderna, responsiva e colapsável (SPEC-0028 & SPEC-0029).
 * - O botão de Encolher/Expandir funciona nos modos 250px <-> 72px com transição suave e contenção de overflow.
 * - O botão "Sair" foi movido com sucesso para o DoctorProfileMenu no cabeçalho superior.
 */
export function DoctorSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  badges = {},
}: DoctorSidebarProps) {
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
        style={{
          width: collapsed ? 'var(--sidebar-collapsed-width, 72px)' : 'var(--sidebar-width, 250px)',
          transition: 'width var(--transition-speed) ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflowX: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Cabeçalho com Logo Oficial */}
          <div
            className="sidebar__header"
            style={{
              padding: collapsed ? '0.75rem 0.25rem' : '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              minHeight: 'var(--topbar-height, 60px)',
              borderBottom: '1px solid rgb(255 255 255 / 12%)',
            }}
          >
            <NavLink
              to={DOCTOR_PATHS.home}
              className="sidebar__logo-link"
              onClick={onCloseMobile}
              title="CANA MED — Início do Médico"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%',
                textDecoration: 'none',
              }}
            >
              {collapsed ? (
                <div
                  className="sidebar__logo-icon-container"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    margin: '0 auto',
                  }}
                >
                  <img
                    src="/assets/brand/canamed-mulher-logocurta.png"
                    alt="CANA MED Mulher"
                    className="sidebar__logo-icon"
                    style={{
                      maxHeight: '34px',
                      maxWidth: '34px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ) : (
                <div
                  className="sidebar__logo-img-container"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/assets/brand/canamed-mulher-logolonga.png"
                    alt="CANA MED Mulher — Eficiência Para Quem Mais Precisa"
                    className="sidebar__logo-img"
                    style={{
                      maxHeight: '40px',
                      maxWidth: '200px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              )}
            </NavLink>
          </div>

          {/* Navegação Principal */}
          <nav
            className="sidebar__nav"
            style={{
              padding: collapsed ? '0.75rem 0.35rem' : '0.85rem 0.65rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              overflowY: 'auto',
            }}
          >
            {DOCTOR_NAV_ITEMS.map((item) => {
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
                  style={({ isActive }) => ({
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : '0.75rem',
                    padding: collapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--radius-md)',
                    color: isActive ? '#ffffff' : 'rgb(255 255 255 / 85%)',
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    transition: 'all var(--transition-speed) ease',
                    boxSizing: 'border-box',
                    width: '100%',
                  })}
                >
                  <span
                    className="sidebar__item-icon"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      width: '20px',
                      height: '20px',
                      flexShrink: 0,
                    }}
                  >
                    <IconComponent size={19} strokeWidth={2} />
                    {collapsed && hasBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-5px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--color-warning)',
                          boxShadow: '0 0 0 2px var(--color-secondary)',
                        }}
                      />
                    )}
                  </span>

                  {!collapsed && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        className="sidebar__item-text"
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.label}
                      </span>
                      {hasBadge && (
                        <span
                          style={{
                            background: 'rgb(255 255 255 / 20%)',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.05rem 0.45rem',
                            borderRadius: '999px',
                            minWidth: '16px',
                            textAlign: 'center',
                            marginLeft: '0.5rem',
                          }}
                        >
                          {badges[item.to]}
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Apenas Botão de Alternar Colapso */}
        <div
          className="sidebar__footer"
          style={{
            borderTop: '1px solid rgb(255 255 255 / 12%)',
            padding: collapsed ? '0.75rem 0.25rem' : '0.85rem 0.75rem',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Botão de Alternar Colapso */}
          <button
            type="button"
            className="sidebar__toggle-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            style={{
              width: collapsed ? '38px' : '100%',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#ffffff',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgb(255 255 255 / 18%)',
              background: 'rgb(255 255 255 / 8%)',
              cursor: 'pointer',
              transition: 'all var(--transition-speed) ease',
            }}
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
