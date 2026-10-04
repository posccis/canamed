import { useEffect, useState } from 'react';

import { patientApi, type PublicClinicMeta } from './patientApi';

type ClinicState =
  | { status: 'loading' }
  | { status: 'ready'; clinic: PublicClinicMeta }
  | { status: 'not-found' }
  | { status: 'error'; message: string };

/**
 * Resolve a clínica do link público pelo slug (SPEC-0026/RN-003).
 * Um slug inexistente produz o estado `not-found` (ER-009), sem revelar dados internos.
 */
export function useClinicBySlug(slug: string | undefined): ClinicState {
  const [state, setState] = useState<ClinicState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    if (!slug) {
      setState({ status: 'not-found' });
      return () => {
        active = false;
      };
    }

    setState({ status: 'loading' });
    patientApi
      .getClinicBySlug(slug)
      .then((clinic) => {
        if (active) {
          setState({ status: 'ready', clinic });
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const status = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 0;
        if (status === 404) {
          setState({ status: 'not-found' });
        } else {
          setState({ status: 'error', message: 'Não foi possível carregar os dados da clínica agora.' });
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return state;
}
