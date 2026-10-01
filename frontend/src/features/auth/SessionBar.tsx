import type { Session } from './authApi';

type SessionBarProps = {
  session: Session;
  view: 'agenda' | 'catalog' | 'users';
  onChangeView: (view: 'agenda' | 'catalog' | 'users') => void;
  onSignOut: () => void;
};

/** Barra superior com usuário, clínica ativa, navegação e saída. */
export function SessionBar({ session, view, onChangeView, onSignOut }: SessionBarProps) {
  const canManageUsers = session.permissions.includes('users:manage');
  const canConfigureAgenda = session.permissions.includes('agenda:configure');

  return (
    <header className="session-bar">
      <div className="session-bar__identity">
        <strong>{session.user.name}</strong>
        <span className="session-bar__meta">
          {session.clinicName} • {session.role}
        </span>
      </div>

      <nav className="session-bar__nav" aria-label="Navegação principal">
        <button
          type="button"
          className={`button ${view === 'agenda' ? 'button--primary' : 'button--ghost'}`}
          onClick={() => onChangeView('agenda')}
        >
          Agenda
        </button>
        {canManageUsers ? (
          <button
            type="button"
            className={`button ${view === 'users' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => onChangeView('users')}
          >
            Usuários
          </button>
        ) : null}
        {canConfigureAgenda ? (
          <button
            type="button"
            className={`button ${view === 'catalog' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => onChangeView('catalog')}
          >
            Catálogo
          </button>
        ) : null}
        <button type="button" className="button button--ghost" onClick={onSignOut}>
          Sair
        </button>
      </nav>
    </header>
  );
}
