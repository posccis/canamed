import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchAgendaDay,
  markAppointmentAttended,
  markAppointmentNoShow,
  type Appointment,
  type AgendaDay,
} from '../agenda/agendaApi';
import { doctorStartConsultationByAppointment } from './doctorWorkspaceApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS } from '../../navigation/routes';

export function DoctorAgendaPage() {
  const { state: sessionState } = useSession();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [agenda, setAgenda] = useState<AgendaDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function handleStartConsultation(appointmentId: string, patientName: string) {
    setActionInProgress(appointmentId);
    try {
      await doctorStartConsultationByAppointment(appointmentId);
      addToast(`Atendimento iniciado: ${patientName}`, 'success');
      navigate('/medico/consultorio');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar consulta.';
      addToast(msg, 'error');
    } finally {
      setActionInProgress(null);
    }
  }

  const loadDay = useCallback(async (date: string) => {
    setLoading(true);
    try {
      // professionalId pode vir da sessão se configurado, ou busca a agenda geral filtrando no client
      const data = await fetchAgendaDay(date, undefined);
      setAgenda(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao buscar agenda do dia.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadDay(selectedDate);
  }, [selectedDate, loadDay]);

  function changeDayOffset(offsetDays: number) {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(current.toISOString().slice(0, 10));
  }

  function goToToday() {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  }

  async function handleMarkAttended(appointmentId: string) {
    setActionInProgress(appointmentId);
    try {
      await markAppointmentAttended(appointmentId);
      addToast('Presença confirmada / paciente atendido!', 'success');
      await loadDay(selectedDate);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao atualizar status.';
      addToast(msg, 'error');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleMarkNoShow(appointmentId: string) {
    setActionInProgress(appointmentId);
    try {
      await markAppointmentNoShow(appointmentId);
      addToast('Falta registrada.', 'info');
      await loadDay(selectedDate);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar falta.';
      addToast(msg, 'error');
    } finally {
      setActionInProgress(null);
    }
  }

  const appointments: Appointment[] = agenda?.appointments || [];

  // Métricas do dia
  const totalCount = appointments.length;
  const attendedCount = appointments.filter((a) => a.status === 'atendido').length;
  const noShowCount = appointments.filter((a) => a.status === 'falta').length;
  const scheduledCount = appointments.filter((a) => a.status === 'agendado' || a.status === 'confirmado').length;

  return (
    <div className="page" style={{ maxWidth: '1400px' }}>
      <header className="page__header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page__title">Minha Agenda</h1>
          <p className="form__hint">
            Consultas agendadas para o Dr(a). {sessionState.status === 'authenticated' ? sessionState.session?.user?.name || 'Médico' : 'Médico'}
          </p>
        </div>

        {/* Controles de Data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={() => changeDayOffset(-1)}
            title="Dia anterior"
          >
            ◀ Dia Anterior
          </button>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={goToToday}
            title="Ir para hoje"
          >
            Hoje
          </button>
          <button
            type="button"
            className="button button--secondary button--small"
            onClick={() => changeDayOffset(1)}
            title="Próximo dia"
          >
            Próximo Dia ▶
          </button>
          <input
            type="date"
            className="form__input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.6rem' }}
          />
        </div>
      </header>

      {/* Cartões de Indicadores da Agenda */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid var(--color-neutral-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)', display: 'block' }}>Total Agendado</span>
          <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary-dark)' }}>{totalCount}</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid var(--color-neutral-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)', display: 'block' }}>Aguardando / Previsto</span>
          <strong style={{ fontSize: '1.5rem', color: '#854d0e' }}>{scheduledCount}</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid var(--color-neutral-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)', display: 'block' }}>Atendidos</span>
          <strong style={{ fontSize: '1.5rem', color: '#15803d' }}>{attendedCount}</strong>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid var(--color-neutral-border)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)', display: 'block' }}>Faltas</span>
          <strong style={{ fontSize: '1.5rem', color: '#b91c1c' }}>{noShowCount}</strong>
        </div>
      </div>

      {/* Lista de Consultas */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loading ? (
          <p className="form__hint">Carregando consultas da data…</p>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-neutral-muted)' }}>
            <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Nenhum horário agendado para esta data.</p>
            <p className="form__hint">Selecione outro dia ou acesse o consultório para verificar a fila de encaixe.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {appointments.map((app) => {
              const start = new Date(app.startsAt);
              const end = new Date(app.endsAt);
              const timeString = `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

              return (
                <div
                  key={app.id}
                  style={{
                    border: '1px solid var(--color-neutral-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    background: app.status === 'atendido' ? '#f0fdf4' : app.status === 'falta' ? '#fef2f2' : 'var(--color-neutral-surface)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-dark)',
                        minWidth: '110px',
                        background: '#ffffff',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        border: '1px solid var(--color-neutral-border)',
                      }}
                    >
                      {timeString}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--color-neutral-dark)' }}>
                          {app.patientName}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background:
                              app.status === 'atendido'
                                ? '#dcfce7'
                                : app.status === 'falta'
                                ? '#fee2e2'
                                : app.status === 'confirmado'
                                ? '#dbeafe'
                                : '#fef9c3',
                            color:
                              app.status === 'atendido'
                                ? '#15803d'
                                : app.status === 'falta'
                                ? '#991b1b'
                                : app.status === 'confirmado'
                                ? '#1e40af'
                                : '#854d0e',
                          }}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
                        Tipo: {app.appointmentTypeName || 'Consulta Geral'}
                        {app.roomName ? ` • Sala: ${app.roomName}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Ações com links para nova aba */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link
                      to={DOCTOR_PATHS.patientRecord(app.patientId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button--secondary button--small"
                      title="Abrir Prontuário do Paciente em Nova Aba"
                    >
                      📋 Prontuário (PEP) ↗
                    </Link>

                    {app.status !== 'atendido' && app.status !== 'falta' && app.status !== 'cancelado' && (
                      <>
                        <button
                          type="button"
                          className="button button--primary button--small"
                          onClick={() => handleStartConsultation(app.id, app.patientName)}
                          disabled={actionInProgress === app.id}
                          title="Iniciar atendimento no consultório e abrir prontuário"
                        >
                          ▶ Iniciar Atendimento
                        </button>
                        <button
                          type="button"
                          className="button button--secondary button--small"
                          onClick={() => handleMarkAttended(app.id)}
                          disabled={actionInProgress === app.id}
                        >
                          ✓ Atendido
                        </button>
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => handleMarkNoShow(app.id)}
                          disabled={actionInProgress === app.id}
                          style={{ color: '#b91c1c' }}
                        >
                          Falta
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {agenda?.blocks && agenda.blocks.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-neutral-border)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⛔</span> Horários Bloqueados ({agenda.blocks.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {agenda.blocks.map((block) => {
                const start = new Date(block.startsAt);
                const end = new Date(block.endsAt);
                const timeString = `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <div
                    key={block.id}
                    style={{
                      border: '1px dashed #d1d5db',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      background: '#f9fafb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          background: '#e5e7eb',
                          color: '#374151',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {timeString}
                      </span>
                      <div>
                        <strong style={{ color: '#4b5563', fontSize: '0.95rem', display: 'block' }}>
                          Horário Indisponível para Agendamento
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          Bloqueio na agenda do profissional
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                      }}
                    >
                      Bloqueado
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
