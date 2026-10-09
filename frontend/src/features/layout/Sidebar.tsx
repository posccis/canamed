import type { Session } from '../auth/authApi';
import type { StaffView } from '../../navigation/routes';

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

  const canAccessDpo =
    session.permissions.includes('dpo:manage') ||
    session.role === 'gestor' ||
    session.role === 'dpo';

  const canManagePolicies =
    session.permissions.includes('policy:manage') ||
    session.role === 'gestor';

  function handleNav(target: StaffView) {
    onChangeView(target);
    onCloseMobile();
  }

  function handleOpenDoctorSurface() {
    onOpenDoctorSurface();
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

        {/* Meu Consultório — superfície dedicada do médico em /medico (SPEC-0026/RN-001) */}
        {canAccessWorkspace ? (
          <button
            type="button"
            className="sidebar__item"
            onClick={handleOpenDoctorSurface}
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

        {/* Central de Links — endereços compartilháveis da superfície do paciente (SPEC-0026/RN-018) */}
        {canOperateQueue || canReadClinic ? (
          <button
            type="button"
            className={`sidebar__item ${view === 'links' ? 'sidebar__item--active' : ''}`}
            onClick={() => handleNav('links')}
            title="Central de Links — copie e compartilhe os endereços do paciente"
          >
            <span className="sidebar__item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">Central de Links</span>}
          </button>
        ) : null}

        {/* Divisor Visão Administrativa */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

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
