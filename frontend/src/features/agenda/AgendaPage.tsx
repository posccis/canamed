import { useEffect, useState } from 'react';

import { Modal } from '../../shared/Modal';
import {
  fetchAgendaDay,
  markAppointmentAttended,
  markAppointmentNoShow,
  removeBlock,
  type Appointment,
} from './agendaApi';
import { AgendaWeeklyGrid, type WeekDayInfo, type DayAgendaData } from './AgendaWeeklyGrid';
import { AppointmentActions } from './AppointmentActions';
import { AppointmentForm } from './AppointmentForm';
import { BlockForm } from './BlockForm';
import { describeError } from './agendaErrors';
import { describeClassification } from '../catalog/catalogLabels';
import { formatDayLabel, formatTimeRange, todayIso } from './agendaFormat';
import { QuickRegistrationPanel } from './QuickRegistrationPanel';
import { StatusBadge } from './StatusBadge';
import { useAgendaDay, useCatalog } from './useAgendaData';
import { checkInFromAppointment, fetchQueue, type QueueEntry } from '../queue/queueApi';
import { queueStatusLabels } from '../queue/queueLabels';
import { PaymentModal } from '../payments/PaymentModal';
import { exportToCsv } from '../../utils/exportCsv';
import { useToast } from '../layout/Toast';

function getWeekDays(referenceDateIso: string): WeekDayInfo[] {
  const ref = new Date(`${referenceDateIso}T12:00:00Z`);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);

  const days: WeekDayInfo[] = [];
  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const todayStr = todayIso();
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dNum = String(d.getDate()).padStart(2, '0');
    const mNum = String(d.getMonth() + 1).padStart(2, '0');
    days.push({
      date: dateStr,
      label: `${dNum}/${mNum}`,
      dayOfWeek: dayNames[i],
      isToday: dateStr === todayStr,
    });
  }
  return days;
}

type Dialog =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'reschedule'; appointment: Appointment }
  | { kind: 'cancel'; appointment: Appointment };

/** Tela principal: agenda do dia por data e profissional (fluxo F-004). */
export function AgendaPage() {
  const [date, setDate] = useState(todayIso());
  const [professionalId, setProfessionalId] = useState('');
  const [viewMode, setViewMode] = useState<'diaria' | 'semanal'>('diaria');
  const [weeklyData, setWeeklyData] = useState<Record<string, DayAgendaData>>({});
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });
  const [bloqueioAberto, setBloqueioAberto] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [queueByAppointment, setQueueByAppointment] = useState<Record<string, QueueEntry>>({});
  const [queueToken, setQueueToken] = useState(0);
  const [paymentAppointment, setPaymentAppointment] = useState<{ id: string; patientName: string; appointmentTypeName?: string } | null>(null);
  const toast = useToast();

  const catalog = useCatalog();
  const agenda = useAgendaDay(date, professionalId || undefined);

  useEffect(() => {
    if (viewMode !== 'semanal') return;
    const controller = new AbortController();
    const days = getWeekDays(date);
    setLoadingWeekly(true);

    Promise.all(
      days.map((d) =>
        fetchAgendaDay(d.date, professionalId || undefined, controller.signal)
          .then((res) => ({ date: d.date, appointments: res.appointments, blocks: res.blocks }))
          .catch(() => ({ date: d.date, appointments: [], blocks: [] }))
      )
    )
      .then((results) => {
        const map: Record<string, DayAgendaData> = {};
        for (const r of results) {
          map[r.date] = { appointments: r.appointments, blocks: r.blocks };
        }
        setWeeklyData(map);
      })
      .finally(() => setLoadingWeekly(false));

    return () => controller.abort();
  }, [viewMode, date, professionalId, queueToken]);

  const professionals = catalog.state.status === 'ready' ? catalog.state.data.professionals : [];
  const patients = catalog.state.status === 'ready' ? catalog.state.data.patients : [];
  const appointmentTypes = catalog.state.status === 'ready' ? catalog.state.data.appointmentTypes : [];
  const rooms = catalog.state.status === 'ready' ? catalog.state.data.rooms : [];

  useEffect(() => {
    if (!professionalId && professionals.length > 0) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionalId, professionals]);

  function reloadAll() {
    agenda.reload();
    catalog.reload();
    setQueueToken((value) => value + 1);
  }

  // Indicador de fila: mostra quem já fez check-in e evita check-in duplicado.
  useEffect(() => {
    const controller = new AbortController();

    fetchQueue(date, professionalId || undefined, controller.signal)
      .then((day) => {
        const map: Record<string, QueueEntry> = {};

        for (const entry of day.entries) {
          if (entry.appointmentId) {
            map[entry.appointmentId] = entry;
          }
        }

        setQueueByAppointment(map);
      })
      .catch(() => setQueueByAppointment({}));

    return () => controller.abort();
  }, [date, professionalId, queueToken]);

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

  async function handleCheckIn(appointment: Appointment) {
    setErroAcao(null);

    try {
      await checkInFromAppointment(appointment.id, 'normal');
      setMensagem('Check-in registrado. O paciente está na fila.');
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
        <div className="toolbar" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          {/* Alternador de Modo: Diária | Semanal */}
          <div className="segmented-control" role="tablist" aria-label="Modo de visualização da agenda">
            <button
              type="button"
              className={`segmented-control__btn ${viewMode === 'diaria' ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setViewMode('diaria')}
              role="tab"
              aria-selected={viewMode === 'diaria'}
            >
              Diária
            </button>
            <button
              type="button"
              className={`segmented-control__btn ${viewMode === 'semanal' ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setViewMode('semanal')}
              role="tab"
              aria-selected={viewMode === 'semanal'}
            >
              Semanal
            </button>
          </div>

          <label className="field field--compact">
            <span className="field__label">{viewMode === 'semanal' ? 'Semana de' : 'Data'}</span>
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
            {viewMode === 'semanal' ? (
              <>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    const d = new Date(`${date}T12:00:00Z`);
                    d.setDate(d.getDate() - 7);
                    setDate(d.toISOString().split('T')[0]);
                  }}
                  title="Semana anterior"
                >
                  ‹ Semana anterior
                </button>
                <button type="button" className="button button--ghost" onClick={() => setDate(todayIso())}>
                  Semana atual
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    const d = new Date(`${date}T12:00:00Z`);
                    d.setDate(d.getDate() + 7);
                    setDate(d.toISOString().split('T')[0]);
                  }}
                  title="Próxima semana"
                >
                  Próxima semana ›
                </button>
              </>
            ) : (
              <button type="button" className="button button--ghost" onClick={() => setDate(todayIso())}>
                Hoje
              </button>
            )}
            <button type="button" className="button button--ghost" onClick={reloadAll}>
              Atualizar
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                const appts = agenda.state.status === 'ready' ? agenda.state.data.appointments : [];
                if (appts.length === 0) {
                  toast.showInfo('Não há agendamentos nesta data para exportar.');
                  return;
                }
                exportToCsv(
                  `agenda-${date}.csv`,
                  appts.map((item) => ({
                    Horario: formatTimeRange(item.startsAt, item.endsAt),
                    Paciente: item.patientName,
                    Tipo: item.appointmentTypeName,
                    Status: item.status,
                    Categoria: item.category,
                    Custeio: item.coverage,
                    Especialidade: item.specialtyName ?? '',
                    Sala: item.roomName ?? '',
                  }))
                );
                toast.showSuccess('Agenda exportada com sucesso (CSV).');
              }}
            >
              Exportar CSV
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

        <h2 className="card__title">
          {viewMode === 'semanal'
            ? `Grade Semanal (Semana de ${formatDayLabel(date)})`
            : `Agenda de ${formatDayLabel(date)}`}
        </h2>

        {viewMode === 'diaria' ? (
          <>
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
                onCheckIn={(appointment) => void handleCheckIn(appointment)}
                onPay={(appointment) =>
                  setPaymentAppointment({
                    id: appointment.id,
                    patientName: appointment.patientName,
                    appointmentTypeName: appointment.appointmentTypeName,
                  })
                }
                queueByAppointment={queueByAppointment}
                isToday={date === todayIso()}
              />
            ) : null}
          </>
        ) : (
          <AgendaWeeklyGrid
            days={getWeekDays(date)}
            weeklyData={weeklyData}
            loading={loadingWeekly}
            onSelectDate={(newDate) => {
              setDate(newDate);
              setViewMode('diaria');
            }}
            onReschedule={(appointment) => setDialog({ kind: 'reschedule', appointment })}
            onCancel={(appointment) => setDialog({ kind: 'cancel', appointment })}
            onAttend={(appointment) => void handleLifecycle(appointment, 'atendido')}
            onNoShow={(appointment) => void handleLifecycle(appointment, 'faltou')}
            onUnblock={(block) => void handleUnblock(block)}
            onCheckIn={(appointment) => void handleCheckIn(appointment)}
            onPay={(appointment) =>
              setPaymentAppointment({
                id: appointment.id,
                patientName: appointment.patientName,
                appointmentTypeName: appointment.appointmentTypeName,
              })
            }
            onCreateAppointment={(targetDate) => {
              setDate(targetDate);
              setDialog({ kind: 'create' });
            }}
          />
        )}
      </section>

      {dialog.kind === 'create' ? (
        <Modal title="Novo agendamento" onClose={() => setDialog({ kind: 'none' })}>
          <AppointmentForm
            professionals={professionals}
            patients={patients}
            appointmentTypes={appointmentTypes}
            rooms={rooms}
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
            rooms={rooms}
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

      {paymentAppointment ? (
        <PaymentModal
          isOpen={true}
          appointmentId={paymentAppointment.id}
          patientName={paymentAppointment.patientName}
          appointmentTypeName={paymentAppointment.appointmentTypeName}
          onClose={() => setPaymentAppointment(null)}
          onSuccess={() => {
            toast.showSuccess(`Pagamento de ${paymentAppointment.patientName} registrado.`);
            reloadAll();
          }}
        />
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
  onCheckIn: (appointment: Appointment) => void;
  onPay?: (appointment: Appointment) => void;
  queueByAppointment: Record<string, QueueEntry>;
  isToday: boolean;
};

function AgendaList({
  appointments,
  blocks,
  onReschedule,
  onCancel,
  onAttend,
  onNoShow,
  onUnblock,
  onCheckIn,
  onPay,
  queueByAppointment,
  isToday,
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
          <li key={appointment.id} className={`agenda__item agenda__item--status-${appointment.status}`}>
            <div className="agenda__time">{formatTimeRange(appointment.startsAt, appointment.endsAt)}</div>
            <div className="agenda__details">
              <p className="agenda__patient">{appointment.patientName}</p>
              <p className="agenda__meta">
                {appointment.appointmentTypeName} • {Number(appointment.durationMinutes)} min •{' '}
                {describeClassification(appointment.category, appointment.coverage, appointment.specialtyName)}
                {appointment.roomName ? ` • Sala: ${appointment.roomName}` : ''}
              </p>
            </div>
            <StatusBadge status={appointment.status} />
            {queueByAppointment[appointment.id] ? (
              <span className="badge badge--agendado">
                {queueStatusLabels[queueByAppointment[appointment.id].status] ?? 'Na fila'}
              </span>
            ) : null}
            <div className="agenda__actions">
              {appointment.status !== 'atendido'
                && appointment.status !== 'faltou'
                && appointment.status !== 'cancelado'
                && !queueByAppointment[appointment.id]
                && isToday ? (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => onCheckIn(appointment)}
                  >
                    Check-in
                  </button>
                ) : null}
              {appointment.status !== 'cancelado' && onPay ? (
                <button
                  type="button"
                  className="button button--link"
                  onClick={() => onPay(appointment)}
                  title="Registrar pagamento no balcão (SPEC-0008)"
                >
                  Cobrar
                </button>
              ) : null}
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
