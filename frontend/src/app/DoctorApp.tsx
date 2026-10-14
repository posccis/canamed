import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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

  async function handleSignOut() {
    await end();
    navigate('/');
  }

  return (
    <ToastProvider>
      <div className={`doctor-shell ${collapsed ? 'doctor-shell--collapsed' : ''}`}>
        <DoctorSidebar
          session={state.session}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onSignOut={handleSignOut}
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--content-muted, #858D99)',
                    fontWeight: 500,
                    gap: '0.4rem',
                    lineHeight: 1.2,
                    marginBottom: '0.2rem',
                  }}
                >
                  <span style={{ color: 'var(--brand-primary, #852A91)', fontWeight: 600 }}>Área Médica</span>
                  <span style={{ fontSize: '0.7rem' }}>›</span>
                  <span>Consultório Virtual</span>
                </div>
                <h1 style={{ margin: 0, fontWeight: 700, color: 'var(--content-primary, #202631)', fontSize: '1.18rem' }}>
                  Cana Med Mulher • Espaço Clínico
                </h1>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Notificações Clínicas (Sino do Protótipo) */}
              <button
                type="button"
                title="Alertas Clínicos e Retornos"
                aria-label="Alertas Clínicos"
                style={{
                  position: 'relative',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--content-secondary, #626B79)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span
                  style={{
                    position: 'absolute',
                    top: '7px',
                    right: '7px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#C33D49',
                    border: '1.5px solid #FFFFFF',
                  }}
                />
              </button>

              {/* Divisor Vertical do Protótipo */}
              <div style={{ width: '1px', height: '32px', backgroundColor: 'var(--base-border, #E2E8F0)' }} />

              <DoctorProfileMenu
                session={state.session}
                onSignOut={handleSignOut}
              />
            </div>
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
