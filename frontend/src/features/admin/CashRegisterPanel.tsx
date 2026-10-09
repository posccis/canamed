import { useState, useEffect, useCallback } from 'react';
import {
  type CashSessionDto,
  getActiveCashSession,
  openCashSession,
  registerSangria,
  registerSuprimento,
  closeCashSession,
  listCashSessions,
} from './adminApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';

export function CashRegisterPanel() {
  const { state: authState } = useSession();
  const { showSuccess, showError } = useToast();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';

  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<CashSessionDto | null>(null);
  const [recentSessions, setRecentSessions] = useState<CashSessionDto[]>([]);

  // Open Form
  const [initialFloat, setInitialFloat] = useState('100.00');
  const [opening, setOpening] = useState(false);

  // Movement Form (Sangria / Suprimento)
  const [movementModal, setMovementModal] = useState<'sangria' | 'suprimento' | null>(null);
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Close Form
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [cashDeclared, setCashDeclared] = useState('0.00');
  const [pixDeclared, setPixDeclared] = useState('0.00');
  const [debitDeclared, setDebitDeclared] = useState('0.00');
  const [creditDeclared, setCreditDeclared] = useState('0.00');
  const [closingNotes, setClosingNotes] = useState('');
  const [closing, setClosing] = useState(false);

  // Receipt Modal
  const [closedSummary, setClosedSummary] = useState<CashSessionDto | null>(null);

  const loadData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [session, history] = await Promise.all([
        getActiveCashSession(clinicId),
        listCashSessions(clinicId),
      ]);
      setActiveSession(session);
      setRecentSessions(history);
    } catch {
      showError('Erro ao carregar dados do caixa.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleOpenSession(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId) return;
    setOpening(true);
    try {
      const res = await openCashSession({
        clinicId,
        initialFloat: parseFloat(initialFloat) || 0,
      });
      setActiveSession(res);
      showSuccess('Caixa aberto com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao abrir caixa.';
      showError(msg);
    } finally {
      setOpening(false);
    }
  }

  async function handleMovementSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession || !clinicId || !movementModal) return;
    setSubmittingMovement(true);
    try {
      const amount = parseFloat(movementAmount) || 0;
      let res: CashSessionDto;
      if (movementModal === 'sangria') {
        res = await registerSangria(activeSession.id, clinicId, {
          amount,
          reason: movementReason || 'Sangria de rotina',
        });
        showSuccess('Sangria registrada com sucesso!');
      } else {
        res = await registerSuprimento(activeSession.id, clinicId, {
          amount,
          reason: movementReason || 'Suprimento de troco',
        });
        showSuccess('Suprimento registrado com sucesso!');
      }
      setActiveSession(res);
      setMovementModal(null);
      setMovementAmount('');
      setMovementReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar movimentação.';
      showError(msg);
    } finally {
      setSubmittingMovement(false);
    }
  }

  async function handleCloseSession(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession || !clinicId) return;
    setClosing(true);
    try {
      const res = await closeCashSession(activeSession.id, clinicId, {
        cashDeclared: parseFloat(cashDeclared) || 0,
        pixDeclared: parseFloat(pixDeclared) || 0,
        debitDeclared: parseFloat(debitDeclared) || 0,
        creditDeclared: parseFloat(creditDeclared) || 0,
        notes: closingNotes || undefined,
      });
      setActiveSession(null);
      setClosedSummary(res);
      setCloseModalOpen(false);
      showSuccess('Caixa encerrado com sucesso!');
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao encerrar caixa.';
      showError(msg);
    } finally {
      setClosing(false);
    }
  }

  function formatBrl(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('pt-BR');
  }

  if (loading) {
    return (
      <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Carregando dados do caixa...</p>
      </div>
    );
  }

  return (
    <div className="cash-register-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Frente de Caixa & Conferência</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Controle de turnos, suprimentos, sangrias e conciliação financeira com fechamento cego (SPEC-0019).
          </p>
        </div>
        <div>
          <button type="button" className="button button--secondary" onClick={() => void loadData()}>
            ↻ Atualizar
          </button>
        </div>
      </div>

      {!activeSession ? (
        // Caixa Fechado - Form de Abertura
        <div className="card" style={{ padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🔒
            </div>
            <div>
              <h3 style={{ margin: 0 }}>Nenhum caixa aberto para seu usuário neste turno</h3>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-muted)' }}>
                Informe o fundo de troco inicial para iniciar a recepção e o registro de pagamentos.
              </p>
            </div>
          </div>

          <form onSubmit={handleOpenSession} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="initialFloat" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                Fundo de Troco Inicial (R$) *
              </label>
              <input
                id="initialFloat"
                type="number"
                step="0.01"
                min="0"
                className="input"
                style={{ width: '100%', padding: '0.5rem' }}
                value={initialFloat}
                onChange={(e) => setInitialFloat(e.target.value)}
                required
              />
              <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Valor em cédulas e moedas físicas entregues na gaveta ao abrir o turno.
              </small>
            </div>

            <button type="submit" className="button button--primary" disabled={opening} style={{ alignSelf: 'flex-start' }}>
              {opening ? 'Abrindo caixa...' : '🔓 Abrir Turno de Caixa'}
            </button>
          </form>
        </div>
      ) : (
        // Caixa Aberto - Painel de Operação
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', border: '1px solid #10b981', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ backgroundColor: '#10b981', color: '#fff', padding: '0.25rem 0.65rem', borderRadius: '4px', fontWeight: 600 }}>
                    ● CAIXA ABERTO
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Aberto em {formatDateTime(activeSession.openedAt)}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Operador: {activeSession.operatorName}</h3>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                  Fundo de troco inicial: <strong>{formatBrl(activeSession.initialFloat)}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setMovementModal('suprimento')}
                >
                  ➕ Suprimento (Troco)
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  onClick={() => setMovementModal('sangria')}
                >
                  ➖ Sangria (Retirada)
                </button>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => {
                    setCashDeclared(activeSession.totalCashExpected.toFixed(2));
                    setPixDeclared(activeSession.totalPixExpected.toFixed(2));
                    setDebitDeclared(activeSession.totalDebitExpected.toFixed(2));
                    setCreditDeclared(activeSession.totalCreditExpected.toFixed(2));
                    setCloseModalOpen(true);
                  }}
                >
                  🔒 Encerrar Caixa
                </button>
              </div>
            </div>

            {/* Totais do Caixa */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Dinheiro Esperado</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                  {formatBrl(activeSession.totalCashExpected)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  (Inicial + Entradas - Sangrias)
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>PIX Esperado</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                  {formatBrl(activeSession.totalPixExpected)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Consultas liquidadas por PIX
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Cartão de Débito</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                  {formatBrl(activeSession.totalDebitExpected)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Maquininha TEF / POS
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Cartão de Crédito</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-text)', marginTop: '0.25rem' }}>
                  {formatBrl(activeSession.totalCreditExpected)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  À vista ou parcelado
                </div>
              </div>
            </div>
          </div>

          {/* Movimentações de Sangria / Suprimento da Sessão */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Movimentações do Turno ({activeSession.movements.length})</h3>
            {activeSession.movements.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                Nenhuma sangria ou suprimento registrado nesta sessão.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.5rem' }}>Horário</th>
                      <th style={{ padding: '0.5rem' }}>Tipo</th>
                      <th style={{ padding: '0.5rem' }}>Valor</th>
                      <th style={{ padding: '0.5rem' }}>Motivo / Justificativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSession.movements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.5rem' }}>{formatDateTime(m.createdAt)}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              backgroundColor: m.movementType === 'sangria' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: m.movementType === 'sangria' ? '#ef4444' : '#10b981',
                            }}
                          >
                            {m.movementType.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{formatBrl(m.amount)}</td>
                        <td style={{ padding: '0.5rem' }}>{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico Recente de Fechamentos de Caixa */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Histórico de Turnos e Sessões</h3>
        {recentSessions.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Nenhum histórico disponível para este período.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.5rem' }}>Operador</th>
                  <th style={{ padding: '0.5rem' }}>Abertura</th>
                  <th style={{ padding: '0.5rem' }}>Encerramento</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Fundo Inicial</th>
                  <th style={{ padding: '0.5rem' }}>Dinheiro Decl.</th>
                  <th style={{ padding: '0.5rem' }}>Diferença</th>
                  <th style={{ padding: '0.5rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{s.operatorName}</td>
                    <td style={{ padding: '0.5rem' }}>{formatDateTime(s.openedAt)}</td>
                    <td style={{ padding: '0.5rem' }}>{s.closedAt ? formatDateTime(s.closedAt) : '—'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor: s.status === 'open' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                          color: s.status === 'open' ? '#10b981' : 'var(--color-text-muted)',
                        }}
                      >
                        {s.status === 'open' ? 'ABERTO' : 'FECHADO'}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>{formatBrl(s.initialFloat)}</td>
                    <td style={{ padding: '0.5rem' }}>{formatBrl(s.totalCashDeclared)}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: s.cashDifference < 0 ? '#ef4444' : s.cashDifference > 0 ? '#3b82f6' : '#10b981' }}>
                      {formatBrl(s.cashDifference)}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button
                        type="button"
                        className="button button--ghost"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => setClosedSummary(s)}
                      >
                        Ver Resumo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Sangria / Suprimento */}
      {movementModal ? (
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
            padding: '1.5rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '450px',
            border: '1px solid var(--color-border)',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>
              {movementModal === 'sangria' ? 'Registrar Sangria (Retirada de Caixa)' : 'Registrar Suprimento (Troco Adicional)'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              {movementModal === 'sangria'
                ? 'Retirada de valores em espécie para cofre, depósito ou despesas emergenciais.'
                : 'Adição de moeda física ou cédulas para reforço do fundo de troco da gaveta.'}
            </p>

            <form onSubmit={handleMovementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="movAmount" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Valor em Espécie (R$) *
                </label>
                <input
                  id="movAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="movReason" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Motivo / Justificativa *
                </label>
                <input
                  id="movReason"
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder={movementModal === 'sangria' ? 'Ex: Sangria para cofre administrativo' : 'Ex: Reforço de moedas para troco'}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setMovementModal(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`button ${movementModal === 'sangria' ? 'button--danger' : 'button--primary'}`}
                  disabled={submittingMovement}
                >
                  {submittingMovement ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal de Fechamento de Caixa */}
      {closeModalOpen && activeSession ? (
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
            maxWidth: '520px',
            border: '1px solid var(--color-border)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Encerramento e Conferência de Caixa</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Declare os valores contados fisicamente e nas maquininhas. O sistema calculará divergências de quebra de caixa.
            </p>

            <form onSubmit={handleCloseSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="closeCash" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Dinheiro em Gaveta (R$) *
                  </label>
                  <input
                    id="closeCash"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={cashDeclared}
                    onChange={(e) => setCashDeclared(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Esperado: {formatBrl(activeSession.totalCashExpected)}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="closePix" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    PIX Declarado (R$) *
                  </label>
                  <input
                    id="closePix"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={pixDeclared}
                    onChange={(e) => setPixDeclared(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Esperado: {formatBrl(activeSession.totalPixExpected)}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="closeDebit" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Débito Maquininha (R$) *
                  </label>
                  <input
                    id="closeDebit"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={debitDeclared}
                    onChange={(e) => setDebitDeclared(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Esperado: {formatBrl(activeSession.totalDebitExpected)}
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="closeCredit" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Crédito Maquininha (R$) *
                  </label>
                  <input
                    id="closeCredit"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={creditDeclared}
                    onChange={(e) => setCreditDeclared(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Esperado: {formatBrl(activeSession.totalCreditExpected)}
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="closeNotes" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Observações / Justificativa de Divergência
                </label>
                <textarea
                  id="closeNotes"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem', minHeight: '60px' }}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Se houver diferença entre o físico e o sistema, relate o motivo aqui..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setCloseModalOpen(false)}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={closing}
                >
                  {closing ? 'Fechando Caixa...' : 'Concluir Encerramento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Recibo / Resumo de Caixa Fechado */}
      {closedSummary ? (
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
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem' }}>🧾</div>
              <h3 style={{ margin: '0.5rem 0 0.25rem 0' }}>Conferência de Caixa — Turno Finalizado</h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Operador: {closedSummary.operatorName} • {closedSummary.closedAt ? formatDateTime(closedSummary.closedAt) : ''}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Fundo Inicial:</span>
                <strong>{formatBrl(closedSummary.initialFloat)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Dinheiro Esperado / Declarado:</span>
                <strong>{formatBrl(closedSummary.totalCashExpected)} / {formatBrl(closedSummary.totalCashDeclared)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>PIX Esperado / Declarado:</span>
                <strong>{formatBrl(closedSummary.totalPixExpected)} / {formatBrl(closedSummary.totalPixDeclared)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Débito Esperado / Declarado:</span>
                <strong>{formatBrl(closedSummary.totalDebitExpected)} / {formatBrl(closedSummary.totalDebitDeclared)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Crédito Esperado / Declarado:</span>
                <strong>{formatBrl(closedSummary.totalCreditExpected)} / {formatBrl(closedSummary.totalCreditDeclared)}</strong>
              </div>
              <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700 }}>
                <span>Diferença de Caixa:</span>
                <span style={{ color: closedSummary.cashDifference < 0 ? '#ef4444' : closedSummary.cashDifference > 0 ? '#3b82f6' : '#10b981' }}>
                  {formatBrl(closedSummary.cashDifference)} {closedSummary.cashDifference === 0 ? '(Exato)' : closedSummary.cashDifference < 0 ? '(Falta)' : '(Sobra)'}
                </span>
              </div>
            </div>

            {closedSummary.closingNotes ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                Nota do operador: &quot;{closedSummary.closingNotes}&quot;
              </p>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button button--primary"
                onClick={() => setClosedSummary(null)}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
