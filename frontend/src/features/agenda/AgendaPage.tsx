import { useEffect, useState } from 'react';

import { Modal } from '../../shared/Modal';
import { markAppointmentAttended, markAppointmentNoShow, removeBlock, type Appointment } from './agendaApi';
import { AppointmentActions } from './AppointmentActions';
import { AppointmentForm } from './AppointmentForm';
import { BlockForm } from './BlockForm';
import { describeError } from './agendaErrors';
import { describeClassification } from '../catalog/catalogLabels';
import { formatDayLabel, formatTimeRange, todayIso } from './agendaFormat';
import { QuickRegistrationPanel } from './QuickRegistrationPanel';
import { StatusBadge } from './StatusBadge';
import { useAgendaDay, useCatalog } from './useAgendaData';

type Dialog =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'reschedule'; appointment: Appointment }
  | { kind: 'cancel'; appointment: Appointment };

/** Tela principal: agenda do dia por data e profissional (fluxo F-004). */
export function AgendaPage() {
  const [date, setDate] = useState(todayIso());
  const [professionalId, setProfessionalId] = useState('');
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });
  const [bloqueioAberto, setBloqueioAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);

  const catalog = useCatalog();
  const agenda = useAgendaDay(date, professionalId || undefined);

  const professionals = catalog.state.status === 'ready' ? catalog.state.data.professionals : [];
  const patients = catalog.state.status === 'ready' ? catalog.state.data.patients : [];
  const appointmentTypes = catalog.state.status === 'ready' ? catalog.state.data.appointmentTypes : [];

  useEffect(() => {
    if (!professionalId && professionals.length > 0) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionalId, professionals]);

  function reloadAll() {
    agenda.reload();
    catalog.reload();
  }

  function handleDone(message: string) {
    setDialog({ kind: 'none' });
    setBloqueioAberto(false);
    setMensagem(message);
    reloadAll();
  }

  async function handleLifecycle(appointment: Appointment, status: 'atendido' | 'faltou') {
    setErroAcao(null);

    try {
      await (status === 'atendido'
        ? markAppointmentAttended(appointment.id)
        : markAppointmentNoShow(appointment.id));

      setMensagem(status === 'atendido' ? 'Atendimento registrado.' : 'Falta registrada.');
      reloadAll();
    } catch (reason: unknown) {
      setErroAcao(describeError(reason));
    }
  }

  async function handleUnblock(block: { id: string; professionalId: string }) {
    setErroAcao(null);

    try {
      await removeBlock(block.professionalId, block.id);
      setMensagem('Horário desbloqueado.');
      reloadAll();
    } catch (reason: unknown) {
      setErroAcao(describeError(reason));
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <h1 className="page__title">CANA MED</h1>
          <p className="page__tagline">Eficiência para quem mais precisa.</p>
        </div>
        <button type="button" className="button button--ghost" onClick={() => setCadastroAberto((open) => !open)}>
          {cadastroAberto ? 'Ocultar cadastros' : 'Cadastros rápidos'}
        </button>
      </header>

      {mensagem ? (
        <div className="alert alert--success" role="status">
          <p>{mensagem}</p>
        </div>
      ) : null}

      {erroAcao ? (
        <div className="alert alert--error" role="alert">
          <p>{erroAcao}</p>
        </div>
      ) : null}

      {cadastroAberto ? (
        <QuickRegistrationPanel
          onRegistered={(text) => {
            setMensagem(text);
            catalog.reload();
          }}
        />
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
            <button type="button" className="button button--ghost" onClick={reloadAll}>
              Atualizar
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setBloqueioAberto(true)}
              disabled={!professionalId}
            >
              Bloquear horário
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => setDialog({ kind: 'create' })}
              disabled={professionals.length === 0}
            >
              Novo agendamento
            </button>
          </div>
        </div>

        <h2 className="card__title">Agenda de {formatDayLabel(date)}</h2>

        {agenda.state.status === 'loading' ? (
          <div className="skeleton" aria-live="polite" aria-busy="true">
            <div className="skeleton__row" />
            <div className="skeleton__row" />
            <div className="skeleton__row" />
          </div>
        ) : null}

        {agenda.state.status === 'error' ? (
          <div className="alert alert--error" role="alert">
            <p>{agenda.state.message}</p>
            <button type="button" className="button button--secondary" onClick={agenda.reload}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {agenda.state.status === 'ready' ? (
          <AgendaList
            appointments={agenda.state.data.appointments}
            blocks={agenda.state.data.blocks}
            onReschedule={(appointment) => setDialog({ kind: 'reschedule', appointment })}
            onCancel={(appointment) => setDialog({ kind: 'cancel', appointment })}
            onAttend={(appointment) => void handleLifecycle(appointment, 'atendido')}
            onNoShow={(appointment) => void handleLifecycle(appointment, 'faltou')}
            onUnblock={(block) => void handleUnblock(block)}
          />
        ) : null}
      </section>

      {dialog.kind === 'create' ? (
        <Modal title="Novo agendamento" onClose={() => setDialog({ kind: 'none' })}>
          <AppointmentForm
            professionals={professionals}
            patients={patients}
            appointmentTypes={appointmentTypes}
            defaultProfessionalId={professionalId || professionals[0]?.id || ''}
            defaultDate={date}
            onCreated={() => handleDone('Agendamento criado.')}
            onRegistered={() => {
              setDialog({ kind: 'none' });
              setCadastroAberto(true);
            }}
            onCancel={() => setDialog({ kind: 'none' })}
          />
        </Modal>
      ) : null}

      {dialog.kind === 'reschedule' ? (
        <Modal title="Remarcar agendamento" onClose={() => setDialog({ kind: 'none' })}>
          <AppointmentActions
            appointment={dialog.appointment}
            mode="reschedule"
            onDone={() => handleDone('Agendamento remarcado.')}
            onClose={() => setDialog({ kind: 'none' })}
          />
        </Modal>
      ) : null}

      {dialog.kind === 'cancel' ? (
        <Modal title="Cancelar agendamento" onClose={() => setDialog({ kind: 'none' })}>
          <AppointmentActions
            appointment={dialog.appointment}
            mode="cancel"
            onDone={() => handleDone('Agendamento cancelado.')}
            onClose={() => setDialog({ kind: 'none' })}
          />
        </Modal>
      ) : null}

      {bloqueioAberto && professionalId ? (
        <Modal title="Bloquear horário" onClose={() => setBloqueioAberto(false)}>
          <BlockForm
            professionalId={professionalId}
            defaultDate={date}
            onCreated={() => handleDone('Horário bloqueado.')}
            onClose={() => setBloqueioAberto(false)}
          />
        </Modal>
      ) : null}
    </div>
  );
}

type AgendaListProps = {
  appointments: Appointment[];
  blocks: { id: string; professionalId: string; startsAt: string; endsAt: string }[];
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onAttend: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
  onUnblock: (block: { id: string; professionalId: string }) => void;
};

function AgendaList({
  appointments,
  blocks,
  onReschedule,
  onCancel,
  onAttend,
  onNoShow,
  onUnblock,
}: AgendaListProps) {
  const ativos = appointments.filter((appointment) => appointment.status !== 'cancelado');
  const cancelados = appointments.filter((appointment) => appointment.status === 'cancelado');

  if (appointments.length === 0 && blocks.length === 0) {
    return <p className="empty">Nenhum agendamento para esta data.</p>;
  }

  return (
    <div className="agenda">
      <ul className="agenda__list">
        {ativos.map((appointment) => (
          <li key={appointment.id} className="agenda__item">
            <div className="agenda__time">{formatTimeRange(appointment.startsAt, appointment.endsAt)}</div>
            <div className="agenda__details">
              <p className="agenda__patient">{appointment.patientName}</p>
              <p className="agenda__meta">
                {appointment.appointmentTypeName} • {Number(appointment.durationMinutes)} min •{' '}
                {describeClassification(appointment.category, appointment.coverage, appointment.specialtyName)}
              </p>
            </div>
            <StatusBadge status={appointment.status} />
            <div className="agenda__actions">
              <button
                type="button"
                className="button button--link"
                onClick={() => void onAttend(appointment)}
              >
                Atendido
              </button>
              <button
                type="button"
                className="button button--link"
                onClick={() => void onNoShow(appointment)}
              >
                Faltou
              </button>
              <button
                type="button"
                className="button button--link"
                onClick={() => onReschedule(appointment)}
              >
                Remarcar
              </button>
              <button type="button" className="button button--link" onClick={() => onCancel(appointment)}>
                Cancelar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {blocks.length > 0 ? (
        <div className="agenda__blocks">
          <h3 className="card__subtitle">Horários bloqueados</h3>
          <ul className="agenda__list">
            {blocks.map((block) => (
              <li key={block.id} className="agenda__item agenda__item--blocked">
                <div className="agenda__time">{formatTimeRange(block.startsAt, block.endsAt)}</div>
                <div className="agenda__details">
                  <p className="agenda__patient">Indisponível</p>
                  <p className="agenda__meta">Horário bloqueado na agenda do profissional</p>
                </div>
                <div className="agenda__actions">
                  <button type="button" className="button button--link" onClick={() => onUnblock(block)}>
                    Desbloquear
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {cancelados.length > 0 ? (
        <div className="agenda__blocks">
          <h3 className="card__subtitle">Cancelados</h3>
          <ul className="agenda__list">
            {cancelados.map((appointment) => (
              <li key={appointment.id} className="agenda__item agenda__item--cancelled">
                <div className="agenda__time">{formatTimeRange(appointment.startsAt, appointment.endsAt)}</div>
                <div className="agenda__details">
                  <p className="agenda__patient">{appointment.patientName}</p>
                  <p className="agenda__meta">{appointment.cancellationReason}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
