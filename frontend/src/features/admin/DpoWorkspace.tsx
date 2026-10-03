import { useState, useEffect, useCallback } from 'react';
import {
  type DpoOverviewDto,
  type DpoRequestItemDto,
  getDpoOverview,
  processDpoRequest,
} from './adminApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';

export function DpoWorkspace() {
  const { state: authState } = useSession();
  const { showSuccess, showError } = useToast();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DpoOverviewDto | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'ropa'>('requests');

  // Modal de Decisão do DPO
  const [selectedRequest, setSelectedRequest] = useState<DpoRequestItemDto | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'completed' | 'rejected'>('completed');
  const [responseNotes, setResponseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const data = await getDpoOverview(clinicId);
      setOverview(data);
    } catch {
      showError('Falha ao carregar painel do DPO e governança LGPD.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleProcessSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !selectedRequest) return;
    setSubmitting(true);
    try {
      await processDpoRequest(
        selectedRequest.id,
        clinicId,
        decisionStatus,
        responseNotes
      );
      showSuccess(`Solicitação ${selectedRequest.protocol} processada pelo DPO!`);
      setSelectedRequest(null);
      setResponseNotes('');
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar solicitação.';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  function getUrgencyBadge(req: DpoRequestItemDto) {
    if (req.status !== 'pending') {
      return (
        <span style={{ fontSize: '0.75rem', backgroundColor: req.status === 'completed' ? '#10b981' : '#6b7280', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
          {req.status === 'completed' ? 'ATENDIDO' : 'INDEFERIDO'}
        </span>
      );
    }

    switch (req.urgencyLevel) {
      case 'overdue':
        return (
          <span style={{ fontSize: '0.75rem', backgroundColor: '#dc2626', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
            ATRASADO ({Math.abs(req.remainingDays)}d)
          </span>
        );
      case 'critical':
        return (
          <span style={{ fontSize: '0.75rem', backgroundColor: '#ef4444', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
            CRÍTICO ({req.remainingDays}d)
          </span>
        );
      case 'warning':
        return (
          <span style={{ fontSize: '0.75rem', backgroundColor: '#f59e0b', color: '#000', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
            ALERTA ({req.remainingDays}d)
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.75rem', backgroundColor: '#3b82f6', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
            NORMAL ({req.remainingDays}d)
          </span>
        );
    }
  }

  return (
    <div className="dpo-workspace" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Painel do DPO & Governança LGPD</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Atendimento de direitos dos titulares (Art. 18), controle de SLA legal (15 dias) e ROPA (Art. 37) (SPEC-0023).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--color-surface)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            className={`button ${activeTab === 'requests' ? 'button--primary' : 'button--ghost'}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('requests')}
          >
            📋 Pedidos de Titulares
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'ropa' ? 'button--primary' : 'button--ghost'}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('ropa')}
          >
            🛡️ Inventário ROPA (Art. 37)
          </button>
        </div>
      </div>

      {/* Cards de Métricas LGPD */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Solicitações Pendentes
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
              {overview.totalPendingRequests}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Requerimentos aguardando análise do DPO
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: `1px solid ${overview.overdueRequests > 0 ? '#ef4444' : 'var(--color-border)'}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              SLA Vencido (&gt;15 dias)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: overview.overdueRequests > 0 ? '#ef4444' : '#10b981', marginTop: '0.25rem' }}>
              {overview.overdueRequests}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Infração passível de sanção ANPD
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Operações no ROPA
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
              {overview.ropaActivities.length} fluxos
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Mapeamento de bases legais e retenção
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' ? (
        /* Tabela de Solicitações */
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Requerimentos de Titulares de Dados ({overview?.requests.length ?? 0})</h3>
            <button type="button" className="button button--secondary" onClick={() => void loadData()}>
              ↻ Atualizar
            </button>
          </div>

          {loading ? (
            <p>Carregando solicitações...</p>
          ) : overview?.requests.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
              Nenhuma solicitação de titular registrada para esta clínica.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '0.5rem' }}>Protocolo</th>
                    <th style={{ padding: '0.5rem' }}>Tipo de Pedido</th>
                    <th style={{ padding: '0.5rem' }}>Abertura</th>
                    <th style={{ padding: '0.5rem' }}>Prazo Limite</th>
                    <th style={{ padding: '0.5rem' }}>SLA / Urgência</th>
                    <th style={{ padding: '0.5rem' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.requests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 600 }}>{r.protocol}</td>
                      <td style={{ padding: '0.5rem' }}>{r.requestType}</td>
                      <td style={{ padding: '0.5rem' }}>{formatDate(r.createdAt)}</td>
                      <td style={{ padding: '0.5rem' }}>{formatDate(r.dueDate)}</td>
                      <td style={{ padding: '0.5rem' }}>{getUrgencyBadge(r)}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <button
                          type="button"
                          className="button button--secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setSelectedRequest(r);
                            setDecisionStatus(r.status === 'rejected' ? 'rejected' : 'completed');
                            setResponseNotes(r.responseNotes || '');
                          }}
                        >
                          {r.status === 'pending' ? '⚖️ Analisar / Parecer' : '👁️ Ver Parecer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Tabela ROPA */
        <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
            ROPA — Registro de Operações de Tratamento (Art. 37 LGPD)
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Inventário contínuo de fluxos de tratamento de dados pessoais comuns e sensíveis na clínica.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.5rem' }}>Processo</th>
                  <th style={{ padding: '0.5rem' }}>Finalidade</th>
                  <th style={{ padding: '0.5rem' }}>Base Legal (LGPD)</th>
                  <th style={{ padding: '0.5rem' }}>Categorias de Dados</th>
                  <th style={{ padding: '0.5rem' }}>Prazo de Guarda</th>
                  <th style={{ padding: '0.5rem' }}>Medidas de Segurança</th>
                </tr>
              </thead>
              <tbody>
                {overview?.ropaActivities.map((act, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{act.processName}</td>
                    <td style={{ padding: '0.5rem' }}>{act.purpose}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {act.legalBasis}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>{act.dataCategories}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{act.retentionPeriod}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>{act.securityMeasures}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Parecer do DPO */}
      {selectedRequest ? (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="modal-dialog" style={{
            background: 'var(--color-surface)',
            padding: '1.75rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid var(--color-border)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Parecer Jurídico do DPO — {selectedRequest.protocol}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Pedido: <strong>{selectedRequest.requestType}</strong> • Prazo legal de 15 dias: {formatDate(selectedRequest.dueDate)}
            </p>

            {selectedRequest.details && (
              <div style={{ background: 'var(--color-bg)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Detalhes informados pelo titular:</strong>
                {selectedRequest.details}
              </div>
            )}

            <form onSubmit={handleProcessSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="dpoDecisionSelect" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Decisão do Encarregado (DPO) *
                </label>
                <select
                  id="dpoDecisionSelect"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={decisionStatus}
                  onChange={(e) => setDecisionStatus(e.target.value as 'completed' | 'rejected')}
                >
                  <option value="completed">Deferir / Atender Solicitação</option>
                  <option value="rejected">Indeferir Fundamentadamente (Art. 16 LGPD / Lei 13.787/2018)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dpoNotesInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Fundamentação Legal e Parecer Conclusivo *
                </label>
                <textarea
                  id="dpoNotesInput"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem', minHeight: '100px' }}
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Ex: Pedido atendido com fornecimento integral do relatório de dados ou indeferido devido à obrigação legal de retenção de prontuário por 20 anos (Lei 13.787/2018)."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setSelectedRequest(null)}
                >
                  Fechar
                </button>
                {selectedRequest.status === 'pending' && (
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Registrando...' : 'Emitir Parecer & Notificar Titular'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
