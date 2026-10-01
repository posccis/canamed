import { useState } from 'react';

import { AgendaPage } from './features/agenda/AgendaPage';
import { LoginPage } from './features/auth/LoginPage';
import { MfaEnrollmentPanel } from './features/auth/MfaEnrollmentPanel';
import { SessionBar } from './features/auth/SessionBar';
import { useSession } from './features/auth/useSession';
import { UsersPanel } from './features/auth/UsersPanel';
import { CatalogPanel } from './features/catalog/CatalogPanel';

export function App() {
  const { state, reload, end } = useSession();
  const [view, setView] = useState<'agenda' | 'catalog' | 'users'>('agenda');

  if (state.status === 'loading') {
    return (
      <div className="page">
        <p className="form__hint">Verificando a sessão…</p>
      </div>
    );
  }

  if (state.status === 'anonymous') {
    return <LoginPage onAuthenticated={reload} notice={state.message} />;
  }

  if (state.status === 'error') {
    return (
      <div className="page">
        <div className="alert alert--error" role="alert">
          <p>{state.message}</p>
          <button type="button" className="button button--secondary" onClick={reload}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (state.session.mfaPending) {
    return <MfaEnrollmentPanel onActivated={reload} onSignOut={() => void end()} />;
  }

  return (
    <>
      <SessionBar session={state.session} view={view} onChangeView={setView} onSignOut={() => void end()} />
      {view === 'users' ? <UsersPanel /> : view === 'catalog' ? <CatalogPanel /> : <AgendaPage />}
    </>
  );
}
