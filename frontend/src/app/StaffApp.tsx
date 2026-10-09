import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import { AgendaPage } from '../features/agenda/AgendaPage';
import { LoginPage } from '../features/auth/LoginPage';
import { MfaEnrollmentPanel } from '../features/auth/MfaEnrollmentPanel';
import { useSession } from '../features/auth/useSession';
import { UsersPanel } from '../features/auth/UsersPanel';
import { CatalogPanel } from '../features/catalog/CatalogPanel';
import { DashboardPanel } from '../features/dashboard/DashboardPanel';
import { OperationPanel } from '../features/clinics/OperationPanel';
import { QueuePanel } from '../features/queue/QueuePanel';
import { Sidebar } from '../features/layout/Sidebar';
import { Topbar } from '../features/layout/Topbar';
import { ToastProvider } from '../features/layout/Toast';
import { GlobalSearchModal } from '../features/layout/GlobalSearchModal';
import { LinksPanel } from '../features/layout/LinksPanel';
import { CashRegisterPanel } from '../features/admin/CashRegisterPanel';
import { TvDisplay } from '../features/admin/TvDisplay';
import { FinancialPanel } from '../features/admin/FinancialPanel';
import { InventoryPanel } from '../features/admin/InventoryPanel';
import { DpoWorkspace } from '../features/admin/DpoWorkspace';
import { ClinicPolicyPanel } from '../features/admin/ClinicPolicyPanel';
import { DOCTOR_PATHS, STAFF_PATHS, staffViewFromPath, type StaffView } from '../navigation/routes';

/**
 * Sistema interno (`/app`): recepção, gestão, financeiro e administração.
 * O paciente e o médico não compartilham esta superfície (SPEC-0026 / RN-001).
 */
export function StaffApp() {
  const { state, reload, end } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const view = staffViewFromPath(location.pathname);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((previous) => !previous);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function goTo(target: StaffView) {
    navigate(STAFF_PATHS[target]);
  }

  function openDoctorSurface() {
    navigate(DOCTOR_PATHS.home);
  }

  if (state.status === 'loading') {
    return (
      <div className="page">
        <p className="form__hint">Verificando a sessão…</p>
      </div>
    );
  }

  if (state.status === 'anonymous') {
    return (
      <LoginPage
        onAuthenticated={reload}
        notice={state.message}
        portalTitle="Administração & Recepção"
        portalSubtitle="Acesse a administração da clínica com suas credenciais"
      />
    );
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
          onChangeView={goTo}
          onOpenDoctorSurface={openDoctorSurface}
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
            onReloadSession={reload}
          />

          <main className="app-main">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPanel onNavigate={goTo} />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="recepcao" element={<QueuePanel />} />
              <Route path="operacao" element={<OperationPanel />} />
              <Route path="catalogo" element={<CatalogPanel />} />
              <Route path="usuarios" element={<UsersPanel />} />
              <Route path="caixa" element={<CashRegisterPanel />} />
              <Route path="tv" element={<TvDisplay />} />
              <Route path="financeiro" element={<FinancialPanel />} />
              <Route path="estoque" element={<InventoryPanel />} />
              <Route path="dpo" element={<DpoWorkspace />} />
              <Route path="politicas" element={<ClinicPolicyPanel />} />
              <Route path="links" element={<LinksPanel />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </main>
        </div>

        <GlobalSearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={(targetView) => {
            goTo(targetView);
            setSearchOpen(false);
          }}
          onOpenDoctor={openDoctorSurface}
        />
      </div>
    </ToastProvider>
  );
}
