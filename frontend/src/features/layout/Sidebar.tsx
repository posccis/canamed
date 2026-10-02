import type { Session } from '../auth/authApi';

export type AppView = 'dashboard' | 'agenda' | 'queue' | 'operation' | 'catalog' | 'users';

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
