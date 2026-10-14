import {
  LayoutDashboard,
  CalendarDays,
  Stethoscope,
  Users,
  Building2,
  BookOpen,
  UserCog,
  Link2,
  Tv,
  ShieldCheck,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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

function formatRole(role?: string): string {
  switch (role) {
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
 * Sidebar administrativa e operacional moderna com visual SaaS limpo (SPEC-UI-001 & protótipo oficial).
 * - Fundo branco (#ffffff) com borda suave lateral (#e2e8f0).
 * - Indicador visual ativo no Accent Color (#66CDAA) e destaque no Teal oficial (#008080).
 * - Organização em seções: "Principal" e "Administração".
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
                  <img
                    src="/assets/brand/canamed-mulher-logocurta.png"
                    alt="CANA MED Mulher"
                    className="sidebar__logo-icon"
                  />
                </div>
              ) : (
                <div className="sidebar__logo-img-container">
                  <img
                    src="/assets/brand/canamed-mulher-logolonga.png"
                    alt="CANA MED Mulher — Eficiência Para Quem Mais Precisa"
                    className="sidebar__logo-img"
                  />
                </div>
              )}
            </a>
          </div>

          {/* Navegação Principal */}
          <nav className="sidebar__nav">
            {!collapsed && <div className="sidebar__section-title">Principal</div>}

            {/* Dashboard */}
            <button
              type="button"
              className={`sidebar__item ${view === 'dashboard' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('dashboard')}
              title={collapsed ? 'Dashboard' : 'Painel Geral e Indicadores'}
              aria-label={collapsed ? 'Dashboard' : undefined}
            >
              {view === 'dashboard' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <LayoutDashboard size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Dashboard</span>}
            </button>

            {/* Agenda */}
            <button
              type="button"
              className={`sidebar__item ${view === 'agenda' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('agenda')}
              title={collapsed ? 'Agenda' : 'Agenda de Consultas'}
              aria-label={collapsed ? 'Agenda' : undefined}
            >
              {view === 'agenda' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <CalendarDays size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Agenda</span>}
            </button>

            {/* Pacientes */}
            <button
              type="button"
              className={`sidebar__item ${view === 'patients' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('patients')}
              title={collapsed ? 'Pacientes' : 'Gestão de Pacientes da Clínica'}
              aria-label={collapsed ? 'Pacientes' : undefined}
            >
              {view === 'patients' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <Users size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Pacientes</span>}
            </button>

            {/* Profissionais */}
            {canConfigureAgenda || canReadClinic || session.role === 'gestor' ? (
              <button
                type="button"
                className={`sidebar__item ${view === 'professionals' ? 'sidebar__item--active' : ''}`}
                onClick={() => handleNav('professionals')}
                title={collapsed ? 'Profissionais' : 'Corpo Clínico e Especialistas'}
                aria-label={collapsed ? 'Profissionais' : undefined}
              >
                {view === 'professionals' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <UserCog size={19} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sidebar__item-label">Profissionais</span>}
              </button>
            ) : null}

            {/* Meu Consultório — superfície dedicada do médico em /medico (SPEC-0026/RN-001) */}
            {canAccessWorkspace ? (
              <button
                type="button"
                className="sidebar__item"
                onClick={handleOpenDoctorSurface}
                title={collapsed ? 'Consultório' : 'Meu Consultório Virtual e Prontuário Eletrônico (PEP)'}
                aria-label={collapsed ? 'Consultório' : undefined}
              >
                <span className="sidebar__item-icon">
                  <Stethoscope size={19} strokeWidth={2} />
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
                title={collapsed ? 'Recepção' : 'Recepção e Fila de Espera'}
                aria-label={collapsed ? 'Recepção' : undefined}
              >
                {view === 'queue' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <Users size={19} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sidebar__item-label">Recepção</span>}
              </button>
            ) : null}

            {/* Divisor & Seção Administração */}
            <div className="sidebar__divider" />
            {!collapsed && <div className="sidebar__section-title">Administração</div>}

            {/* Operação */}
            {canReadClinic ? (
              <button
                type="button"
                className={`sidebar__item ${view === 'operation' ? 'sidebar__item--active' : ''}`}
                onClick={() => handleNav('operation')}
                title={collapsed ? 'Operação' : 'Gestão Operacional (Salas, Convênios, Horários e Feriados)'}
                aria-label={collapsed ? 'Operação' : undefined}
              >
                {view === 'operation' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <Building2 size={19} strokeWidth={2} />
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
                title={collapsed ? 'Catálogo' : 'Catálogo Assistencial e Classificação'}
                aria-label={collapsed ? 'Catálogo' : undefined}
              >
                {view === 'catalog' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <BookOpen size={19} strokeWidth={2} />
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
                title={collapsed ? 'Usuários' : 'Gestão de Usuários e Permissões'}
                aria-label={collapsed ? 'Usuários' : undefined}
              >
                {view === 'users' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <UserCog size={19} strokeWidth={2} />
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
                title={collapsed ? 'Central de Links' : 'Central de Links — copie e compartilhe os endereços do paciente'}
                aria-label={collapsed ? 'Central de Links' : undefined}
              >
                {view === 'links' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <Link2 size={19} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sidebar__item-label">Central de Links</span>}
              </button>
            ) : null}

            {/* Painel TV Recepção */}
            <button
              type="button"
              className={`sidebar__item ${view === 'tv' ? 'sidebar__item--active' : ''}`}
              onClick={() => handleNav('tv')}
              title={collapsed ? 'Painel TV' : 'Painel de Chamada para TV do Saguão (SPEC-0020)'}
              aria-label={collapsed ? 'Painel TV' : undefined}
            >
              {view === 'tv' && <div className="sidebar__item-indicator" />}
              <span className="sidebar__item-icon">
                <Tv size={19} strokeWidth={2} />
              </span>
              {!collapsed && <span className="sidebar__item-label">Painel TV</span>}
            </button>

            {/* DPO & LGPD */}
            {canAccessDpo ? (
              <button
                type="button"
                className={`sidebar__item ${view === 'dpo' ? 'sidebar__item--active' : ''}`}
                onClick={() => handleNav('dpo')}
                title={collapsed ? 'DPO (LGPD)' : 'Painel do DPO e Governança LGPD (SPEC-0023)'}
                aria-label={collapsed ? 'DPO (LGPD)' : undefined}
              >
                {view === 'dpo' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <ShieldCheck size={19} strokeWidth={2} />
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
                title={collapsed ? 'Políticas' : 'Políticas de Agendamento e Encaixes (SPEC-0025)'}
                aria-label={collapsed ? 'Políticas' : undefined}
              >
                {view === 'policies' && <div className="sidebar__item-indicator" />}
                <span className="sidebar__item-icon">
                  <SlidersHorizontal size={19} strokeWidth={2} />
                </span>
                {!collapsed && <span className="sidebar__item-label">Políticas</span>}
              </button>
            ) : null}
          </nav>
        </div>

        {/* Rodapé da Sidebar: Perfil do Usuário e Botão de Colapso */}
        <div className="sidebar__footer">
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
