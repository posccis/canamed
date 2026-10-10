import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Menu } from 'lucide-react';

import { DoctorDashboardPage } from '../features/medical/DoctorDashboardPage';
import { DoctorWorkspace } from '../features/medical/DoctorWorkspace';
import { DoctorMedicalRecordsPage } from '../features/medical/DoctorMedicalRecordsPage';
import { DoctorAgendaPage } from '../features/medical/DoctorAgendaPage';
import { DoctorDocumentsPage } from '../features/medical/DoctorDocumentsPage';
import { DoctorReturnsPage } from '../features/medical/DoctorReturnsPage';
import { DoctorSidebar } from '../features/medical/DoctorSidebar';
import { DoctorProfileMenu } from '../features/medical/DoctorProfileMenu';
import { LoginPage } from '../features/auth/LoginPage';
import { MfaEnrollmentPanel } from '../features/auth/MfaEnrollmentPanel';
import { useSession } from '../features/auth/useSession';
import { ToastProvider } from '../features/layout/Toast';
import { DOCTOR_PATHS } from '../navigation/routes';

/**
 * Superfície do profissional de saúde (`/medico`).
 * Layout moderno com Sidebar expansível/colapsável, responsivo e integrado ao Dashboard Clínico.
 * Shell reduzido, sem menus administrativos (SPEC-0026 / RN-001, seção 9.4 e SPEC-0028).
 */
export function DoctorApp() {
  const { state, reload, end } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        portalTitle="Espaço do Médico"
        portalSubtitle="Acesse seu consultório digital com suas credenciais médicas"
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
      <div className="doctor-shell">
        <DoctorSidebar
          session={state.session}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onSignOut={() => void end()}
        />

        <div className="doctor-content-wrapper">
          <header className="doctor-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Abrir menu de navegação"
                title="Abrir menu"
              >
                <Menu size={20} />
              </button>
              <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>
                🌸 Cana Med Mulher • Espaço Clínico
              </span>
            </div>

            <DoctorProfileMenu
              session={state.session}
              onSignOut={() => void end()}
            />
          </header>

          <main className="doctor-main">
            <Routes>
              <Route index element={<DoctorDashboardPage />} />
              <Route path="consultorio" element={<DoctorWorkspace />} />
              <Route path="prontuario" element={<DoctorMedicalRecordsPage />} />
              <Route path="prontuario/:patientId" element={<DoctorMedicalRecordsPage />} />
              <Route path="agenda" element={<DoctorAgendaPage />} />
              <Route path="fila" element={<DoctorWorkspace />} />
              <Route path="documentos" element={<DoctorDocumentsPage />} />
              <Route path="retornos" element={<DoctorReturnsPage />} />
              <Route path="*" element={<Navigate to={DOCTOR_PATHS.home} replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
