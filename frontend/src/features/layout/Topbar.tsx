import type { Session } from '../auth/authApi';
import type { AppView } from './Sidebar';

type TopbarProps = {
  session: Session;
  view: AppView;
  onToggleMobile: () => void;
  onSignOut: () => void;
  onOpenSearch?: () => void;
};

const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Painel Operacional',
  agenda: 'Agenda de Consultas',
  queue: 'Recepção e Fila de Espera',
  operation: 'Gestão Operacional',
  catalog: 'Catálogo Assistencial',
  users: 'Gestão de Usuários',
};

export function Topbar({ session, view, onToggleMobile, onSignOut, onOpenSearch }: TopbarProps) {
  const initial = session.user.name.trim().charAt(0).toUpperCase() || 'U';

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobile}
          aria-label="Abrir menu de navegação"
          title="Abrir menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h2 className="topbar__title">{VIEW_TITLES[view]}</h2>
        <span className="topbar__clinic-tag">
          {session.clinicName}
        </span>
      </div>

      <div className="topbar__right">
        {onOpenSearch ? (
          <button
            type="button"
            className="button button--ghost"
            onClick={onOpenSearch}
            title="Busca rápida (Ctrl+K)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.65rem',
              fontSize: '0.82rem',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <span>🔍 Buscar</span>
            <kbd
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.35rem',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--color-surface)',
                fontFamily: 'inherit'
              }}
            >
              Ctrl+K
            </kbd>
          </button>
        ) : null}

        <div className="topbar__user" title={`Usuário: ${session.user.name} (${session.user.email})`}>
          <div className="topbar__avatar">{initial}</div>
          <div className="topbar__user-info">
            <span className="topbar__user-name">{session.user.name}</span>
            <span className="topbar__user-role">{session.role}</span>
          </div>
        </div>

        <button
          type="button"
          className="button button--ghost"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          onClick={onSignOut}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
