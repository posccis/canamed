import { Outlet, useParams } from 'react-router-dom';

import { ToastProvider } from '../features/layout/Toast';
import { patientPaths } from '../navigation/routes';

/**
 * Superfície pública do paciente (`/p/:slug`).
 * Não usa sidebar nem topbar do sistema interno (SPEC-0026 / RN-001).
 */
export function PatientLayout() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const paths = patientPaths(slug);

  return (
    <ToastProvider>
      <div className="patient-surface">
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', margin: 0, padding: 0 }}>
          <Outlet context={{ slug, paths }} />
        </main>
      </div>
    </ToastProvider>
  );
}
