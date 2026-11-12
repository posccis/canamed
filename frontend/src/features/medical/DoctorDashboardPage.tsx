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
      {/* Header do Dashboard com Toolbar no padrão do protótipo */}
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar__title-group">
          <div className="dashboard-toolbar__icon">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="dashboard-toolbar__heading">Dashboard Clínico — Cana Med Mulher</h1>
            <p className="dashboard-toolbar__sub">
              Olá, <strong>Dr(a). {doctorName}</strong>. Acompanhe o fluxo ambulatorial e os indicadores do seu consultório hoje.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link
            to="/medico/consultorio"
            className="btn-primary-prototype"
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          >
            <Stethoscope size={16} />
            <span>Entrar no Consultório</span>
          </Link>
          <Link
            to={DOCTOR_PATHS.agenda}
            className="btn-secondary-prototype"
            style={{ width: 'auto', padding: '0.5rem 1rem' }}
          >
            <Calendar size={16} />
            <span>Minha Agenda</span>
          </Link>
        </div>
      </div>

      {/* Hero Card: Status de Atendimento Atual ou Fila Ativa */}
      {activeConsultation ? (
        <section
          style={{
            background: 'linear-gradient(135deg, var(--brand-primary, #852A91) 0%, #6F217B 100%)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '1.5rem',
            boxShadow: '0 4px 15px -3px rgba(133, 42, 145, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <span className="dashboard-radar-dot">
                <span className="dashboard-radar-dot__ping" style={{ backgroundColor: '#ffffff' }} />
                <span className="dashboard-radar-dot__solid" style={{ backgroundColor: '#ffffff' }} />
              </span>
              Paciente em Atendimento no Consultório
            </span>
            <h2 style={{ margin: '0.35rem 0', fontSize: '1.65rem', fontWeight: 700, color: '#ffffff' }}>
              {activeConsultation.patientName}
            </h2>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.875rem' }}>
              {activeConsultation.allergies ? `Alergias: ${activeConsultation.allergies} • ` : ''}
              {activeConsultation.triage?.riskClassification
                ? `Triagem: ${activeConsultation.triage.riskClassification.toUpperCase()}`
                : 'Sem triagem de risco'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to={DOCTOR_PATHS.patientRecord(activeConsultation.patientId)}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary button--small"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px',
              }}
            >
              Abrir Prontuário (PEP) ↗
            </Link>
            <Link
              to="/medico/consultorio"
              className="button"
              style={{
                background: '#ffffff',
                color: 'var(--brand-primary, #852A91)',
                fontWeight: 700,
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              Retomar Atendimento ▶
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            background: 'var(--base-surface, #ffffff)',
            border: '1px solid var(--base-border, #e2e6ec)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 2px 10px -2px rgba(32, 38, 49, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                background: 'var(--brand-soft, #F7ECF8)',
                padding: '0.85rem',
                borderRadius: '12px',
                color: 'var(--brand-primary, #852A91)',
              }}
            >
              <Stethoscope size={26} />
            </div>
            <div>
              <strong style={{ fontSize: '1.1rem', color: 'var(--content-primary, #202631)', display: 'block' }}>
                Consultório Livre no Momento
              </strong>
              <p className="form__hint" style={{ margin: '0.15rem 0 0', color: 'var(--content-muted, #858d99)' }}>
                {summary && summary.todayWaitingCount > 0
                  ? `Há ${summary.todayWaitingCount} paciente(s) aguardando na fila de espera hoje.`
                  : 'Nenhum paciente aguardando na fila agora. Acompanhe a agenda do dia.'}
              </p>
            </div>
          </div>

          <Link
            to="/medico/consultorio"
            className="btn-primary-prototype"
            style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
          >
            <span>Acessar Fila e Chamar Paciente</span>
            <ArrowRight size={16} />
          </Link>
        </section>
      )}

      {/* Grid de 5 Métricas do Dia (Padrão de Cards do Protótipo) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-card__top">
            <span className="dashboard-kpi-card__label">Total Agendado Hoje</span>
            <div className="dashboard-kpi-card__icon-badge">
              <Calendar size={18} />
            </div>
          </div>
          <div className="dashboard-kpi-card__bottom">
            <span className="dashboard-kpi-card__value">
              {summary ? summary.todayTotalAppointments : '—'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--content-muted, #858d99)' }}>
              Agenda do dia
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-card__top">
            <span className="dashboard-kpi-card__label">Aguardando na Fila</span>
            <div className="dashboard-kpi-card__icon-badge dashboard-kpi-card__icon-badge--warning">
              <Clock size={18} />
            </div>
          </div>
          <div className="dashboard-kpi-card__bottom">
            <span className="dashboard-kpi-card__value" style={{ color: 'var(--status-warning, #a96512)' }}>
              {summary ? summary.todayWaitingCount : '—'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--status-warning, #a96512)',
                backgroundColor: 'var(--status-warning-bg, #fdf0e1)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Recepção
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-card__top">
            <span className="dashboard-kpi-card__label">Consultas Atendidas</span>
            <div className="dashboard-kpi-card__icon-badge dashboard-kpi-card__icon-badge--success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="dashboard-kpi-card__bottom">
            <span className="dashboard-kpi-card__value" style={{ color: 'var(--status-success, #237a52)' }}>
              {summary ? summary.todayAttendedCount : '—'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--status-success, #237a52)',
                backgroundColor: 'var(--status-success-bg, #e9f5ec)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Concluídas
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-card__top">
            <span className="dashboard-kpi-card__label">Faltas Registradas</span>
            <div className="dashboard-kpi-card__icon-badge" style={{ backgroundColor: 'var(--status-error-bg, #fcecee)', color: 'var(--status-error, #c33d49)' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="dashboard-kpi-card__bottom">
            <span className="dashboard-kpi-card__value" style={{ color: 'var(--status-error, #c33d49)' }}>
              {summary ? summary.todayNoShowCount : '—'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--content-muted, #858d99)' }}>
              Não compareceu
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card">
          <div className="dashboard-kpi-card__top">
            <span className="dashboard-kpi-card__label">Prontuários em Aberto</span>
            <div className="dashboard-kpi-card__icon-badge dashboard-kpi-card__icon-badge--brand">
              <FileEdit size={18} />
            </div>
          </div>
          <div className="dashboard-kpi-card__bottom">
            <span className="dashboard-kpi-card__value" style={{ color: 'var(--brand-primary, #852A91)' }}>
              {summary ? summary.pendingDraftRecordsCount : '—'}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--brand-primary, #852A91)',
                backgroundColor: 'var(--brand-soft, #F7ECF8)',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                fontWeight: 600,
              }}
            >
              Rascunhos PEP
            </span>
          </div>
        </div>
      </section>

      {/* Próximos Pacientes e Agenda do Dia */}
      <section className="dashboard-panel-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--content-primary, #202631)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--brand-primary, #852A91)" />
              Próximos Pacientes da Agenda de Hoje
            </h3>
            <p className="form__hint" style={{ margin: '0.2rem 0 0', color: 'var(--content-muted, #858d99)' }}>
              Distinção entre Primeira Consulta e Retorno conforme a rotina ginecológica.
            </p>
          </div>

          <Link
            to={DOCTOR_PATHS.agenda}
            className="button button--ghost"
            style={{ fontWeight: 600, color: 'var(--brand-primary, #852A91)', fontSize: '0.85rem' }}
          >
            Ver Agenda Completa ↗
          </Link>
        </div>

        {loading && !summary ? (
          <p className="form__hint">Carregando pacientes do dia…</p>
        ) : upcomingAppointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--content-muted, #858d99)' }}>
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
                    border: '1px solid var(--base-border, #e2e6ec)',
                    borderRadius: '12px',
                    padding: '0.9rem 1.25rem',
                    background:
                      app.status === 'atendido'
                        ? 'var(--status-success-bg, #e9f5ec)'
                        : app.status === 'falta'
                        ? 'var(--status-error-bg, #fcecee)'
                        : 'var(--base-surface, #ffffff)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--content-primary, #202631)',
                        minWidth: '105px',
                        background: 'var(--base-bg, #f7f8fa)',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid var(--base-border, #e2e6ec)',
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

