import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Play,
  Calendar,
  ExternalLink,
  Stethoscope,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  fetchDoctorDashboardSummary,
  doctorStartConsultationByAppointment,
  type DoctorDashboardSummaryResponse,
} from './doctorWorkspaceApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS } from '../../navigation/routes';

export function DoctorDashboardPage() {
  const { state: sessionState } = useSession();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DoctorDashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingAppointmentId, setStartingAppointmentId] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDoctorDashboardSummary();
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setSummary({
          ...data,
          upcomingAppointments: Array.isArray(data.upcomingAppointments) ? data.upcomingAppointments : [],
        });
      } else {
        setSummary(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar dashboard médico.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadSummary();
    const interval = setInterval(loadSummary, 15000); // Atualização automática a cada 15 segundos
    return () => clearInterval(interval);
  }, [loadSummary]);

  async function handleStartByAppointment(appointmentId: string, patientName: string) {
    setStartingAppointmentId(appointmentId);
    try {
      await doctorStartConsultationByAppointment(appointmentId);
      addToast(`Atendimento iniciado: ${patientName}`, 'success');
      navigate('/medico/consultorio');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar consulta.';
      addToast(msg, 'error');
    } finally {
      setStartingAppointmentId(null);
    }
  }

  const doctorName = sessionState.status === 'authenticated' ? sessionState.session?.user?.name || 'Médico' : 'Médico';
  const activeConsultation = summary?.activeConsultation;
  const upcomingAppointments = Array.isArray(summary?.upcomingAppointments) ? summary.upcomingAppointments : [];

  return (
    <div className="page" style={{ maxWidth: '1440px', gap: '1.25rem' }}>
      {/* Header do Dashboard */}
      <header className="page__header" style={{ marginBottom: '0.5rem' }}>
        <div>
          <h1 className="page__title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={28} color="var(--color-primary)" />
            Dashboard Clínico — Cana Med Mulher
          </h1>
          <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
            Olá, <strong>Dr(a). {doctorName}</strong>. Acompanhe o fluxo ambulatorial e os indicadores do seu consultório hoje.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/medico/consultorio" className="button button--primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Stethoscope size={16} />
            Entrar no Consultório
          </Link>
          <Link to={DOCTOR_PATHS.agenda} className="button button--secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} />
            Minha Agenda
          </Link>
        </div>
      </header>

      {/* Hero Card: Status de Atendimento Atual ou Fila Ativa */}
      {activeConsultation ? (
        <section
          style={{
            background: 'linear-gradient(135deg, #005F6A 0%, #008080 100%)',
            color: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.95, fontWeight: 700 }}>
              <span className="pulse-indicator" aria-hidden="true" />
              Paciente em Atendimento no Consultório
            </span>
            <h2 style={{ margin: '0.25rem 0', fontSize: '1.6rem', color: '#ffffff' }}>
              {activeConsultation.patientName}
            </h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
              {activeConsultation.allergies ? `Alergias: ${activeConsultation.allergies} • ` : ''}
              {activeConsultation.triage?.riskClassification ? `Triagem: ${activeConsultation.triage.riskClassification.toUpperCase()}` : 'Sem triagem de risco'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link
              to={DOCTOR_PATHS.patientRecord(activeConsultation.patientId)}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary button--small"
              style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#ffffff' }}
            >
              Abrir Prontuário (PEP) ↗
            </Link>
            <Link
              to="/medico/consultorio"
              className="button"
              style={{ background: '#ffffff', color: 'var(--color-primary-dark)', fontWeight: 700 }}
            >
              Retomar Atendimento ▶
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--color-highlight)', padding: '0.85rem', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
              <Stethoscope size={28} />
            </div>
            <div>
              <strong style={{ fontSize: '1.15rem', color: 'var(--color-text)', display: 'block' }}>
                Consultório Livre no Momento
              </strong>
              <p className="form__hint" style={{ margin: '0.15rem 0 0' }}>
                {summary && summary.todayWaitingCount > 0
                  ? `Há ${summary.todayWaitingCount} paciente(s) aguardando na fila de espera hoje.`
                  : 'Nenhum paciente aguardando na fila agora. Acompanhe a agenda do dia.'}
              </p>
            </div>
          </div>

          <Link
            to="/medico/consultorio"
            className="button button--primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            Acessar Fila e Chamar Paciente
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

      {/* Grid de Métricas do Dia */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.1rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <Calendar size={16} /> Total Agendado Hoje
          </div>
          <strong style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)' }}>
            {summary ? summary.todayTotalAppointments : '—'}
          </strong>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.1rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#854d0e', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <Clock size={16} /> Aguardando na Fila
          </div>
          <strong style={{ fontSize: '1.8rem', color: '#854d0e' }}>
            {summary ? summary.todayWaitingCount : '—'}
          </strong>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.1rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#15803d', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <CheckCircle2 size={16} /> Consultas Atendidas
          </div>
          <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>
            {summary ? summary.todayAttendedCount : '—'}
          </strong>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.1rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <XCircle size={16} /> Faltas Registradas
          </div>
          <strong style={{ fontSize: '1.8rem', color: '#b91c1c' }}>
            {summary ? summary.todayNoShowCount : '—'}
          </strong>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.1rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#4338ca', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
            <FileEdit size={16} /> Prontuários em Aberto
          </div>
          <strong style={{ fontSize: '1.8rem', color: '#4338ca' }}>
            {summary ? summary.pendingDraftRecordsCount : '—'}
          </strong>
        </div>
      </section>

      {/* Próximos Pacientes e Agenda do Dia */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--color-primary)" />
              Próximos Pacientes da Agenda de Hoje
            </h3>
            <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
              Distinção entre Primeira Consulta e Retorno conforme a rotina ginecológica.
            </p>
          </div>

          <Link to={DOCTOR_PATHS.agenda} className="button button--secondary button--small">
            Ver Agenda Completa ↗
          </Link>
        </div>

        {loading && !summary ? (
          <p className="form__hint">Carregando pacientes do dia…</p>
        ) : upcomingAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '1.05rem', margin: '0 0 0.5rem' }}>Nenhum paciente agendado para o dia de hoje.</p>
            <p className="form__hint">Acesse a Minha Agenda para visualizar outras datas ou efetuar encaixes.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingAppointments.map((app) => {
              const start = new Date(app.startsAt);
              const end = new Date(app.endsAt);
              const timeString = `${start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
              const isFollowUp = app.consultationCategory === 'retorno';

              return (
                <div
                  key={app.appointmentId}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem 1.2rem',
                    background:
                      app.status === 'atendido'
                        ? '#f0fdf4'
                        : app.status === 'falta'
                        ? '#fef2f2'
                        : 'var(--color-surface)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-dark)',
                        minWidth: '105px',
                        background: '#ffffff',
                        padding: '0.35rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {timeString}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--color-text)' }}>
                          {app.patientName}
                        </strong>

                        {/* Tag de Tipo de Consulta: Primeira Vez vs Retorno (MED-05) */}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: isFollowUp ? '#fef3c7' : '#e0f2fe',
                            color: isFollowUp ? '#92400e' : '#0369a1',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isFollowUp ? 'Retorno / Exames' : 'Primeira Consulta'}
                        </span>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            background:
                              app.status === 'atendido'
                                ? '#dcfce7'
                                : app.status === 'falta'
                                ? '#fee2e2'
                                : '#f1f5f9',
                            color:
                              app.status === 'atendido'
                                ? '#15803d'
                                : app.status === 'falta'
                                ? '#991b1b'
                                : '#475569',
                          }}
                        >
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
                        Tipo: {app.appointmentTypeName}
                        {app.roomName ? ` • Sala: ${app.roomName}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Ações Rápidas (UI-02: outline/secondary para evitar fadiga visual) */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link
                      to={DOCTOR_PATHS.patientRecord(app.patientId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button--secondary button--small"
                      title="Abrir prontuário ginecológico em nova aba"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <ExternalLink size={14} />
                      PEP ↗
                    </Link>

                    {app.status !== 'atendido' && app.status !== 'falta' && (
                      <button
                        type="button"
                        className="button button--secondary button--small"
                        onClick={() => handleStartByAppointment(app.appointmentId, app.patientName)}
                        disabled={startingAppointmentId === app.appointmentId}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-primary)' }}
                        title="Iniciar consulta e carregar prontuário no consultório"
                      >
                        <Play size={14} />
                        {startingAppointmentId === app.appointmentId ? 'Iniciando…' : 'Iniciar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
