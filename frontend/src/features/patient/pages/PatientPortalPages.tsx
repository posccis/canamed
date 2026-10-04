import { useNavigate, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import { PatientPortal, type PatientPortalTab } from '../PatientPortal';

/**
 * Páginas do portal do paciente endereçáveis por URL.
 * Cada aba possui rota própria (`/agendar`, `/consultas`, `/documentos`) para ser compartilhável e
 * restaurável por refresh/Back (SPEC-0026/RN-002).
 */
function PortalPage({ tab }: { tab: PatientPortalTab }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const paths = patientPaths(slug ?? '');

  const routes: Record<PatientPortalTab, string> = {
    schedule: paths.agendar,
    appointments: paths.consultas,
    documents: paths.documentos,
  };

  return <PatientPortal initialTab={tab} onTabChange={(next) => navigate(routes[next])} />;
}

export function PatientBookingPage() {
  return <PortalPage tab="schedule" />;
}

export function PatientAppointmentsPage() {
  return <PortalPage tab="appointments" />;
}

export function PatientDocumentsPage() {
  return <PortalPage tab="documents" />;
}
