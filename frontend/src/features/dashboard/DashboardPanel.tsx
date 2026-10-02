import { useEffect, useState } from 'react';

import { fetchDashboardSummary, type DashboardSummary } from './dashboardApi';
import { getDailyPaymentSummary, type DailyPaymentSummaryResponse } from '../payments/paymentsApi';
import { formatTimeRange, todayIso } from '../agenda/agendaFormat';
import { StatusBadge } from '../agenda/StatusBadge';
import { exportToCsv } from '../../utils/exportCsv';

type DashboardPanelProps = {
  onNavigate: (view: 'dashboard' | 'agenda' | 'queue' | 'operation' | 'catalog' | 'users') => void;
};

export function DashboardPanel({ onNavigate }: DashboardPanelProps) {
  const [date, setDate] = useState(todayIso());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<DailyPaymentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    Promise.all([
      fetchDashboardSummary(date, controller.signal),
      getDailyPaymentSummary(date, controller.signal).catch(() => null),
    ])
      .then(([dashData, payData]) => {
        if (!controller.signal.aborted) {
          setSummary(dashData);
          setPaymentSummary(payData);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err && typeof err === 'object' && 'detail' in err
              ? String((err as { detail: string }).detail)
              : 'Não foi possível carregar o resumo operacional.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [date]);

  const isToday = date === todayIso();

  return (
    <div className="page-container">
      <div className="page__header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page__title">Painel Operacional</h1>
          <p className="page__tagline">
            {isToday
              ? 'Visão consolidada do fluxo da clínica hoje em tempo real.'
              : `Visão consolidada da operação no dia ${date}.`}
          </p>
        </div>

        <div className="toolbar" style={{ margin: 0 }}>
          <label className="field field--compact" style={{ minWidth: '150px' }}>
            <span className="field__label">Data</span>
            <input
              type="date"
              className="field__input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setDate(todayIso())}
            disabled={isToday}
          >
            Hoje
          </button>
          {summary ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                exportToCsv(`resumo-operacional-${date}.csv`, [
                  {
                    Data: summary.date,
                    TotalAgendados: summary.totalAppointments,
                    Confirmados: summary.confirmedCount,
                    Atendidos: summary.attendedCount,
                    Faltas: summary.noShowCount,
                    Cancelamentos: summary.cancelledCount,
                    TaxaComparecimento: `${summary.attendanceRate}%`,
                    FilaEspera: summary.queueWaitingCount,
                    FilaEmAtendimento: summary.queueInServiceCount,
                    TempoMedioEsperaMin: summary.averageWaitMinutes,
                    TotalRecebidoCaixa:
                      paymentSummary && typeof paymentSummary.totalReceived === 'number'
                        ? `R$ ${paymentSummary.totalReceived.toFixed(2)}`
                        : '',
                  },
                ]);
              }}
              title="Exportar indicadores do dia em formato CSV (SPEC-UI-001 / B-01)"
            >
              Exportar CSV
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="skeleton">
          <div className="skeleton__row" />
          <div className="skeleton__row" />
          <div className="skeleton__row" />
        </div>
      ) : summary ? (
        <>
          {/* Alerta de tempo de espera elevado na fila */}
          {summary.averageWaitMinutes > 25 && summary.queueWaitingCount > 0 ? (
            <div className="alert alert--error" style={{ marginBottom: '1.25rem' }}>
              <p>
                <strong>Atenção:</strong> O tempo médio de espera hoje está em{' '}
                <strong>{summary.averageWaitMinutes} min</strong>, com{' '}
                <strong>{summary.queueWaitingCount}</strong> paciente(s) aguardando atendimento.
              </p>
            </div>
          ) : null}

          {/* Cards de Métricas (KPIs) */}
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Total Agendados</span>
              <span className="stat-card__value">{summary.totalAppointments}</span>
              <span className="stat-card__sub">
                {summary.confirmedCount} confirmados • {summary.scheduledCount} agendados
              </span>
            </div>

            <div className="stat-card stat-card--accent">
              <span className="stat-card__label">Atendidos</span>
              <span className="stat-card__value">{summary.attendedCount}</span>
              <span className="stat-card__sub">
                {summary.attendanceRate}% taxa de comparecimento
              </span>
            </div>

            <div className="stat-card stat-card--neutral">
              <span className="stat-card__label">Faltas & Cancelamentos</span>
              <span className="stat-card__value" style={{ color: summary.noShowCount > 0 ? '#b91c1c' : undefined }}>
                {summary.noShowCount}
              </span>
              <span className="stat-card__sub">
                {summary.cancelledCount} cancelamentos registrados
              </span>
            </div>

            <div className="stat-card stat-card--secondary">
              <span className="stat-card__label">Fila de Espera</span>
              <span className="stat-card__value">{summary.queueWaitingCount}</span>
              <span className="stat-card__sub">
                {summary.queueInServiceCount} em atendimento agora
              </span>
            </div>

            <div className="stat-card stat-card--secondary">
              <span className="stat-card__label">Tempo Médio de Espera</span>
              <span className="stat-card__value">{summary.averageWaitMinutes} <span style={{ fontSize: '1rem', fontWeight: 500 }}>min</span></span>
              <span className="stat-card__sub">
                {summary.queueCompletedCount} chamadas concluídas
              </span>
            </div>

            {paymentSummary && typeof paymentSummary.totalReceived === 'number' ? (
              <div className="stat-card">
                <span className="stat-card__label">Caixa do Balcão</span>
                <span className="stat-card__value">
                  R$ {paymentSummary.totalReceived.toFixed(2).replace('.', ',')}
                </span>
                <span className="stat-card__sub">
                  {paymentSummary.transactionCount ?? 0} pagamento(s)
                  {(paymentSummary.refundCount ?? 0) > 0
                    ? ` • ${paymentSummary.refundCount} estorno(s)`
                    : ''}
                </span>
              </div>
            ) : null}
          </div>

          {/* Grid Principal de Conteúdo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Próximos Atendimentos */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 className="card__title" style={{ margin: 0 }}>Próximos Atendimentos</h2>
                <button
                  type="button"
                  className="button button--link"
                  onClick={() => onNavigate('agenda')}
                >
                  Ver agenda completa →
                </button>
              </div>

              {summary.upcomingAppointments.length === 0 ? (
                <p className="empty">Nenhum agendamento para esta data.</p>
              ) : (
                <ul className="agenda__list">
                  {summary.upcomingAppointments.map((appt) => (
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

            {/* Painel Operacional Lateral */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Desempenho por Profissional */}
              <div className="card">
                <h2 className="card__title" style={{ margin: '0 0 0.75rem' }}>Produção por Profissional</h2>
                {summary.professionals.length === 0 ? (
                  <p className="empty">Nenhum atendimento vinculado para este dia.</p>
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
                        {summary.professionals.map((prof) => (
                          <tr key={prof.professionalId}>
                            <td><strong>{prof.professionalName}</strong></td>
                            <td style={{ textAlign: 'center' }}>{prof.totalAppointments}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: '#008080', fontWeight: 600 }}>{prof.attendedCount}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ color: prof.noShowCount > 0 ? '#dc2626' : undefined }}>{prof.noShowCount}</span>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 className="card__title" style={{ margin: 0 }}>Ocupação das Salas</h2>
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => onNavigate('operation')}
                  >
                    Gerenciar salas →
                  </button>
                </div>

                {summary.rooms.length === 0 ? (
                  <p className="empty">Nenhuma sala com agendamento nesta data.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                    {summary.rooms.map((room) => (
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

                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
          </div>
        </>
      ) : null}
    </div>
  );
}
