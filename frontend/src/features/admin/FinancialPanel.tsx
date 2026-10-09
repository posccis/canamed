import { useState, useEffect, useCallback } from 'react';
import {
  type PayoutBatchDto,
  type PayoutContractDto,
  type FinancialSummaryDto,
  listPayoutBatches,
  getPayoutContract,
  upsertPayoutContract,
  generatePayoutBatch,
  settlePayoutBatch,
  createFinancialTransaction,
  getFinancialSummary,
} from './adminApi';
import { fetchUsers, type ManagedUser } from '../auth/authApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';

export function FinancialPanel() {
  const { state: authState } = useSession();
  const { showSuccess, showError } = useToast();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';

  const [activeTab, setActiveTab] = useState<'payouts' | 'dre'>('payouts');
  const [loading, setLoading] = useState(true);

  // Médicos disponíveis
  const [professionals, setProfessionals] = useState<ManagedUser[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Repasses
  const [contract, setContract] = useState<PayoutContractDto | null>(null);
  const [batches, setBatches] = useState<PayoutBatchDto[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<PayoutBatchDto | null>(null);

  // Form Contrato
  const [payoutType, setPayoutType] = useState<'percentage' | 'fixed'>('percentage');
  const [contractValue, setContractValue] = useState('70.00');
  const [savingContract, setSavingContract] = useState(false);

  // Form Geração de Lote
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Form Quitação de Lote
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [receiptRef, setReceiptRef] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  // DRE & Lançamentos
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'receita' | 'despesa'>('despesa');
  const [txCategory, setTxCategory] = useState('Aluguel e Condomínio');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDueDate, setTxDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState<'pendente' | 'pago'>('pago');
  const [savingTx, setSavingTx] = useState(false);

  // Período DRE
  const [dreFrom, setDreFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dreTo, setDreTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Carregar médicos
  useEffect(() => {
    async function loadPros() {
      try {
        const users = await fetchUsers();
        const docs = users.filter((u) => u.role === 'profissional' && u.isActive);
        setProfessionals(docs);
        if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0].id);
        }
      } catch {
        // Ignora erro de fetch users
      }
    }
    void loadPros();
  }, [selectedDoctorId]);

  // Carregar dados de repasse para o médico selecionado
  const loadDoctorPayouts = useCallback(async (docId: string) => {
    if (!clinicId || !docId) return;
    setLoading(true);
    try {
      const [c, b] = await Promise.all([
        getPayoutContract(clinicId, docId),
        listPayoutBatches(clinicId, docId),
      ]);
      setContract(c);
      if (c) {
        setPayoutType(c.payoutType);
        setContractValue(c.value.toString());
      } else {
        setPayoutType('percentage');
        setContractValue('70.00');
      }
      setBatches(b);
    } catch {
      showError('Falha ao carregar contratos e repasses do profissional.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, showError]);

  // Carregar DRE
  const loadDre = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const s = await getFinancialSummary(clinicId, new Date(`${dreFrom}T00:00:00Z`).toISOString(), new Date(`${dreTo}T23:59:59Z`).toISOString());
      setSummary(s);
    } catch {
      showError('Falha ao obter demonstrativo financeiro.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, dreFrom, dreTo, showError]);

  useEffect(() => {
    if (activeTab === 'payouts' && selectedDoctorId) {
      void loadDoctorPayouts(selectedDoctorId);
    } else if (activeTab === 'dre') {
      void loadDre();
    }
  }, [activeTab, selectedDoctorId, loadDoctorPayouts, loadDre]);

  async function handleSaveContract(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !selectedDoctorId) return;
    setSavingContract(true);
    try {
      const updated = await upsertPayoutContract({
        clinicId,
        professionalId: selectedDoctorId,
        payoutType,
        value: parseFloat(contractValue) || 0,
      });
      setContract(updated);
      showSuccess('Regra de repasse salva com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar contrato.';
      showError(msg);
    } finally {
      setSavingContract(false);
    }
  }

  async function handleGenerateBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !selectedDoctorId) return;
    setGeneratingBatch(true);
    try {
      const batch = await generatePayoutBatch({
        clinicId,
        professionalId: selectedDoctorId,
        periodStart: new Date(`${periodStart}T00:00:00Z`).toISOString(),
        periodEnd: new Date(`${periodEnd}T23:59:59Z`).toISOString(),
      });
      setBatches((prev) => [batch, ...prev]);
      setSelectedBatch(batch);
      setGenerateModalOpen(false);
      showSuccess('Lote de repasse gerado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar lote.';
      showError(msg);
    } finally {
      setGeneratingBatch(false);
    }
  }

  async function handleSettleBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !selectedBatch) return;
    setSettling(true);
    try {
      const settled = await settlePayoutBatch(selectedBatch.id, clinicId, {
        receiptReference: receiptRef || undefined,
        notes: settleNotes || undefined,
      });
      setBatches((prev) => prev.map((b) => (b.id === settled.id ? settled : b)));
      setSelectedBatch(settled);
      setSettleModalOpen(false);
      showSuccess('Lote de repasse quitado com sucesso!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao quitar lote.';
      showError(msg);
    } finally {
      setSettling(false);
    }
  }

  async function handleCreateTx(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId) return;
    setSavingTx(true);
    try {
      await createFinancialTransaction({
        clinicId,
        type: txType,
        category: txCategory,
        description: txDescription,
        amount: parseFloat(txAmount) || 0,
        dueDate: new Date(`${txDueDate}T12:00:00Z`).toISOString(),
        competenceDate: new Date(`${txDueDate}T12:00:00Z`).toISOString(),
        status: txStatus,
      });
      setTxModalOpen(false);
      setTxDescription('');
      setTxAmount('');
      showSuccess('Lançamento financeiro registrado!');
      void loadDre();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar lançamento.';
      showError(msg);
    } finally {
      setSavingTx(false);
    }
  }

  function formatBrl(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  return (
    <div className="financial-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Gestão Financeira & Repasses Médicos</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Contratos de comissão médica, fechamento de produção e demonstrativo de resultado (SPEC-0021).
          </p>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--color-surface)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            className={`button ${activeTab === 'payouts' ? 'button--primary' : 'button--ghost'}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('payouts')}
          >
            👨‍⚕️ Repasses Médicos
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'dre' ? 'button--primary' : 'button--ghost'}`}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
            onClick={() => setActiveTab('dre')}
          >
            📊 DRE & Despesas
          </button>
        </div>
      </div>

      {activeTab === 'payouts' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Seletor de Médico & Configuração de Contrato */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label htmlFor="doctorSelect" style={{ fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Selecionar Profissional de Saúde
                </label>
                <select
                  id="doctorSelect"
                  className="input"
                  style={{ minWidth: '260px', padding: '0.45rem' }}
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  {professionals.length === 0 ? (
                    <option value="">Nenhum médico cadastrado</option>
                  ) : (
                    professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setGenerateModalOpen(true)}
                  disabled={!selectedDoctorId}
                >
                  ⚡ Fechar Novo Lote de Repasse
                </button>
              </div>
            </div>

            {/* Regra de Repasse Vigente */}
            <form onSubmit={handleSaveContract} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px' }}>
              <div>
                <label htmlFor="payoutTypeSelect" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  Modelo de Repasse
                </label>
                <select
                  id="payoutTypeSelect"
                  className="input"
                  style={{ padding: '0.4rem' }}
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as 'percentage' | 'fixed')}
                >
                  <option value="percentage">Percentual sobre Faturamento Bruto (%)</option>
                  <option value="fixed">Valor Fixo por Consulta Realizada (R$)</option>
                </select>
              </div>

              <div>
                <label htmlFor="contractValueInput" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                  {payoutType === 'percentage' ? 'Percentual do Médico (%)' : 'Valor por Atendimento (R$)'}
                </label>
                <input
                  id="contractValueInput"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  style={{ width: '130px', padding: '0.4rem' }}
                  value={contractValue}
                  onChange={(e) => setContractValue(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="button button--secondary" disabled={savingContract || !selectedDoctorId}>
                {savingContract ? 'Salvando...' : 'Salvar Regra'}
              </button>
              {contract && (
                <span style={{ fontSize: '0.8rem', color: '#10b981', alignSelf: 'center', marginLeft: '0.5rem' }}>
                  ✓ Contrato vigente ({contract.payoutType === 'percentage' ? `${contract.value}%` : `R$ ${contract.value}`})
                </span>
              )}
            </form>
          </div>

          {/* Histórico de Lotes do Médico */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Lotes de Repasse Gerados ({batches.length})</h3>
            {loading ? (
              <p>Carregando repasses...</p>
            ) : batches.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                Nenhum lote de repasse fechado para este profissional até o momento.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.5rem' }}>Período</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                      <th style={{ padding: '0.5rem' }}>Faturamento Bruto</th>
                      <th style={{ padding: '0.5rem' }}>Retenção Clínica</th>
                      <th style={{ padding: '0.5rem' }}>Líquido Médico</th>
                      <th style={{ padding: '0.5rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.5rem' }}>
                          {formatDate(b.periodStart)} até {formatDate(b.periodEnd)}
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor: b.status === 'settled' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: b.status === 'settled' ? '#10b981' : '#f59e0b',
                            }}
                          >
                            {b.status === 'settled' ? 'QUITADO' : 'RASCUNHO'}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>{formatBrl(b.totalGross)}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>{formatBrl(b.totalClinicRetained)}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 700, color: '#3b82f6' }}>{formatBrl(b.totalPayoutAmount)}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <button
                            type="button"
                            className="button button--ghost"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => setSelectedBatch(b)}
                          >
                            Extrato Detalhado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Aba DRE & Lançamentos */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filtros e Nova Despesa */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div>
                  <label htmlFor="dreFromInput" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    De
                  </label>
                  <input
                    id="dreFromInput"
                    type="date"
                    className="input"
                    value={dreFrom}
                    onChange={(e) => setDreFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="dreToInput" style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                    Até
                  </label>
                  <input
                    id="dreToInput"
                    type="date"
                    className="input"
                    value={dreTo}
                    onChange={(e) => setDreTo(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="button button--secondary"
                  style={{ alignSelf: 'flex-end' }}
                  onClick={() => void loadDre()}
                >
                  Filtrar DRE
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => setTxModalOpen(true)}
                >
                  ➕ Novo Lançamento Financeiro
                </button>
              </div>
            </div>
          </div>

          {/* DRE Simplificado */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Faturamento Bruto (+)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>
                  {formatBrl(summary.totalRevenue)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Receitas operacionais do período
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Despesas Operacionais (-)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>
                  {formatBrl(summary.totalExpenses)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Aluguel, folha, contas e insumos
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Repasses Médicos (-)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.25rem' }}>
                  {formatBrl(summary.totalMedicalPayouts)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Comissões médicas liquidadas
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Resultado Líquido (=)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: summary.netResult >= 0 ? '#10b981' : '#ef4444', marginTop: '0.25rem' }}>
                  {formatBrl(summary.netResult)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  Margem de lucro da clínica
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Lançamentos */}
          <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
              Lançamentos Financeiros do Período ({summary?.transactions.length ?? 0})
            </h3>
            {summary?.transactions.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
                Nenhum lançamento no intervalo selecionado.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '0.5rem' }}>Data</th>
                      <th style={{ padding: '0.5rem' }}>Tipo</th>
                      <th style={{ padding: '0.5rem' }}>Categoria</th>
                      <th style={{ padding: '0.5rem' }}>Descrição</th>
                      <th style={{ padding: '0.5rem' }}>Valor</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}>
                        <td style={{ padding: '0.5rem' }}>{formatDate(tx.dueDate)}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor: tx.type === 'receita' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: tx.type === 'receita' ? '#10b981' : '#ef4444',
                            }}
                          >
                            {tx.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>{tx.category}</td>
                        <td style={{ padding: '0.5rem' }}>{tx.description}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 700, color: tx.type === 'receita' ? '#10b981' : '#ef4444' }}>
                          {formatBrl(tx.amount)}
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor: tx.status === 'pago' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: tx.status === 'pago' ? '#10b981' : '#f59e0b',
                            }}
                          >
                            {tx.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detalhe do Lote de Repasse */}
      {selectedBatch ? (
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
            maxWidth: '650px',
            border: '1px solid var(--color-border)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Extrato de Produção Médica</h3>
                <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  Período: {formatDate(selectedBatch.periodStart)} a {formatDate(selectedBatch.periodEnd)} • Status: {selectedBatch.status.toUpperCase()}
                </p>
              </div>
              <div>
                {selectedBatch.status === 'draft' ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => setSettleModalOpen(true)}
                  >
                    💳 Quitar e Liquidar Lote
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                    ✓ Quitado em {formatDate(selectedBatch.settledAt!)}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Produção Bruta</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatBrl(selectedBatch.totalGross)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Taxa Clínica</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{formatBrl(selectedBatch.totalClinicRetained)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Líquido Médico</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#3b82f6' }}>{formatBrl(selectedBatch.totalPayoutAmount)}</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Itens de Produção ({selectedBatch.items.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.4rem' }}>Data</th>
                    <th style={{ padding: '0.4rem' }}>Paciente</th>
                    <th style={{ padding: '0.4rem' }}>Bruto</th>
                    <th style={{ padding: '0.4rem' }}>Repasse</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBatch.items.map((it) => (
                    <tr key={it.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '0.4rem' }}>{formatDate(it.consultationDate)}</td>
                      <td style={{ padding: '0.4rem', fontWeight: 600 }}>{it.patientName}</td>
                      <td style={{ padding: '0.4rem' }}>{formatBrl(it.grossAmount)}</td>
                      <td style={{ padding: '0.4rem', fontWeight: 700, color: '#3b82f6' }}>{formatBrl(it.payoutAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setSelectedBatch(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Gerar Lote */}
      {generateModalOpen ? (
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
            <h3 style={{ margin: '0 0 1rem 0' }}>Gerar Lote de Repasse</h3>
            <form onSubmit={handleGenerateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="periodStartInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Data Inicial *
                </label>
                <input
                  id="periodStartInput"
                  type="date"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="periodEndInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Data Final *
                </label>
                <input
                  id="periodEndInput"
                  type="date"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setGenerateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={generatingBatch}
                >
                  {generatingBatch ? 'Calculando Produção...' : 'Gerar Fechamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Quitar Lote */}
      {settleModalOpen && selectedBatch ? (
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
          zIndex: 1001,
        }}>
          <div className="modal-dialog" style={{
            background: 'var(--color-surface)',
            padding: '1.5rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '450px',
            border: '1px solid var(--color-border)',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Liquidar / Quitar Repasse</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Valor a pagar: <strong>{formatBrl(selectedBatch.totalPayoutAmount)}</strong>
            </p>

            <form onSubmit={handleSettleBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="receiptRefInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Comprovante / Referência PIX ou TED
                </label>
                <input
                  id="receiptRefInput"
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  placeholder="Ex: E2E123456789PIX"
                />
              </div>

              <div className="form-group">
                <label htmlFor="settleNotesInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Observações
                </label>
                <input
                  id="settleNotesInput"
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Ex: Transferido via chave PIX CNPJ do médico"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setSettleModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={settling}
                >
                  {settling ? 'Confirmando...' : 'Confirmar Quitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Novo Lançamento Financeiro */}
      {txModalOpen ? (
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
            maxWidth: '480px',
            border: '1px solid var(--color-border)',
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Novo Lançamento Financeiro</h3>
            <form onSubmit={handleCreateTx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="txTypeSelect" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Tipo *
                  </label>
                  <select
                    id="txTypeSelect"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as 'receita' | 'despesa')}
                  >
                    <option value="despesa">Despesa (Saída)</option>
                    <option value="receita">Receita (Entrada)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="txCategorySelect" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Categoria *
                  </label>
                  <select
                    id="txCategorySelect"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                  >
                    <option value="Aluguel e Condomínio">Aluguel e Condomínio</option>
                    <option value="Energia, Água e Internet">Energia, Água e Internet</option>
                    <option value="Insumos e Materiais Médicos">Insumos e Materiais Médicos</option>
                    <option value="Folha de Pagamento">Folha de Pagamento</option>
                    <option value="Softwares e Telefonia">Softwares e Telefonia</option>
                    <option value="Serviços Médicos Prestados">Serviços Médicos Prestados</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="txDescInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Descrição / Fornecedor *
                </label>
                <input
                  id="txDescInput"
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ex: Conta de energia Enel referência 09/2026"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="txAmountInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Valor (R$) *
                  </label>
                  <input
                    id="txAmountInput"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="txDueDateInput" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Data de Vencimento *
                  </label>
                  <input
                    id="txDueDateInput"
                    type="date"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={txDueDate}
                    onChange={(e) => setTxDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="txStatusSelect" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Status de Pagamento
                </label>
                <select
                  id="txStatusSelect"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={txStatus}
                  onChange={(e) => setTxStatus(e.target.value as 'pendente' | 'pago')}
                >
                  <option value="pago">Liquidado / Pago</option>
                  <option value="pendente">A Pagar (Previsão)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setTxModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={savingTx}
                >
                  {savingTx ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
