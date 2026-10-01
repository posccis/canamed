import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../../api/client';
import { describeError } from '../agenda/agendaErrors';
import { fetchSession, logout as logoutRequest, type Session } from './authApi';

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous'; message?: string }
  | { status: 'authenticated'; session: Session }
  | { status: 'error'; message: string };

/** Carrega a sessão corrente e oferece recarga e encerramento. */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: 'loading' });

    fetchSession(controller.signal)
      .then((session) => setState({ status: 'authenticated', session }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          setState({ status: 'anonymous' });
          return;
        }

        setState({ status: 'error', message: describeError(error) });
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  const end = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // A sessão pode já ter expirado; o frontend volta ao login de qualquer forma.
    }

    setState({ status: 'anonymous' });
  }, []);

  return { state, reload, end };
}
