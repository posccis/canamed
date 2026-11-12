import { useEffect, useState } from 'react';
import {
  Activity,
  CalendarPlus,
  CalendarDays,
  UserPlus,
  CalendarOff,
  Users,
  Stethoscope,
  CheckCircle,
  TrendingUp,
  Download,
} from 'lucide-react';

import {
  fetchDashboardSummary,
  type DashboardSummary,
  type UpcomingAppointment,
} from './dashboardApi';
import { getDailyPaymentSummary, type DailyPaymentSummaryResponse } from '../payments/paymentsApi';
import { formatTimeRange, todayIso } from '../agenda/agendaFormat';
import { StatusBadge } from '../agenda/StatusBadge';
import { exportToCsv } from '../../utils/exportCsv';
import type { StaffView } from '../../navigation/routes';

type DashboardPanelProps = {
  onNavigate: (view: StaffView) => void;
};

type PeriodType = 'hoje' | '7dias' | 'mes';

function getPastDays(count: number, referenceDateIso: string = todayIso()): string[] {
  const dates: string[] = [];
  const base = new Date(`${referenceDateIso}T12:00:00Z`);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getMonthDays(referenceDateIso: string = todayIso()): string[] {
  const base = new Date(`${referenceDateIso}T12:00:00Z`);
  const day = base.getUTCDate();
  const dates: string[] = [];
  for (let i = 1; i <= day; i++) {
    const d = new Date(base);
    d.setUTCDate(i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function aggregateDashboardSummaries(summaries: DashboardSummary[], label: string): DashboardSummary {
  if (summaries.length === 1) return summaries[0];

  let totalAppointments = 0;
  let scheduledCount = 0;
  let confirmedCount = 0;
  let attendedCount = 0;
  let noShowCount = 0;
  let cancelledCount = 0;
  let queueWaitingCount = 0;
  let queueInServiceCount = 0;
  let queueCompletedCount = 0;
  let totalWaitMinutes = 0;
  let waitCounts = 0;

  const profMap = new Map<
    string,
    { professionalId: string; professionalName: string; totalAppointments: number; attendedCount: number; noShowCount: number }
  >();
  const roomMap = new Map<string, { roomId: string; roomName: string; appointmentsCount: number }>();
  const upcomingList: UpcomingAppointment[] = [];

  for (const s of summaries) {
    totalAppointments += s.totalAppointments;
    scheduledCount += s.scheduledCount;
    confirmedCount += s.confirmedCount;
    attendedCount += s.attendedCount;
    noShowCount += s.noShowCount;
    cancelledCount += s.cancelledCount;
    queueWaitingCount = Math.max(queueWaitingCount, s.queueWaitingCount);
    queueInServiceCount = Math.max(queueInServiceCount, s.queueInServiceCount);
    queueCompletedCount += s.queueCompletedCount;
    if (s.averageWaitMinutes > 0) {
      totalWaitMinutes += s.averageWaitMinutes;
      waitCounts++;
    }
    for (const p of s.professionals) {
      const existing = profMap.get(p.professionalId);
      if (existing) {
        existing.totalAppointments += p.totalAppointments;
        existing.attendedCount += p.attendedCount;
        existing.noShowCount += p.noShowCount;
      } else {
        profMap.set(p.professionalId, { ...p });
      }
    }
    for (const r of s.rooms) {
      const existing = roomMap.get(r.roomId);
      if (existing) {
        existing.appointmentsCount += r.appointmentsCount;
      } else {
        roomMap.set(r.roomId, { ...r });
      }
    }
    if (s.upcomingAppointments) {
      upcomingList.push(...s.upcomingAppointments);
    }
  }

  const denominator = attendedCount + noShowCount;
  const attendanceRate = denominator > 0 ? Math.round((attendedCount / denominator) * 1000) / 10 : 0;
  const avgWait = waitCounts > 0 ? Math.round((totalWaitMinutes / waitCounts) * 10) / 10 : 0;

  return {
    date: label,
    totalAppointments,
    scheduledCount,
    confirmedCount,
    attendedCount,
    noShowCount,
    cancelledCount,
    attendanceRate,
    queueWaitingCount,
    queueInServiceCount,
    queueCompletedCount,
    averageWaitMinutes: avgWait,
    professionals: Array.from(profMap.values()),
    rooms: Array.from(roomMap.values()),
    upcomingAppointments: upcomingList.slice(0, 10),
  };
}

function aggregatePaymentSummaries(
  payments: (DailyPaymentSummaryResponse | null)[],
): DailyPaymentSummaryResponse | null {
  const valid = payments.filter((p): p is DailyPaymentSummaryResponse => p !== null);
  if (valid.length === 0) return null;
  return {
    date: 'periodo',
    totalReceived: valid.reduce((sum, p) => sum + (p.totalReceived ?? 0), 0),
    cashTotal: valid.reduce((sum, p) => sum + (p.cashTotal ?? 0), 0),
    pixTotal: valid.reduce((sum, p) => sum + (p.pixTotal ?? 0), 0),
    debitCardTotal: valid.reduce((sum, p) => sum + (p.debitCardTotal ?? 0), 0),
    creditCardTotal: valid.reduce((sum, p) => sum + (p.creditCardTotal ?? 0), 0),
    healthPlanBilledTotal: valid.reduce((sum, p) => sum + (p.healthPlanBilledTotal ?? 0), 0),
    transactionCount: valid.reduce((sum, p) => sum + (p.transactionCount ?? 0), 0),
    refundCount: valid.reduce((sum, p) => sum + (p.refundCount ?? 0), 0),
  };
}

export function DashboardPanel({ onNavigate }: DashboardPanelProps) {
  const today = todayIso();
  const [period, setPeriod] = useState<PeriodType>('hoje');

  // Pulso de Hoje (Tempo Real)
  const [todaySummary, setTodaySummary] = useState<DashboardSummary | null>(null);

  // Desempenho no Período
  const [periodSummary, setPeriodSummary] = useState<DashboardSummary | null>(null);
  const [periodPaymentSummary, setPeriodPaymentSummary] = useState<DailyPaymentSummaryResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Carrega o Pulso de Hoje (Tempo Real)
  useEffect(() => {
    const controller = new AbortController();

    fetchDashboardSummary(today, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setTodaySummary(data);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err && typeof err === 'object' && 'detail' in err
              ? String((err as { detail: string }).detail)
              : 'Não foi possível carregar os dados em tempo real da clínica.',
          );
        }
      });

    return () => controller.abort();
  }, [today]);

  // 2. Carrega o Desempenho no Período selecionado
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    let datesToFetch: string[] = [];
    let periodLabel = today;

    if (period === 'hoje') {
      datesToFetch = [today];
      periodLabel = today;
    } else if (period === '7dias') {
      datesToFetch = getPastDays(7, today);
      periodLabel = `Últimos 7 dias (${datesToFetch[0]} a ${today})`;
    } else if (period === 'mes') {
      datesToFetch = getMonthDays(today);
      periodLabel = `Mês Atual (${datesToFetch[0]} a ${today})`;
    }

    Promise.all([
      Promise.all(datesToFetch.map((d) => fetchDashboardSummary(d, controller.signal))),
      Promise.all(datesToFetch.map((d) => getDailyPaymentSummary(d, controller.signal).catch(() => null))),
    ])
      .then(([dashSummaries, paySummaries]) => {
        if (!controller.signal.aborted) {
          setPeriodSummary(aggregateDashboardSummaries(dashSummaries, periodLabel));
          setPeriodPaymentSummary(aggregatePaymentSummaries(paySummaries));
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err && typeof err === 'object' && 'detail' in err
              ? String((err as { detail: string }).detail)
              : 'Não foi possível carregar os dados consolidados do período.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [period, today]);

  const handleExportCsv = () => {
    if (!periodSummary) return;
    exportToCsv(`resumo-operacional-${period}-${today}.csv`, [
      {
        Periodo: periodSummary.date,
        TotalAgendados: periodSummary.totalAppointments,
        Confirmados: periodSummary.confirmedCount,
        Atendidos: periodSummary.attendedCount,
        Faltas: periodSummary.noShowCount,
        Cancelamentos: periodSummary.cancelledCount,
        TaxaComparecimento: `${periodSummary.attendanceRate}%`,
        FilaEspera: periodSummary.queueWaitingCount,
        FilaEmAtendimento: periodSummary.queueInServiceCount,
        TempoMedioEsperaMin: periodSummary.averageWaitMinutes,
        TotalRecebidoCaixa:
          periodPaymentSummary && typeof periodPaymentSummary.totalReceived === 'number'
            ? `R$ ${periodPaymentSummary.totalReceived.toFixed(2)}`
            : '',
      },
    ]);
  };

  const activePulse = todaySummary || periodSummary;

  return (
    <div className="page-container" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Barra de Ferramentas / Filtro do Topo (Protótipo Oficial) */}
      <div className="dashboard-toolbar">
        <div className="dashboard-toolbar__title-group">
          <div className="dashboard-toolbar__icon">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="dashboard-toolbar__heading">Painel Operacional</h1>
            <p className="dashboard-toolbar__sub">
              Resumo do Dia • Acompanhamento do fluxo ambulatorial e análise gerencial
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Seletor de Período (Hoje | Últimos 7 dias | Mês Atual) */}
          <div className="segmented-control" role="group" aria-label="Seletor de período">
            <button
              type="button"
              className={`segmented-control__btn ${period === 'hoje' ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setPeriod('hoje')}
            >
              Hoje
            </button>
            <button
              type="button"
              className={`segmented-control__btn ${period === '7dias' ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setPeriod('7dias')}
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              className={`segmented-control__btn ${period === 'mes' ? 'segmented-control__btn--active' : ''}`}
              onClick={() => setPeriod('mes')}
            >
              Mês Atual
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="date"
              value={today}
              readOnly
              style={{
                backgroundColor: 'var(--base-surface, #ffffff)',
                border: '1px solid var(--base-border, #e2e6ec)',
                color: 'var(--content-primary, #202631)',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                outline: 'none',
              }}
              title="Data de referência"
            />
          </div>

          {periodSummary ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={handleExportCsv}
              title="Exportar indicadores do período em formato CSV (SPEC-UI-001 / B-01)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
            >
              <Download size={15} />
              <span>Exportar CSV</span>
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <p>{error}</p>
        </div>
      ) : null}

      {/* BLOCO 1: Pulso de Hoje (Tempo Real) (SPEC-0030 / UI-02) */}
      {activePulse ? (
        <section aria-labelledby="pulse-heading" style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={18} style={{ color: 'var(--brand-primary, #852a91)' }} />
              <h2
                id="pulse-heading"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--content-primary, #202631)',
                }}
              >
                Pulso de Hoje
              </h2>
              <span
                className="badge badge--success"
                style={{
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontWeight: 700,
                  backgroundColor: 'var(--status-success-bg, #e9f5ec)',
                  color: 'var(--status-success, #237a52)',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                }}
              >
                Tempo Real
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--content-muted, #858d99)' }}>
              Data: {today}
            </span>
          </div>

          {/* Alerta de tempo de espera elevado na fila */}
          {activePulse.averageWaitMinutes > 25 && activePulse.queueWaitingCount > 0 ? (
            <div className="alert alert--error" style={{ marginBottom: '1.25rem' }}>
              <p>
                <strong>Atenção:</strong> O tempo médio de espera hoje está em{' '}
                <strong>{activePulse.averageWaitMinutes} min</strong>, com{' '}
                <strong>{activePulse.queueWaitingCount}</strong> paciente(s) aguardando atendimento.
              </p>
            </div>
          ) : null}

          {/* 4 KPIs Cards Estilo Protótipo Cana Med Mulher */}
          <div className="dashboard-kpi-grid">
            {/* KPI 1: Agendadas */}
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-card__top">
                <span className="dashboard-kpi-card__label">Agendadas (Hoje)</span>
                <div className="dashboard-kpi-card__icon-badge">
                  <CalendarDays size={18} />
                </div>
              </div>
              <div className="dashboard-kpi-card__bottom">
                <span className="dashboard-kpi-card__value">{activePulse.totalAppointments}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--status-success, #237a52)',
                    backgroundColor: 'var(--status-success-bg, #e9f5ec)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  +{activePulse.confirmedCount} confirmados
                </span>
              </div>
            </div>

            {/* KPI 2: Aguardando Recepção */}
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-card__top">
                <span className="dashboard-kpi-card__label">Aguardando Recepção</span>
                <div className="dashboard-kpi-card__icon-badge dashboard-kpi-card__icon-badge--warning">
                  <Users size={18} />
                </div>
              </div>
              <div className="dashboard-kpi-card__bottom">
                <span className="dashboard-kpi-card__value">{activePulse.queueWaitingCount}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--content-muted, #858d99)' }}>
                  {activePulse.averageWaitMinutes > 25 ? 'Espera elevada' : 'Fila em fluxo normal'}
                </span>
              </div>
            </div>

            {/* KPI 3: Em Atendimento (com brilho da marca e radar pulsante) */}
            <div className="dashboard-kpi-card dashboard-kpi-card--active">
              <div className="dashboard-kpi-card__top">
                <span className="dashboard-kpi-card__label">Em Atendimento</span>
                <div className="dashboard-kpi-card__icon-badge dashboard-kpi-card__icon-badge--brand">
                  <Stethoscope size={18} />
                </div>
              </div>
              <div className="dashboard-kpi-card__bottom">
                <span className="dashboard-kpi-card__value">{activePulse.queueInServiceCount}</span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--brand-primary, #852a91)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <span className="dashboard-radar-dot">
                    <span className="dashboard-radar-dot__ping" />
                    <span className="dashboard-radar-dot__solid" />
                  </span>
                  Consultórios ativos
                </span>
              </div>
            </div>

            {/* KPI 4: Concluídas / Taxa de Comparecimento */}
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-card__top">
                <span className="dashboard-kpi-card__label">Concluídas</span>
                <div className="dashboard-kpi-card__icon-badge dashboard-kpi-card__icon-badge--success">
                  <CheckCircle size={18} />
                </div>
              </div>
              <div className="dashboard-kpi-card__bottom">
                <span className="dashboard-kpi-card__value">{activePulse.attendedCount}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--content-muted, #858d99)', fontWeight: 500 }}>
                  {activePulse.totalAppointments > 0 ? Math.round((activePulse.attendedCount / activePulse.totalAppointments) * 100) : 0}% da agenda
                </span>
              </div>
            </div>
          </div>

          {/* Grid Principal: 2 Colunas (Próximos Atendimentos à esquerda + Ações Rápidas & Resumo à direita) */}
          <div className="dashboard-content-grid">
            {/* Coluna 1: Próximos Atendimentos */}
            <div className="dashboard-panel-card">
              <div className="dashboard-panel-card__header">
                <h3 className="dashboard-panel-card__title">Próximos Atendimentos</h3>
                <button
                  type="button"
                  className="button button--link"
                  onClick={() => onNavigate('agenda')}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--brand-primary, #852a91)',
                    padding: 0,
                  }}
                >
                  Ver agenda completa →
                </button>
              </div>

              {activePulse.upcomingAppointments.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--content-muted, #858d99)' }}>
                  Nenhum agendamento para esta data.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Horário</th>
                        <th>Paciente</th>
                        <th>Profissional</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePulse.upcomingAppointments.map((appt) => (
                        <tr key={appt.id}>
                          <td style={{ fontWeight: 700, color: 'var(--content-primary, #202631)', whiteSpace: 'nowrap' }}>
                            {formatTimeRange(appt.startsAt, appt.endsAt)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, color: 'var(--content-primary, #202631)' }}>
                                {appt.patientName}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--content-muted, #858d99)', marginTop: '0.1rem' }}>
                                {appt.appointmentTypeName}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--content-secondary, #626b79)', whiteSpace: 'nowrap' }}>
                            <div>Prof. {appt.professionalName}</div>
                            {appt.roomName ? (
                              <div style={{ fontSize: '0.75rem', color: 'var(--content-muted, #858d99)' }}>
                                Sala: {appt.roomName}
                              </div>
                            ) : null}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <StatusBadge status={appt.status} />
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              className="button button--ghost"
                              onClick={() => onNavigate('agenda')}
                              title="Gerenciar atendimento"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              Gerenciar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Coluna 2: Ações Rápidas & Resumo Cadastral */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Card Ações Rápidas */}
              <div className="dashboard-panel-card" style={{ padding: '1.25rem' }}>
                <h3
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--content-muted, #858d99)',
                    margin: '0 0 1rem',
                  }}
                >
                  Ações Rápidas
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button
                    type="button"
                    className="btn-primary-prototype"
                    onClick={() => onNavigate('agenda')}
                  >
                    <CalendarPlus size={17} />
                    <span>+ Novo Agendamento</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-prototype"
                    onClick={() => onNavigate('patients')}
                  >
                    <UserPlus size={17} />
                    <span>+ Cadastrar Paciente</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-prototype"
                    onClick={() => onNavigate('agenda')}
                  >
                    <CalendarOff size={17} />
                    <span>Bloquear Horário</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary-prototype"
                    onClick={() => onNavigate('queue')}
                  >
                    <Users size={17} />
                    <span>Fila &amp; Check-in</span>
                  </button>
                </div>
              </div>

              {/* Card Resumo Cadastral */}
              <div className="dashboard-panel-card" style={{ padding: '1.25rem' }}>
                <h3
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--content-muted, #858d99)',
                    margin: '0 0 1rem',
                  }}
                >
                  Resumo Cadastral
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--base-muted, #f1f3f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--content-secondary, #626b79)',
                        }}
                      >
                        <Users size={16} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--content-primary, #202631)' }}>
                        Agendamentos
                      </span>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--content-primary, #202631)' }}>
                      {activePulse.totalAppointments}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--base-muted, #f1f3f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--content-secondary, #626b79)',
                        }}
                      >
                        <Stethoscope size={16} />
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--content-primary, #202631)' }}>
                        Profissionais
                      </span>
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--content-primary, #202631)' }}>
                      {activePulse.professionals.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* BLOCO 2: Desempenho no Período (SPEC-0030 / UI-02) */}
      <section aria-labelledby="period-heading" style={{ marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--brand-primary, #852a91)' }} />
            <h2
              id="period-heading"
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--content-primary, #202631)',
              }}
            >
              Desempenho no Período
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="skeleton">
            <div className="skeleton__row" />
            <div className="skeleton__row" />
            <div className="skeleton__row" />
          </div>
        ) : periodSummary ? (
          <>
            {/* Cards de Métricas Consolidadas do Período */}
            <div className="stat-grid">
              <div className="stat-card">
                <span className="stat-card__label">Total Agendados</span>
                <span className="stat-card__value">{periodSummary.totalAppointments}</span>
                <span className="stat-card__sub">
                  {periodSummary.confirmedCount} confirmados • {periodSummary.scheduledCount} agendados
                </span>
              </div>

              <div className="stat-card stat-card--accent">
                <span className="stat-card__label">Atendidos</span>
                <span className="stat-card__value">{periodSummary.attendedCount}</span>
                <span className="stat-card__sub">
                  {periodSummary.attendanceRate}% taxa de comparecimento
                </span>
              </div>

              <div className="stat-card stat-card--secondary">
                <span className="stat-card__label">Tempo Médio de Espera</span>
                <span className="stat-card__value">
                  {periodSummary.averageWaitMinutes}{' '}
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>min</span>
                </span>
                <span className="stat-card__sub">
                  {periodSummary.queueCompletedCount} chamadas concluídas
                </span>
              </div>

              {periodPaymentSummary && typeof periodPaymentSummary.totalReceived === 'number' ? (
                <div className="stat-card">
                  <span className="stat-card__label">Caixa do Balcão</span>
                  <span className="stat-card__value">
                    R$ {periodPaymentSummary.totalReceived.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="stat-card__sub">
                    {periodPaymentSummary.transactionCount ?? 0} pagamento(s)
                    {(periodPaymentSummary.refundCount ?? 0) > 0
                      ? ` • ${periodPaymentSummary.refundCount} estorno(s)`
                      : ''}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Grid: Produção por Profissional & Ocupação das Salas */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              {/* Desempenho por Profissional */}
              <div className="card">
                <h3 className="card__title" style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
                  Produção por Profissional
                </h3>
                {periodSummary.professionals.length === 0 ? (
                  <p className="empty">Nenhum atendimento vinculado para este período.</p>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Profissional</th>
                          <th style={{ textAlign: 'center' }}>Total</th>
                          <th style={{ textAlign: 'center' }}>Atendidos</th>
                          <th style={{ textAlign: 'center' }}>Faltas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodSummary.professionals.map((prof) => (
                          <tr key={prof.professionalId}>
                            <td>
                              <strong>{prof.professionalName}</strong>
                            </td>
                            <td style={{ textAlign: 'center' }}>{prof.totalAppointments}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: '#852A91', fontWeight: 600 }}>
                                {prof.attendedCount}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: prof.noShowCount > 0 ? '#dc2626' : undefined }}>
                                {prof.noShowCount}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ocupação por Sala & Ações Rápidas */}
              <div className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3 className="card__title" style={{ margin: 0, fontSize: '1rem' }}>
                    Ocupação das Salas
                  </h3>
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => onNavigate('operation')}
                  >
                    Gerenciar salas →
                  </button>
                </div>

                {periodSummary.rooms.length === 0 ? (
                  <p className="empty">Nenhuma sala com agendamento neste período.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {periodSummary.rooms.map((room) => (
                      <div
                        key={room.roomId}
                        style={{
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          padding: '0.65rem 0.9rem',
                          backgroundColor: 'var(--color-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                        }}
                      >
                        <strong>{room.roomName}:</strong>
                        <span className="badge badge--agendado">
                          {room.appointmentsCount} consulta(s)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    marginTop: '1.25rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => onNavigate('queue')}
                  >
                    Acessar Fila de Espera
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => onNavigate('agenda')}
                  >
                    Abrir Agenda do Dia
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

