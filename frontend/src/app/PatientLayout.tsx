import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';

import { patientApi } from '../features/patient/patientApi';
import { ToastProvider } from '../features/layout/Toast';
import { patientPaths } from '../navigation/routes';

/**
 * Superfície pública do paciente (`/p/:slug`).
 * Não usa sidebar nem topbar do sistema interno (SPEC-0026 / RN-001).
 */
export function PatientLayout() {
  const { slug = 'cana-med' } = useParams<{ slug: string }>();
  const paths = patientPaths(slug);
  const [clinicName, setClinicName] = useState('CANA MED');

  useEffect(() => {
    let active = true;

    patientApi
      .getPortalMeta()
      .then((meta) => {
        if (active) {
          setClinicName(meta.clinicName || 'CANA MED');
        }
      })
      .catch(() => {
        // Metadados públicos são opcionais para renderizar a moldura.
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <ToastProvider>
      <div className="patient-surface">
        <header className="patient-header">
          <Link to={paths.base} className="patient-header__brand" aria-label="CANA MED — início">
            <img
              src="/assets/brand/canamed-mulher-logolonga.png"
              alt="CANA MED Mulher — Eficiência Para Quem Mais Precisa"
            />
          </Link>

          <nav className="patient-header__nav" aria-label="Serviços do paciente">
            <Link to={paths.agendar}>Agendar</Link>
            <Link to={paths.consultas}>Meus atendimentos</Link>
            <Link to={paths.checkIn}>Check-in</Link>
          </nav>
        </header>

        <p className="patient-header__clinic" aria-live="polite">
          {clinicName}
        </p>

        <main className="patient-main">
          <Outlet context={{ slug, paths }} />
        </main>

        <footer className="patient-footer">
          <span>Precisa de ajuda? Ligue para a recepção da clínica.</span>
          <nav aria-label="Links de privacidade">
            <Link to={paths.privacidade}>Privacidade e seus dados</Link>
          </nav>
        </footer>
      </div>
    </ToastProvider>
  );
}
