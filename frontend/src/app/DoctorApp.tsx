import { Navigate, NavLink, Route, Routes } from 'react-router-dom';

import { DoctorWorkspace } from '../features/medical/DoctorWorkspace';
import { LoginPage } from '../features/auth/LoginPage';
import { MfaEnrollmentPanel } from '../features/auth/MfaEnrollmentPanel';
import { useSession } from '../features/auth/useSession';
import { ToastProvider } from '../features/layout/Toast';
import { DOCTOR_PATHS } from '../navigation/routes';

const DOCTOR_NAV = [
  { to: DOCTOR_PATHS.home, label: 'Hoje', end: true },
  { to: DOCTOR_PATHS.agenda, label: 'Agenda', end: false },
  { to: DOCTOR_PATHS.queue, label: 'Minha fila', end: false },
  { to: DOCTOR_PATHS.documents, label: 'Documentos', end: false },
  { to: DOCTOR_PATHS.returns, label: 'Retornos', end: false },
] as const;

/**
 * Superfície do profissional de saúde (`/medico`).
 * Shell reduzido, sem menus administrativos (SPEC-0026 / RN-001, seção 9.4).
 */
export function DoctorApp() {
  const { state, reload, end } = useSession();

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
      <div className="doctor-shell">
        <header className="doctor-header">
          <div className="doctor-header__brand">
            <img
              src="/assets/brand/canadamed_logogrande_comtitulo-removebg-preview.png"
              alt="CANA MED — Eficiência Para Quem Mais Precisa"
            />
          </div>

          <nav className="doctor-header__nav" aria-label="Navegação do profissional">
            {DOCTOR_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `doctor-header__nav-item ${isActive ? 'doctor-header__nav-item--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="doctor-header__user">
            <span className="doctor-header__user-name">{state.session.user.name}</span>
            <span className="doctor-header__user-clinic">{state.session.clinicName}</span>
            <button type="button" className="button button--ghost" onClick={() => void end()}>
              Sair
            </button>
          </div>
        </header>

        <main className="doctor-main">
          <Routes>
            <Route index element={<DoctorWorkspace />} />
            <Route path="agenda" element={<DoctorWorkspace />} />
            <Route path="fila" element={<DoctorWorkspace />} />
            <Route
              path="documentos"
              element={
                <section className="page">
                  <h1 className="page__title">Documentos do profissional</h1>
                  <p className="form__hint">
                    Emissão e histórico de documentos clínicos ficam disponíveis no atendimento ativo.
                    Esta superfície segue a SPEC-0026, seção 8.3.
                  </p>
                </section>
              }
            />
            <Route
              path="retornos"
              element={
                <section className="page">
                  <h1 className="page__title">Retornos e prazos</h1>
                  <p className="form__hint">
                    Os retornos programados serão listados aqui conforme a SPEC-0026, seção 8.3.
                  </p>
                </section>
              }
            />
            <Route path="*" element={<Navigate to={DOCTOR_PATHS.home} replace />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
