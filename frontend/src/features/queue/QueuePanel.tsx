import { useCallback, useEffect, useState } from 'react';

import { fetchAgendaDay, fetchPatients, fetchProfessionals, type Appointment } from '../agenda/agendaApi';
import { describeError } from '../agenda/agendaErrors';
import { formatTime, todayIso } from '../agenda/agendaFormat';
import {
  callQueueEntry,
  checkInFromAppointment,
  checkInWalkIn,
  closeDay,
  completeQueueEntry,
  fetchQueue,
  leaveQueueEntry,
  startQueueEntry,
  type CloseDayResult,
  type QueueDay,
  type QueueEntry,
} from './queueApi';
import { formatMinutes, queuePriorityLabels, queueStatusLabels } from './queueLabels';
import { TriageModal } from './TriageModal';
import { PaymentModal } from '../payments/PaymentModal';
import { exportToCsv } from '../../utils/exportCsv';
import { useToast } from '../layout/Toast';

type Loadable<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string };

/** Aba Recepção: fila do dia, check-in (com e sem agendamento) e fechamento do dia (SPEC-0005). */
export function QueuePanel() {
  const [date, setDate] = useState(todayIso());
  const [professionalId, setProfessionalId] = useState('');
  const [queue, setQueue] = useState<Loadable<QueueDay>>({ status: 'loading' });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<{ id: string; name: string }[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState<CloseDayResult | null>(null);

  const [appointmentId, setAppointmentId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [walkInPatientId, setWalkInPatientId] = useState('');
  const [walkInProfessionalId, setWalkInProfessionalId] = useState('');
  const [checkInMode, setCheckInMode] = useState<'appointment' | 'walk-in'>('appointment');

  const [triageEntry, setTriageEntry] = useState<{ id: string; patientName: string } | null>(null);
  const [paymentEntry, setPaymentEntry] = useState<{ appointmentId: string; patientName: string } | null>(null);
  const toast = useToast();

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    setQueue({ status: 'loading' });

    fetchQueue(date, professionalId || undefined, controller.signal)
      .then((data) => setQueue({ status: 'ready', data }))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setQueue({ status: 'error', message: describeError(reason) });
      });

    return () => controller.abort();
  }, [date, professionalId, attempt]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([fetchProfessionals(controller.signal), fetchPatients(controller.signal)])
      .then(([professionalList, patientList]) => {
        setProfessionals(professionalList.filter((item) => item.isActive));
        setPatients(patientList.filter((item) => item.isActive));
      })
      .catch(() => {
        setProfessionals([]);
        setPatients([]);
      });

    return () => controller.abort();
  }, []);

  // Agendamentos do dia para o check-in por hora marcada.
  useEffect(() => {
    const controller = new AbortController();

    fetchAgendaDay(date, professionalId || undefined, controller.signal)
      .then((day) => setAppointments(day.appointments.filter((item) => item.status !== 'cancelado')))
      .catch(() => setAppointments([]));

    return () => controller.abort();
  }, [date, professionalId, attempt]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      reload();
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSaving(false);
    }
  }

  const entries = queue.status === 'ready' ? queue.data.entries : [];
  const waiting = entries.filter((entry) => entry.status === 'aguardando');
  const inService = entries.filter((entry) => entry.status === 'chamado' || entry.status === 'em_atendimento');

  return (
    <div className="page">
      <h1 className="page__title page__title--section">Fila de espera</h1>

      {message ? (
        <div className="alert alert--success" role="status">
          <p>{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {closing ? (
        <div className="alert alert--success" role="status">
          <p>
            Dia {closing.date} fechado: {closing.noShowAppointments} falta(s) registrada(s),{' '}
            {closing.leftQueueEntries} desistência(s) e {closing.stillInService} atendimento(s) em andamento.
          </p>
        </div>
      ) : null}

      <section className="card">
        <div className="toolbar">
          <label className="field field--compact">
            <span className="field__label">Data</span>
            <input
              className="field__input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value || todayIso())}
            />
          </label>

          <label className="field field--compact">
            <span className="field__label">Profissional</span>
            <select
              className="field__input"
              value={professionalId}
              onChange={(event) => setProfessionalId(event.target.value)}
            >
              <option value="">Todos os profissionais</option>
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </label>

          <div className="toolbar__actions">
            <button type="button" className="button button--ghost" onClick={() => setDate(todayIso())}>
              Hoje
            </button>
            <button type="button" className="button button--ghost" onClick={reload}>
              Atualizar
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                if (entries.length === 0) {
                  toast.showInfo('Não há registros na fila para exportar.');
                  return;
                }
                exportToCsv(
                  `fila-espera-${date}.csv`,
                  entries.map((entry) => ({
                    Posicao: entry.position ?? '',
                    Paciente: entry.patientName,
                    Prioridade: queuePriorityLabels[entry.priority] ?? entry.priority,
                    Status: queueStatusLabels[entry.status] ?? entry.status,
                    Chegada: formatTime(entry.arrivedAt),
                    EsperaMinutos: entry.waitingMinutes,
                    AtendimentoMinutos: entry.serviceMinutes ?? '',
                    HorarioAgendado: entry.appointmentStartsAt ? formatTime(entry.appointmentStartsAt) : 'Encaixe',
                  }))
                );
                toast.showSuccess('Lista da fila exportada com sucesso (CSV).');
              }}
            >
              Exportar CSV
            </button>
            <button
              type="button"
              className="button button--secondary"
              disabled={saving}
              onClick={() =>
                void run(async () => {
                  const summary = await closeDay(date, professionalId || null);
                  setClosing(summary);
                }, 'Fechamento do dia concluído.')
              }
            >
              Fechar o dia
            </button>
          </div>
        </div>

        <h2 className="card__title">Check-in</h2>
        <p className="form__hint">
          Use a chegada com hora marcada ou registre um encaixe. A fila é ordenada por prioridade e ordem de
          chegada.
        </p>

        <div className="toolbar">
          <button
            type="button"
            className={`button ${checkInMode === 'appointment' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => setCheckInMode('appointment')}
          >
            Com agendamento
          </button>
          <button
            type="button"
            className={`button ${checkInMode === 'walk-in' ? 'button--primary' : 'button--ghost'}`}
            onClick={() => setCheckInMode('walk-in')}
          >
            Encaixe (sem agendamento)
          </button>
        </div>

        {checkInMode === 'appointment' ? (
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => checkInFromAppointment(appointmentId, priority),
                'Check-in registrado. O paciente está na fila.',
              ).then(() => setAppointmentId(''));
            }}
          >
            <label className="field">
              <span className="field__label">Agendamento do dia</span>
              <select
                className="field__input"
                value={appointmentId}
                onChange={(event) => setAppointmentId(event.target.value)}
                required
              >
                <option value="">Selecione o agendamento</option>
                {appointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {formatTime(appointment.startsAt)} · {appointment.patientName} · {appointment.appointmentTypeName}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--short">
              <span className="field__label">Prioridade</span>
              <select className="field__input" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="normal">Normal</option>
                <option value="preferencial">Preferencial</option>
              </select>
            </label>

            <button type="submit" className="button button--primary" disabled={saving || !appointmentId}>
              Registrar check-in
            </button>
          </form>
        ) : (
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => checkInWalkIn(walkInPatientId, walkInProfessionalId, priority),
                'Encaixe registrado. O paciente está na fila.',
              ).then(() => setWalkInPatientId(''));
            }}
          >
            <label className="field">
              <span className="field__label">Paciente</span>
              <select
                className="field__input"
                value={walkInPatientId}
                onChange={(event) => setWalkInPatientId(event.target.value)}
                required
              >
                <option value="">Selecione o paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span className="field__label">Profissional</span>
              <select
                className="field__input"
                value={walkInProfessionalId}
                onChange={(event) => setWalkInProfessionalId(event.target.value)}
                required
              >
                <option value="">Selecione o profissional</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--short">
              <span className="field__label">Prioridade</span>
              <select className="field__input" value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="normal">Normal</option>
                <option value="preferencial">Preferencial</option>
              </select>
            </label>

            <button
              type="submit"
              className="button button--primary"
              disabled={saving || !walkInPatientId || !walkInProfessionalId}
            >
              Registrar encaixe
            </button>
          </form>
        )}
      </section>

      <section className="card">
        <h2 className="card__title">
          Fila do dia ({waiting.length} aguardando{inService.length > 0 ? `, ${inService.length} em andamento` : ''})
        </h2>

        {queue.status === 'loading' ? <div className="skeleton"><div className="skeleton__row" /></div> : null}

        {queue.status === 'error' ? (
          <div className="alert alert--error" role="alert">
            <p>{queue.message}</p>
            <button type="button" className="button button--secondary" onClick={reload}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {queue.status === 'ready' && entries.length === 0 ? (
          <p className="empty">Nenhum paciente na fila desta data.</p>
        ) : null}

        {entries.length > 0 ? (
          <ul className="agenda__list">
            {entries.map((entry) => (
              <QueueRow
                key={entry.id}
                entry={entry}
                saving={saving}
                onRun={run}
                onOpenTriage={(item) => setTriageEntry({ id: item.id, patientName: item.patientName })}
                onOpenPayment={(item) =>
                  item.appointmentId
                    ? setPaymentEntry({ appointmentId: item.appointmentId, patientName: item.patientName })
                    : undefined
                }
              />
            ))}
          </ul>
        ) : null}
      </section>

      {triageEntry ? (
        <TriageModal
          isOpen={true}
          queueEntryId={triageEntry.id}
          patientName={triageEntry.patientName}
          onClose={() => setTriageEntry(null)}
          onSuccess={() => {
            toast.showSuccess(`Triagem de ${triageEntry.patientName} salva com sucesso.`);
            reload();
          }}
        />
      ) : null}

      {paymentEntry ? (
        <PaymentModal
          isOpen={true}
          appointmentId={paymentEntry.appointmentId}
          patientName={paymentEntry.patientName}
          onClose={() => setPaymentEntry(null)}
          onSuccess={() => {
            toast.showSuccess(`Pagamento de ${paymentEntry.patientName} registrado.`);
            reload();
          }}
        />
      ) : null}
    </div>
  );
}

type QueueRowProps = {
  entry: QueueEntry;
  saving: boolean;
  onRun: (action: () => Promise<unknown>, successMessage: string) => Promise<void>;
  onOpenTriage: (entry: QueueEntry) => void;
  onOpenPayment: (entry: QueueEntry) => void;
};

function QueueRow({ entry, saving, onRun, onOpenTriage, onOpenPayment }: QueueRowProps) {
  return (
    <li className={`agenda__item ${entry.priority === 'preferencial' ? 'agenda__item--blocked' : ''}`}>
      <div className="agenda__time">
        {entry.position ? `${entry.position}º` : '—'}
        <br />
        <span className="agenda__meta">{formatTime(entry.arrivedAt)}</span>
      </div>
      <div className="agenda__details">
        <p className="agenda__patient">{entry.patientName}</p>
        <p className="agenda__meta">
          {queueStatusLabels[entry.status] ?? entry.status} • espera{' '}
          {formatMinutes(Number(entry.waitingMinutes))}
          {entry.appointmentStartsAt ? ` • agendado para ${formatTime(entry.appointmentStartsAt)}` : ' • encaixe'}
          {entry.priority === 'preferencial' ? ` • ${queuePriorityLabels.preferencial}` : ''}
          {entry.serviceMinutes !== null ? ` • atendimento ${formatMinutes(Number(entry.serviceMinutes))}` : ''}
        </p>
      </div>
      <span className={`badge badge--${entry.status === 'atendido' ? 'confirmado' : entry.status === 'desistiu' || entry.status === 'cancelado' ? 'cancelado' : 'agendado'}`}>
        {queueStatusLabels[entry.status] ?? entry.status}
      </span>
      <div className="agenda__actions">
        {entry.status === 'aguardando' || entry.status === 'chamado' ? (
          <button
            type="button"
            className="button button--link"
            disabled={saving}
            onClick={() => onOpenTriage(entry)}
            title="Aferir sinais vitais e classificação de risco (SPEC-0009)"
          >
            Triagem
          </button>
        ) : null}
        {entry.appointmentId ? (
          <button
            type="button"
            className="button button--link"
            disabled={saving}
            onClick={() => onOpenPayment(entry)}
            title="Registrar cobrança/pagamento no balcão (SPEC-0008)"
          >
            Cobrar
          </button>
        ) : null}
        {entry.status === 'aguardando' ? (
          <button
            type="button"
            className="button button--link"
            disabled={saving}
            onClick={() => void onRun(() => callQueueEntry(entry.id), 'Paciente chamado.')}
          >
            Chamar
          </button>
        ) : null}
        {entry.status === 'chamado' ? (
          <button
            type="button"
            className="button button--link"
            disabled={saving}
            onClick={() => void onRun(() => startQueueEntry(entry.id), 'Atendimento iniciado.')}
          >
            Iniciar
          </button>
        ) : null}
        {entry.status === 'em_atendimento' ? (
          <button
            type="button"
            className="button button--link"
            disabled={saving}
            onClick={() => void onRun(() => completeQueueEntry(entry.id), 'Atendimento concluído.')}
          >
            Finalizar
          </button>
        ) : null}
        {entry.status === 'aguardando' || entry.status === 'chamado' ? (
          <button
            type="button"
            className="button button--link"
            disabled={saving}
            onClick={() => void onRun(() => leaveQueueEntry(entry.id), 'Desistência registrada.')}
          >
            Desistiu
          </button>
        ) : null}
      </div>
    </li>
  );
}
