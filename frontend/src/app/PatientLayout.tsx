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
      <div className="w-full min-h-screen bg-background text-on-surface antialiased font-body-md flex flex-col">
        <main className="w-full flex-1 flex flex-col m-0 p-0">
          <Outlet context={{ slug, paths }} />
        </main>
      </div>
    </ToastProvider>
  );
}
