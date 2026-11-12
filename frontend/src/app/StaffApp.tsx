import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// import { AgendaPage } from '../features/agenda/AgendaPage';
import { LoginPage } from '../features/auth/LoginPage';
import { MfaEnrollmentPanel } from '../features/auth/MfaEnrollmentPanel';
import { useSession } from '../features/auth/useSession';
// import { UsersPanel } from '../features/auth/UsersPanel';
// import { CatalogPanel } from '../features/catalog/CatalogPanel';
import { DashboardPanel } from '../features/dashboard/DashboardPanel';
// import { OperationPanel } from '../features/clinics/OperationPanel';
// import { QueuePanel } from '../features/queue/QueuePanel';
import { Sidebar } from '../features/layout/Sidebar';
import { Topbar } from '../features/layout/Topbar';
import { ToastProvider } from '../features/layout/Toast';
import { GlobalSearchModal } from '../features/layout/GlobalSearchModal';
// import { LinksPanel } from '../features/layout/LinksPanel';
import { AgendaRecepcaoPanel } from '../features/agenda/AgendaRecepcaoPanel';
import { ClinicSettingsPanel } from '../features/clinics/ClinicSettingsPanel';
import { CashRegisterPanel } from '../features/admin/CashRegisterPanel';
import { PatientsPanel } from '../features/patient/PatientsPanel';
import { ProfessionalsPanel } from '../features/catalog/ProfessionalsPanel';
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

  async function handleSignOut() {
    await end();
    navigate('/');
  }

  return (
    <ToastProvider>
      <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
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
            onSignOut={handleSignOut}
            onOpenSearch={() => setSearchOpen(true)}
            onReloadSession={reload}
          />

          <main className="app-main">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPanel onNavigate={goTo} />} />
              {/* Módulo Unificado Agenda & Recepção (SPEC-0032) */}
              <Route path="agenda" element={<AgendaRecepcaoPanel initialView="agenda" />} />
              <Route path="recepcao" element={<AgendaRecepcaoPanel initialView="queue" />} />
              <Route path="pacientes" element={<PatientsPanel />} />
              <Route path="profissionais" element={<ProfessionalsPanel />} />
              {/* Caixa Diário */}
              <Route path="caixa" element={<CashRegisterPanel />} />
              <Route path="financeiro" element={<CashRegisterPanel />} />
              {/* Central de Configurações da Clínica em Abas (SPEC-0032) */}
              <Route path="configuracoes" element={<ClinicSettingsPanel />} />
              {/* Redirecionamentos suaves de rotas secundárias para a Central de Configurações */}
              <Route path="operacao" element={<ClinicSettingsPanel />} />
              <Route path="catalogo" element={<Navigate to="/app/profissionais" replace />} />
              <Route path="usuarios" element={<ClinicSettingsPanel />} />
              <Route path="politicas" element={<ClinicSettingsPanel />} />
              <Route path="links" element={<ClinicSettingsPanel />} />
              <Route path="dpo" element={<ClinicSettingsPanel />} />
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
