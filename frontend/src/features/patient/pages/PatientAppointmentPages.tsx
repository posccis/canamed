import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import {
  patientApi,
  type CapabilitySummary,
  type RescheduleSlot,
} from '../patientApi';

const INVALID_LINK_MESSAGE =
  'Este link não está mais disponível. Fale com a recepção ou abra Meus atendimentos.';

function formatDateTime(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

type CapabilityState =
  | { status: 'loading' }
  | { status: 'ready'; summary: CapabilitySummary }
  | { status: 'invalid' };

function useCapability(token: string | undefined): CapabilityState {
  const [state, setState] = useState<CapabilityState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    if (!token) {
      setState({ status: 'invalid' });
      return () => {
        active = false;
      };
    }

    patientApi
      .resolveCapability(token)
      .then((summary) => active && setState({ status: 'ready', summary }))
      .catch(() => active && setState({ status: 'invalid' }));

    return () => {
      active = false;
    };
  }, [token]);

  return state;
}

function CapabilityFeedback({ state }: { state: CapabilityState }) {
  if (state.status === 'loading') {
    return <p className="patient-help">Carregando…</p>;
  }

  if (state.status === 'invalid') {
    return (
      <div className="patient-notice patient-notice--error" role="alert">
        {INVALID_LINK_MESSAGE}
      </div>
    );
  }

  return null;
}

function AppointmentCard({ summary }: { summary: CapabilitySummary }) {
  if (!summary.appointment) return null;

  return (
    <dl className="patient-validation__data">
      <div>
        <dt>Data e hora</dt>
        <dd>{formatDateTime(summary.appointment.startsAt)}</dd>
      </div>
      <div>
        <dt>Profissional</dt>
        <dd>{summary.appointment.professionalName}</dd>
      </div>
      <div>
        <dt>Tipo</dt>
        <dd>{summary.appointment.specialtyName}</dd>
      </div>
    </dl>
  );
}

/** Detalhe da consulta por link (L-07), com a ação correspondente ao escopo do token. */
export function PatientAppointmentPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const paths = patientPaths(slug ?? '');
  const state = useCapability(token);

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Sua consulta</h1>
      </header>

      <CapabilityFeedback state={state} />

      {state.status === 'ready' ? (
        <div className="patient-validation">
          {state.summary.patientNameMasked ? (
            <p className="patient-hello">Paciente: {state.summary.patientNameMasked}</p>
          ) : null}
          <AppointmentCard summary={state.summary} />

          {token ? (
            <div className="patient-actions">
              {state.summary.scope === 'confirm' ? (
                <Link className="patient-action patient-action--primary" to={paths.confirm(token)}>
                  Confirmar presença
                </Link>
              ) : null}
              {state.summary.scope === 'reschedule' ? (
                <Link className="patient-action" to={paths.reschedule(token)}>
                  Remarcar consulta
                </Link>
              ) : null}
              {state.summary.scope === 'cancel' ? (
                <Link className="patient-action" to={paths.cancel(token)}>
                  Cancelar consulta
                </Link>
              ) : null}
              {state.summary.scope === 'check_in' ? (
                <Link className="patient-action patient-action--primary" to={paths.checkInFor(token)}>
                  Fazer check-in
                </Link>
              ) : null}
              {state.summary.scope === 'queue' ? (
                <Link className="patient-action" to={paths.filaFor(token)}>
                  Acompanhar minha posição
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="patient-help">Precisa de ajuda? Ligue para a recepção da clínica.</p>
    </section>
  );
}

/** Confirmação de presença em um clique (L-08). */
export function PatientConfirmPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const paths = patientPaths(slug ?? '');
  const state = useCapability(token);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const confirm = async () => {
    if (!token) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await patientApi.confirmByToken(token);
      setDone(true);
    } catch {
      setErrorMessage('Não foi possível confirmar agora. Abra o link novamente ou fale com a recepção.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Confirmar presença</h1>
        <p className="patient-page__subtitle">Você confirma que vai comparecer à consulta?</p>
      </header>

      <CapabilityFeedback state={state} />

      {state.status === 'ready' ? <AppointmentCard summary={state.summary} /> : null}

      {done ? (
        <div className="patient-notice" role="status">
          Presença confirmada. Obrigado! Seus dados só são validados no dia do atendimento.
        </div>
      ) : (
        <button
          type="button"
          className="patient-action patient-action--primary"
          onClick={confirm}
          disabled={busy || state.status !== 'ready'}
        >
          {busy ? 'Confirmando…' : 'Sim, vou comparecer'}
        </button>
      )}

      {errorMessage ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <Link className="patient-action" to={paths.base}>
        Voltar
      </Link>
    </section>
  );
}

/** Cancelamento autônomo com desafio e política de prazo (L-10 / RN-013). */
export function PatientCancelPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const paths = patientPaths(slug ?? '');
  const state = useCapability(token);
  const [answer, setAnswer] = useState('');
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cancel = async () => {
    if (!token) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await patientApi.cancelByToken(token, reason, answer);
      setDone(true);
    } catch {
      setErrorMessage('Não foi possível cancelar por aqui. Fale com a recepção da clínica.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Cancelar consulta</h1>
        <p className="patient-page__subtitle">
          A vaga será liberada para outro paciente. Confirme seus dados para continuar.
        </p>
      </header>

      <CapabilityFeedback state={state} />

      {done ? (
        <div className="patient-notice" role="status">
          Consulta cancelada. Se precisar, você pode agendar um novo horário.
        </div>
      ) : state.status === 'ready' ? (
        <>
          <AppointmentCard summary={state.summary} />

          <label className="patient-field">
            <span>Confirme seus dados: 3 primeiros dígitos do CPF ou ano de nascimento</span>
            <input
              type="text"
              value={answer}
              autoComplete="off"
              onChange={(event) => setAnswer(event.target.value)}
            />
          </label>

          <label className="patient-field">
            <span>Motivo (opcional)</span>
            <input type="text" value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>

          <button
            type="button"
            className="patient-action patient-action--danger"
            onClick={cancel}
            disabled={busy || !answer.trim()}
          >
            {busy ? 'Cancelando…' : 'Cancelar consulta'}
          </button>
        </>
      ) : null}

      {errorMessage ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <Link className="patient-action" to={paths.base}>
        Voltar
      </Link>
    </section>
  );
}

/** Reagendamento autônomo com disponibilidade em tempo real (L-09 / RN-014). */
export function PatientReschedulePage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const paths = patientPaths(slug ?? '');
  const state = useCapability(token);
  const navigate = useNavigate();

  const [date, setDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [slots, setSlots] = useState<RescheduleSlot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!token) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      setSlots(await patientApi.getRescheduleSlots(token, date));
      setSelected(null);
    } catch {
      setSlots([]);
      setErrorMessage('Não foi possível carregar os horários. Tente outra data.');
    } finally {
      setBusy(false);
    }
  }, [token, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const submit = async () => {
    if (!token || !selected) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      const result = await patientApi.rescheduleByToken(token, selected, answer);
      navigate(result.confirmPath ?? paths.base);
    } catch {
      setErrorMessage('Não foi possível remarcar. Talvez o horário tenha sido ocupado; escolha outro.');
      await loadSlots();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Remarcar consulta</h1>
        <p className="patient-page__subtitle">Escolha um novo horário disponível.</p>
      </header>

      <CapabilityFeedback state={state} />

      {state.status === 'ready' ? (
        <>
          <AppointmentCard summary={state.summary} />

          <label className="patient-field">
            <span>Nova data</span>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>

          {slots.length === 0 ? (
            <p className="patient-help">Nenhum horário livre nesta data. Tente outro dia.</p>
          ) : (
            <div className="patient-slots">
              {slots.map((slot) => (
                <button
                  key={slot.startsAt}
                  type="button"
                  className={`patient-slot ${selected === slot.startsAt ? 'patient-slot--selected' : ''}`}
                  onClick={() => setSelected(slot.startsAt)}
                >
                  {new Date(slot.startsAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </button>
              ))}
            </div>
          )}

          <label className="patient-field">
            <span>Confirme seus dados: 3 primeiros dígitos do CPF ou ano de nascimento</span>
            <input
              type="text"
              value={answer}
              autoComplete="off"
              onChange={(event) => setAnswer(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="patient-action patient-action--primary"
            onClick={submit}
            disabled={busy || !selected || !answer.trim()}
          >
            {busy ? 'Remarcando…' : 'Confirmar novo horário'}
          </button>
        </>
      ) : null}

      {errorMessage ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <Link className="patient-action" to={paths.base}>
        Voltar
      </Link>
    </section>
  );
}
