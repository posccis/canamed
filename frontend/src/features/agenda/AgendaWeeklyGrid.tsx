import { Lock, Plus } from 'lucide-react';
import type { Appointment } from './agendaApi';
import { formatTimeRange } from './agendaFormat';
import { StatusBadge } from './StatusBadge';

export type WeekDayInfo = {
  date: string;
  label: string;
  dayOfWeek: string;
  isToday: boolean;
};

export type DayAgendaData = {
  appointments: Appointment[];
  blocks: { id: string; professionalId: string; startsAt: string; endsAt: string }[];
};

type AgendaWeeklyGridProps = {
  days: WeekDayInfo[];
  weeklyData: Record<string, DayAgendaData>;
  loading: boolean;
  onSelectDate: (date: string) => void;
  onReschedule: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onAttend: (appointment: Appointment) => void;
  onNoShow: (appointment: Appointment) => void;
  onUnblock: (block: { id: string; professionalId: string }) => void;
  onCheckIn: (appointment: Appointment) => void;
  onPay?: (appointment: Appointment) => void;
  onCreateAppointment: (date: string) => void;
};

const statusBorderColors: Record<string, string> = {
  agendado: '#005F6A',
  confirmado: '#008080',
  aguardando: '#d97706',
  em_atendimento: '#4f46e5',
  atendido: '#10b981',
  faltou: '#ef4444',
  cancelado: '#94a3b8',
};

/**
 * Grade Semanal de Horários da Agenda (SPEC-0030 / Módulo 3.4 e UI-04).
 * Exibe os dias de Segunda a Sábado com slots organizados por hora,
 * cards semânticos de status e hachura para horários bloqueados.
 */
export function AgendaWeeklyGrid({
  days,
  weeklyData,
  loading,
  onSelectDate,
  onReschedule,
  onCancel,
  onAttend,
  onNoShow,
  onUnblock,
  onCheckIn,
  onPay,
  onCreateAppointment,
}: AgendaWeeklyGridProps) {
  if (loading) {
    return (
      <div className="skeleton" aria-live="polite" aria-busy="true" style={{ padding: '2rem' }}>
        <div className="skeleton__row" style={{ height: '40px', marginBottom: '1rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem' }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton__row" style={{ height: '240px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-weekly" role="region" aria-label="Grade semanal de agendamentos">
      {days.map((day) => {
        const dayData = weeklyData[day.date] || { appointments: [], blocks: [] };
        const activeAppointments = dayData.appointments.filter((a) => a.status !== 'cancelado');
        const cancelledAppointments = dayData.appointments.filter((a) => a.status === 'cancelado');
        const totalItems = activeAppointments.length + dayData.blocks.length;

        return (
          <div key={day.date} className="agenda-weekly__col">
            {/* Cabeçalho do Dia */}
            <div
              className={`agenda-weekly__header ${day.isToday ? 'agenda-weekly__header--today' : ''}`}
              onClick={() => onSelectDate(day.date)}
              style={{ cursor: 'pointer' }}
              title={`Ver agenda detalhada de ${day.dayOfWeek}`}
            >
              <div className="agenda-weekly__day-name">{day.dayOfWeek}</div>
              <div className="agenda-weekly__day-num">{day.label}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                {totalItems} {totalItems === 1 ? 'horário' : 'horários'}
              </div>
            </div>

            {/* Corpo com Cards */}
            <div className="agenda-weekly__body">
              {totalItems === 0 && cancelledAppointments.length === 0 ? (
                <div className="agenda-weekly__empty">
                  <span>Livre</span>
                </div>
              ) : (
                <>
                  {/* Horários Bloqueados */}
                  {dayData.blocks.map((block) => (
                    <div
                      key={block.id}
                      className="agenda-weekly__card agenda__item--blocked"
                      style={{
                        background: 'repeating-linear-gradient(45deg, #f8fafc, #f8fafc 10px, #f1f5f9 10px, #f1f5f9 20px)',
                        borderLeftColor: '#94a3b8',
                      }}
                    >
                      <div className="agenda-weekly__card-time" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Lock size={12} />
                        <span>{formatTimeRange(block.startsAt, block.endsAt)}</span>
                      </div>
                      <div className="agenda-weekly__card-patient" style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        Bloqueado
                      </div>
                      <div style={{ marginTop: '0.35rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="button button--link"
                          style={{ fontSize: '0.72rem', padding: 0 }}
                          onClick={() => onUnblock(block)}
                        >
                          Desbloquear
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Agendamentos Ativos */}
                  {activeAppointments.map((app) => {
                    const borderColor = statusBorderColors[app.status] || '#005F6A';

                    return (
                      <div
                        key={app.id}
                        className="agenda-weekly__card"
                        style={{ borderLeftColor: borderColor }}
                      >
                        <div className="agenda-weekly__card-time">
                          {formatTimeRange(app.startsAt, app.endsAt)}
                        </div>
                        <div className="agenda-weekly__card-patient" title={app.patientName}>
                          {app.patientName}
                        </div>
                        <div className="agenda-weekly__card-type" title={app.appointmentTypeName}>
                          {app.appointmentTypeName}
                        </div>

                        <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <StatusBadge status={app.status} />

                          <div style={{ display: 'flex', gap: '0.2rem' }}>
                            {app.status !== 'atendido' && app.status !== 'faltou' && day.isToday && (
                              <button
                                type="button"
                                className="button button--link"
                                style={{ fontSize: '0.7rem', padding: '0 0.15rem' }}
                                onClick={() => onCheckIn(app)}
                                title="Check-in na fila"
                              >
                                Check-in
                              </button>
                            )}
                            {onPay && (
                              <button
                                type="button"
                                className="button button--link"
                                style={{ fontSize: '0.7rem', padding: '0 0.15rem' }}
                                onClick={() => onPay(app)}
                                title="Cobrar consulta"
                              >
                                Cobrar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Ações contextuais de atendimento */}
                        <div style={{ marginTop: '0.25rem', paddingTop: '0.25rem', borderTop: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className="button button--link"
                            style={{ fontSize: '0.7rem', padding: 0, color: '#16a34a' }}
                            onClick={() => onAttend(app)}
                            title="Marcar como atendido"
                          >
                            Atendido
                          </button>
                          <button
                            type="button"
                            className="button button--link"
                            style={{ fontSize: '0.7rem', padding: 0, color: '#dc2626' }}
                            onClick={() => onNoShow(app)}
                            title="Marcar como faltou"
                          >
                            Falta
                          </button>
                          <button
                            type="button"
                            className="button button--link"
                            style={{ fontSize: '0.7rem', padding: 0 }}
                            onClick={() => onReschedule(app)}
                            title="Remarcar horário"
                          >
                            Remarcar
                          </button>
                          <button
                            type="button"
                            className="button button--link"
                            style={{ fontSize: '0.7rem', padding: 0, color: '#64748b' }}
                            onClick={() => onCancel(app)}
                            title="Cancelar agendamento"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Botão de Atalho para Agendar no Dia */}
              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--ghost button--small"
                  style={{ width: '100%', fontSize: '0.75rem', padding: '0.3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => onCreateAppointment(day.date)}
                  title={`Novo agendamento para ${day.dayOfWeek}`}
                >
                  <Plus size={13} />
                  <span>Agendar</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
