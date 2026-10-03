import type { Session } from '../auth/authApi';

export type AppView =
  | 'dashboard'
  | 'agenda'
  | 'queue'
  | 'operation'
  | 'catalog'
  | 'users'
  | 'workspace'
  | 'portal'
  | 'kiosk'
  | 'privacy'
  | 'cashier'
  | 'financial'
  | 'inventory'
  | 'dpo'
  | 'policies'
  | 'tv';

type SidebarProps = {
  session: Session;
  view: AppView;
  onChangeView: (view: AppView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({
  session,
  view,
  onChangeView,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const canManageUsers = session.permissions.includes('users:manage');
  const canConfigureAgenda = session.permissions.includes('agenda:configure');
  const canReadClinic = session.permissions.includes('clinic:read');
  const canOperateQueue =
    session.permissions.includes('agenda:write') || session.permissions.includes('agenda:read:own');
  const canAccessWorkspace =
    session.permissions.includes('workspace:access') ||
    session.permissions.includes('records:read') ||
    session.role === 'profissional' ||
    session.role === 'gestor';

  const canOperateCashier =
    session.permissions.includes('cashier:manage') ||
    session.permissions.includes('cashier:view-all') ||
    session.role === 'gestor' ||
    session.role === 'recepcao';

  const canAccessFinancial =
    session.permissions.includes('financial:admin') ||
    session.permissions.includes('payout:manage') ||
    session.permissions.includes('payout:view-own') ||
    session.role === 'gestor' ||
    session.role === 'profissional';

  const canAccessInventory =
    session.permissions.includes('inventory:read') ||
    session.permissions.includes('inventory:manage') ||
    session.role === 'gestor' ||
    session.role === 'recepcao';

  const canAccessDpo =
    session.permissions.includes('dpo:manage') ||
    session.role === 'gestor' ||
    session.role === 'dpo';

  const canManagePolicies =
    session.permissions.includes('policy:manage') ||
    session.role === 'gestor';

  function handleNav(target: AppView) {
    onChangeView(target);
    onCloseMobile();
  }

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
      aria-label="Navegação principal da aplicação"
    >
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
              <img
                src="/assets/brand/canamed_logo-removebg-preview.png"
                alt="CANA MED"
                className="sidebar__logo-icon"
              />
            </div>
          ) : (
            <div className="sidebar__logo-img-container">
              <img
                src="/assets/brand/canadamed_logogrande_comtitulo-removebg-preview.png"
                alt="CANA MED — Eficiência Para Quem Mais Precisa"
                className="sidebar__logo-img"
              />
            </div>
          )}
        </a>
      </div>

      <nav className="sidebar__nav">
        {/* Dashboard */}
        <button
          type="button"
          className={`sidebar__item ${view === 'dashboard' ? 'sidebar__item--active' : ''}`}
          onClick={() => handleNav('dashboard')}
          title="Painel Geral e Indicadores"
        >
          <span className="sidebar__item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar__item-label">Dashboard</span>}
        </button>

        {/* Agenda */}
        <button
          type="button"
          className={`sidebar__item ${view === 'agenda' ? 'sidebar__item--active' : ''}`}
          onClick={() => handleNav('agenda')}
          title="Agenda de Consultas"
        >
          <span className="sidebar__item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar__item-label">Agenda</span>}
        </button>

        {/* Meu Consultório (SPEC-0010, SPEC-0011, SPEC-0012) */}
        {canAccessWorkspace ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'workspace' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('workspace')}
            title="Meu Consultório Virtual e Prontuário Eletrônico (PEP)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 3v5a5 5 0 0 0 10 0V3" />
                <path d="M9 13v3a4 4 0 0 0 8 0v-2" />
                <circle cx="17" cy="14" r="2" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Consultório</span>}
          </button>
        ) : null}

        {/* Recepção / Fila */}
        {canOperateQueue ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'queue' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('queue')}
            title="Recepção e Fila de Espera"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Recepção</span>}
          </button>
        ) : null}

        {/* Operação */}
        {canReadClinic ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'operation' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('operation')}
            title="Gestão Operacional (Salas, Convênios, Horários e Feriados)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Operação</span>}
          </button>
        ) : null}

        {/* Catálogo */}
        {canConfigureAgenda ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'catalog' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('catalog')}
            title="Catálogo Assistencial e Classificação"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Catálogo</span>}
          </button>
        ) : null}

        {/* Usuários */}
        {canManageUsers ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'users' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('users')}
            title="Gestão de Usuários e Permissões"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Usuários</span>}
          </button>
        ) : null}

        {/* Divisor Visão do Paciente */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

        {/* Portal do Paciente */}
        <button
          type="button"
          className={`sidebar__item ${view === 'portal' ? 'sidebar__item--active' : ''}`}
          onClick={() => handleNav('portal')}
          title="Portal do Paciente e Agendamento Online"
        >
          <span className="sidebar__item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar__item-label">Portal Paciente</span>}
        </button>

        {/* Totem de Autoatendimento */}
        <button
          type="button"
          className={`sidebar__item ${view === 'kiosk' ? 'sidebar__item--active' : ''}`}
          onClick={() => handleNav('kiosk')}
          title="Totem de Autoatendimento e Check-in"
        >
          <span className="sidebar__item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar__item-label">Totem Check-in</span>}
        </button>

        {/* Privacidade LGPD */}
        <button
          type="button"
          className={`sidebar__item ${view === 'privacy' ? 'sidebar__item--active' : ''}`}
          onClick={() => handleNav('privacy')}
          title="Autonomia e Privacidade (LGPD)"
        >
          <span className="sidebar__item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar__item-label">Privacidade (LGPD)</span>}
        </button>

        {/* Divisor Visão Administrativa */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

        {/* Frente de Caixa */}
        {canOperateCashier ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'cashier' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('cashier')}
            title="Frente de Caixa e Fechamento de Turno (SPEC-0019)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="7" cy="15" r="1" />
                <circle cx="12" cy="15" r="1" />
                <circle cx="17" cy="15" r="1" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Caixa</span>}
          </button>
        ) : null}

        {/* Painel TV Recepção */}
        <button
          type="button"
          className={`sidebar__item ${view === 'tv' ? 'sidebar__item--active' : ''}`}
          onClick={() => handleNav('tv')}
          title="Painel de Chamada para TV do Saguão (SPEC-0020)"
        >
          <span className="sidebar__item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
              <polyline points="17 2 12 7 7 2" />
            </svg>
          </span>
          {!collapsed && <span className="sidebar__item-label">Painel TV</span>}
        </button>

        {/* Financeiro & Repasses */}
        {canAccessFinancial ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'financial' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('financial')}
            title="Gestão Financeira e Repasses Médicos (SPEC-0021)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Financeiro</span>}
          </button>
        ) : null}

        {/* Estoque & Insumos */}
        {canAccessInventory ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'inventory' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('inventory')}
            title="Gestão de Insumos e Materiais Médicos (SPEC-0022)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Estoque</span>}
          </button>
        ) : null}

        {/* DPO & LGPD */}
        {canAccessDpo ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'dpo' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('dpo')}
            title="Painel do DPO e Governança LGPD (SPEC-0023)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">DPO (LGPD)</span>}
          </button>
        ) : null}

        {/* Políticas da Clínica */}
        {canManagePolicies ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'policies' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('policies')}
            title="Políticas de Agendamento e Encaixes (SPEC-0025)"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Políticas</span>}
          </button>
        ) : null}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__toggle-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {collapsed ? '▶' : '◀ Recolher'}
        </button>
      </div>
    </aside>
  );
}
