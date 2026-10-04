import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';

import { DoctorApp } from './app/DoctorApp';
import { PatientLayout } from './app/PatientLayout';
import { StaffApp } from './app/StaffApp';
import { TvDisplay } from './features/admin/TvDisplay';
import {
  PatientAppointmentPage,
  PatientCancelPage,
  PatientConfirmPage,
  PatientReschedulePage,
} from './features/patient/pages/PatientAppointmentPages';
import { PatientCheckInPage } from './features/patient/pages/PatientCheckInPage';
import { PatientDocumentPage } from './features/patient/pages/PatientDocumentPage';
import { PatientDocumentValidationPage } from './features/patient/pages/PatientDocumentValidationPage';
import { PatientHub } from './features/patient/pages/PatientHub';
import {
  PatientAppointmentsPage,
  PatientBookingPage,
  PatientDocumentsPage,
} from './features/patient/pages/PatientPortalPages';
import { PatientQueuePage } from './features/patient/pages/PatientQueuePage';
import { PrivacyPortal } from './features/patient/PrivacyPortal';
import { DEFAULT_CLINIC_SLUG, LOBBY_TV_PATH, STAFF_PATHS } from './navigation/routes';

function NotFound() {
  return (
    <div className="page">
      <h1 className="page__title">Página não encontrada</h1>
      <p className="form__hint">O endereço acessado não existe ou foi alterado.</p>
      <Link className="button button--primary" to={STAFF_PATHS.dashboard}>
        Ir para o sistema
      </Link>
    </div>
  );
}

/**
 * Raiz do roteamento por URL (SPEC-0026 / ADR-0011).
 *
 * O roteador vive em `App` para que o roteamento seja a fonte única de navegação em toda a aplicação,
 * inclusive nos testes.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={STAFF_PATHS.dashboard} replace />} />

        {/* Sistema interno — recepção, gestão e administração */}
        <Route path="/app/*" element={<StaffApp />} />

        {/* Superfície dedicada do profissional de saúde */}
        <Route path="/medico/*" element={<DoctorApp />} />

        {/* Exibição pública do saguão (TV) */}
        <Route path={LOBBY_TV_PATH} element={<TvDisplay />} />

        {/* Superfície pública do paciente */}
        <Route path="/p" element={<Navigate to={`/p/${DEFAULT_CLINIC_SLUG}`} replace />} />
        <Route path="/p/:slug" element={<PatientLayout />}>
          <Route index element={<PatientHub />} />
          <Route path="agendar" element={<PatientBookingPage />} />
          <Route path="agendar/profissional/:professionalSlug" element={<PatientBookingPage />} />
          <Route path="agendar/especialidade/:specialtySlug" element={<PatientBookingPage />} />
          <Route path="consultas" element={<PatientAppointmentsPage />} />
          <Route path="c/:token" element={<PatientAppointmentPage />} />
          <Route path="c/:token/confirmar" element={<PatientConfirmPage />} />
          <Route path="c/:token/remarcar" element={<PatientReschedulePage />} />
          <Route path="c/:token/cancelar" element={<PatientCancelPage />} />
          <Route path="documentos" element={<PatientDocumentsPage />} />
          <Route path="documentos/:token" element={<PatientDocumentPage />} />
          <Route path="privacidade" element={<PrivacyPortal />} />
          <Route path="privacidade/:protocol" element={<PrivacyPortal />} />
          <Route path="check-in" element={<PatientCheckInPage />} />
          <Route path="check-in/:token" element={<PatientCheckInPage />} />
          <Route path="fila" element={<PatientQueuePage />} />
          <Route path="fila/:token" element={<PatientQueuePage />} />
          <Route path="validar/:token" element={<PatientDocumentValidationPage />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
