import { useEffect, useState } from 'react';
import {
  Activity,
  CalendarPlus,
  UserPlus,
  CalendarOff,
  Users,
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
    <div className="page-container">
      {/* Cabeçalho da Página */}
      <div className="page__header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page__title">Painel Operacional</h1>
          <p className="page__tagline">
            Visão consolidada do fluxo da clínica hoje em tempo real e análise gerencial de desempenho.
          </p>
        </div>
      </div>

      {/* Barra de Atalhos de Ação Rápida de 1 clique (SPEC-0030 / UI-02) */}
      <div
        className="quick-actions-bar"
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--color-border)',
        }}
      >
        <button
          type="button"
          className="button button--primary"
          onClick={() => onNavigate('agenda')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CalendarPlus size={16} />
          <span>+ Novo Agendamento</span>
        </button>

        <button
          type="button"
          className="button button--secondary"
          onClick={() => onNavigate('patients')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <UserPlus size={16} />
          <span>+ Cadastrar Paciente</span>
        </button>

        <button
          type="button"
          className="button button--ghost"
          onClick={() => onNavigate('agenda')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CalendarOff size={16} />
          <span>Bloquear Horário</span>
        </button>

        <button
          type="button"
          className="button button--ghost"
          onClick={() => onNavigate('queue')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Users size={16} />
          <span>Fila &amp; Check-in</span>
        </button>
      </div>

      {error ? (
        <div className="alert alert--error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <p>{error}</p>
        </div>
      ) : null}

      {/* BLOCO 1: Pulso de Hoje (Tempo Real) (SPEC-0030 / UI-02) */}
      {activePulse ? (
        <section aria-labelledby="pulse-heading" style={{ marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={20} style={{ color: 'var(--color-primary)' }} />
              <h2
                id="pulse-heading"
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  margin: 0,
                  color: 'var(--color-secondary)',
                }}
              >
                Pulso de Hoje
              </h2>
              <span
                className="badge badge--success"
                style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                Tempo Real
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
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

          {/* 4 KPIs Compactos do Pulso */}
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Agendamentos Hoje</span>
              <span className="stat-card__value">{activePulse.totalAppointments}</span>
              <span className="stat-card__sub">
                {activePulse.confirmedCount} confirmados • {activePulse.scheduledCount} agendados
              </span>
            </div>

            <div className="stat-card stat-card--secondary">
              <span className="stat-card__label">Pacientes em Espera</span>
              <span className="stat-card__value">{activePulse.queueWaitingCount}</span>
              <span className="stat-card__sub">
                {activePulse.queueInServiceCount} em atendimento agora
              </span>
            </div>

            <div className="stat-card stat-card--accent">
              <span className="stat-card__label">Em Atendimento</span>
              <span className="stat-card__value">{activePulse.queueInServiceCount}</span>
              <span className="stat-card__sub">
                {activePulse.attendedCount} concluídos hoje
              </span>
            </div>

            <div className="stat-card stat-card--neutral">
              <span className="stat-card__label">Faltas &amp; Cancelamentos</span>
              <span
                className="stat-card__value"
                style={{
                  color:
                    activePulse.noShowCount + activePulse.cancelledCount > 0 ? '#b91c1c' : undefined,
                }}
              >
                {activePulse.noShowCount + activePulse.cancelledCount}
              </span>
              <span className="stat-card__sub">
                {activePulse.noShowCount} faltas • {activePulse.cancelledCount} cancelados
              </span>
            </div>
          </div>

          {/* Próximos Atendimentos */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h3 className="card__title" style={{ margin: 0, fontSize: '1rem' }}>
                Próximos Atendimentos
              </h3>
              <button
                type="button"
                className="button button--link"
                onClick={() => onNavigate('agenda')}
              >
                Ver agenda completa →
              </button>
            </div>

            {activePulse.upcomingAppointments.length === 0 ? (
              <p className="empty">Nenhum agendamento para esta data.</p>
            ) : (
              <ul className="agenda__list">
                {activePulse.upcomingAppointments.map((appt) => (
                  <li key={appt.id} className="agenda__item">
                    <div className="agenda__time">
                      {formatTimeRange(appt.startsAt, appt.endsAt)}
                    </div>
                    <div className="agenda__details">
                      <p className="agenda__patient">{appt.patientName}</p>
                      <p className="agenda__meta">
                        {appt.professionalName} • {appt.appointmentTypeName}
                        {appt.roomName ? ` • Sala: ${appt.roomName}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
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
            <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
            <h2
              id="period-heading"
              style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                margin: 0,
                color: 'var(--color-secondary)',
              }}
            >
              Desempenho no Período
            </h2>
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

            {periodSummary ? (
              <button
                type="button"
                className="button button--ghost"
                onClick={handleExportCsv}
                title="Exportar indicadores do período em formato CSV (SPEC-UI-001 / B-01)"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={15} />
                <span>Exportar CSV</span>
              </button>
            ) : null}
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
                              <span style={{ color: '#008080', fontWeight: 600 }}>
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
