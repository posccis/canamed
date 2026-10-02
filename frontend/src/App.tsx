import { useState, useEffect } from 'react';

import { AgendaPage } from './features/agenda/AgendaPage';
import { LoginPage } from './features/auth/LoginPage';
import { MfaEnrollmentPanel } from './features/auth/MfaEnrollmentPanel';
import { useSession } from './features/auth/useSession';
import { UsersPanel } from './features/auth/UsersPanel';
import { CatalogPanel } from './features/catalog/CatalogPanel';
import { DashboardPanel } from './features/dashboard/DashboardPanel';
import { OperationPanel } from './features/clinics/OperationPanel';
import { QueuePanel } from './features/queue/QueuePanel';
import { Sidebar, type AppView } from './features/layout/Sidebar';
import { Topbar } from './features/layout/Topbar';
import { ToastProvider } from './features/layout/Toast';
import { GlobalSearchModal } from './features/layout/GlobalSearchModal';

export function App() {
  const { state, reload, end } = useSession();
  const [view, setView] = useState<AppView>('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <ToastProvider>
      <div className="app-shell">
        <Sidebar
          session={state.session}
          view={view}
          onChangeView={setView}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="app-content-wrapper">
          <Topbar
            session={state.session}
            view={view}
            onToggleMobile={() => setMobileOpen((value) => !value)}
            onSignOut={() => void end()}
            onOpenSearch={() => setSearchOpen(true)}
          />

          <main className="app-main">
            {view === 'dashboard' ? (
              <DashboardPanel onNavigate={setView} />
            ) : view === 'users' ? (
              <UsersPanel />
            ) : view === 'catalog' ? (
              <CatalogPanel />
            ) : view === 'operation' ? (
              <OperationPanel />
            ) : view === 'queue' ? (
              <QueuePanel />
            ) : (
              <AgendaPage />
            )}
          </main>
        </div>

        <GlobalSearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={(targetView) => {
            setView(targetView);
            setSearchOpen(false);
          }}
        />
      </div>
    </ToastProvider>
  );
}
