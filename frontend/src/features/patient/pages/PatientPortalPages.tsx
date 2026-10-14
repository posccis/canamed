import { useNavigate, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import { PatientPortal, type PatientPortalTab } from '../PatientPortal';
import { useClinicBySlug } from '../useClinicBySlug';

/**
 * Páginas do portal do paciente endereçáveis por URL.
 * Cada aba possui rota própria (`/agendar`, `/consultas`, `/documentos`) para ser compartilhável e
 * restaurável por refresh/Back (SPEC-0026/RN-002).
 */
function PortalPage({ tab }: { tab: PatientPortalTab }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug ?? '');
  const clinicState = useClinicBySlug(slug);

  const routes: Record<PatientPortalTab, string> = {
    home: paths.base,
    schedule: paths.agendar,
    appointments: paths.consultas,
    details: paths.consultas,
    profile: paths.perfil,
  };

  return (
    <PatientPortal
      initialTab={tab}
      onTabChange={(next) => {
        if (routes[next]) navigate(routes[next]);
      }}
      clinic={clinicState.status === 'ready' ? clinicState.clinic : null}
    />
  );
}

export function PatientHomePage() {
  return <PortalPage tab="home" />;
}

export function PatientBookingPage() {
  return <PortalPage tab="schedule" />;
}

export function PatientAppointmentsPage() {
  return <PortalPage tab="appointments" />;
}

export function PatientDocumentsPage() {
  return <PortalPage tab="appointments" />;
}

export function PatientProfilePage() {
  return <PortalPage tab="profile" />;
}

