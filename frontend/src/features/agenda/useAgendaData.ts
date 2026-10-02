import { useCallback, useEffect, useState } from 'react';

import {
  fetchAgendaDay,
  fetchAppointmentTypes,
  fetchPatients,
  fetchProfessionals,
  type AgendaDay,
  type AppointmentType,
  type Patient,
  type Professional,
} from './agendaApi';
import { describeError } from './agendaErrors';
import { fetchRooms, type Room } from '../clinics/clinicsApi';

/** Estado de carregamento de uma tela: vazio, carregando, erro e sucesso (seção 9 da SPEC-0001). */
export type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

export type Catalog = {
  professionals: Professional[];
  patients: Patient[];
  appointmentTypes: AppointmentType[];
  rooms: Room[];
};

/** Carrega o cadastro mínimo necessário para agendar. */
export function useCatalog() {
  const [state, setState] = useState<Loadable<Catalog>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: 'loading' });

    Promise.all([
      fetchProfessionals(controller.signal),
      fetchPatients(controller.signal),
      fetchAppointmentTypes(controller.signal),
      fetchRooms(controller.signal).catch(() => [] as Room[]),
    ])
      .then(([professionals, patients, appointmentTypes, rooms]) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'ready', data: { professionals, patients, appointmentTypes, rooms } });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'error', message: describeError(error) });
      });

    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { state, reload };
}

/** Carrega a agenda de um dia (fluxo F-004). */
export function useAgendaDay(date: string, professionalId: string | undefined) {
  const [state, setState] = useState<Loadable<AgendaDay>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: 'loading' });

    fetchAgendaDay(date, professionalId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: 'error', message: describeError(error) });
      });

    return () => controller.abort();
  }, [date, professionalId, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { state, reload };
}
