import { useParams } from 'react-router-dom';
import { PatientPortal } from '../PatientPortal';
import { useClinicBySlug } from '../useClinicBySlug';

/**
 * Componente de compatibilidade para suíte de testes legada do portal.
 */
export function PatientHub() {
  const { slug } = useParams<{ slug: string }>();
  const clinicState = useClinicBySlug(slug);
  return <PatientPortal clinic={clinicState.status === 'ready' ? clinicState.clinic : null} />;
}
