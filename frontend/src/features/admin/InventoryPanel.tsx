import { useState, useEffect, useCallback } from 'react';
import {
  type InventoryItemDto,
  type InventoryAlertsDto,
  listInventoryItems,
  createInventoryItem,
  registerInventoryEntry,
  registerInventoryExit,
  getInventoryAlerts,
} from './adminApi';
import { useSession } from '../auth/useSession';
import { useToast } from '../layout/Toast';

export function InventoryPanel() {
  const { state: authState } = useSession();
  const { showSuccess, showError } = useToast();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlertsDto | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [movementModal, setMovementModal] = useState<{ item: InventoryItemDto; type: 'entry' | 'exit' } | null>(null);

  // Form Novo Item
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Materiais Descartáveis');
  const [unit, setUnit] = useState('unidade');
  const [initialQuantity, setInitialQuantity] = useState('10');
  const [minimumQuantity, setMinimumQuantity] = useState('5');
  const [lotNumber, setLotNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Form Movimentação
  const [movQty, setMovQty] = useState('');
  const [movUnitPrice, setMovUnitPrice] = useState('');
  const [movReason, setMovReason] = useState('');
  const [savingMov, setSavingMov] = useState(false);

  const loadData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const [itemList, alertData] = await Promise.all([
        listInventoryItems(clinicId, categoryFilter || undefined, search || undefined),
        getInventoryAlerts(clinicId),
      ]);
      setItems(itemList);
      setAlerts(alertData);
    } catch {
      showError('Falha ao carregar estoque e insumos.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, categoryFilter, search, showError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId) return;
    setSavingItem(true);
    try {
      await createInventoryItem({
        clinicId,
        name,
        category,
        unit,
        initialQuantity: parseFloat(initialQuantity) || 0,
        minimumQuantity: parseFloat(minimumQuantity) || 0,
        lotNumber: lotNumber || undefined,
        expirationDate: expirationDate ? new Date(`${expirationDate}T00:00:00Z`).toISOString() : undefined,
      });
      setCreateModalOpen(false);
      setName('');
      setLotNumber('');
      setExpirationDate('');
      showSuccess('Insumo cadastrado com sucesso!');
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar insumo.';
      showError(msg);
    } finally {
      setSavingItem(false);
    }
  }

  async function handleMovementSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clinicId || !movementModal) return;
    setSavingMov(true);
    try {
      const qty = parseFloat(movQty) || 0;
      if (movementModal.type === 'entry') {
        await registerInventoryEntry(movementModal.item.id, clinicId, {
          quantity: qty,
          unitPrice: movUnitPrice ? parseFloat(movUnitPrice) : undefined,
          reason: movReason || 'Entrada / Compra de insumos',
        });
        showSuccess(`Entrada de ${qty} ${movementModal.item.unit} registrada!`);
      } else {
        await registerInventoryExit(movementModal.item.id, clinicId, {
          quantity: qty,
          reason: movReason || 'Consumo em atendimento clínico',
        });
        showSuccess(`Saída de ${qty} ${movementModal.item.unit} registrada!`);
      }
      setMovementModal(null);
      setMovQty('');
      setMovUnitPrice('');
      setMovReason('');
      void loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na movimentação de estoque.';
      showError(msg);
    } finally {
      setSavingMov(false);
    }
  }

  function formatDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  return (
    <div className="inventory-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Gestão de Insumos & Materiais Médicos</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Controle de estoque, rastreabilidade de lotes e alertas de validade conforme normas ANVISA (SPEC-0022).
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={() => setCreateModalOpen(true)}
        >
          ➕ Novo Insumo / Material
        </button>
      </div>

      {/* Cards de Alertas ANVISA / Reposição */}
      {alerts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{
            background: 'var(--color-surface)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: `1px solid ${alerts.belowMinimum.length > 0 ? '#ef4444' : 'var(--color-border)'}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Abaixo do Mínimo
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: alerts.belowMinimum.length > 0 ? '#ef4444' : '#10b981', marginTop: '0.25rem' }}>
              {alerts.belowMinimum.length} itens
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Necessitam de pedido de compra urgente
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: `1px solid ${alerts.expiringSoon.length > 0 ? '#f59e0b' : 'var(--color-border)'}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Validade Próxima (&lt;30 dias)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: alerts.expiringSoon.length > 0 ? '#f59e0b' : '#10b981', marginTop: '0.25rem' }}>
              {alerts.expiringSoon.length} lotes
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Priorizar uso antes do vencimento
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: `1px solid ${alerts.expired.length > 0 ? '#dc2626' : 'var(--color-border)'}`,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Itens Vencidos (Descarte)
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: alerts.expired.length > 0 ? '#dc2626' : '#10b981', marginTop: '0.25rem' }}>
              {alerts.expired.length} itens
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              Segregar imediatamente para descarte
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Insumos */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="🔍 Buscar por nome do insumo..."
              style={{ width: '260px', padding: '0.45rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="input"
              style={{ padding: '0.45rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              <option value="Medicamentos">Medicamentos</option>
              <option value="Materiais Descartáveis">Materiais Descartáveis</option>
              <option value="EPIs & Higiene">EPIs & Higiene</option>
              <option value="Injetáveis & Curativos">Injetáveis & Curativos</option>
              <option value="Equipamentos e Acessórios">Equipamentos e Acessórios</option>
            </select>
          </div>

          <button type="button" className="button button--secondary" onClick={() => void loadData()}>
            ↻ Atualizar
          </button>
        </div>

        {loading ? (
          <p>Carregando inventário...</p>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontStyle: 'italic' }}>
            Nenhum insumo encontrado no catálogo da clínica.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.5rem' }}>Insumo</th>
                  <th style={{ padding: '0.5rem' }}>Categoria</th>
                  <th style={{ padding: '0.5rem' }}>Qtd Atual</th>
                  <th style={{ padding: '0.5rem' }}>Qtd Mínima</th>
                  <th style={{ padding: '0.5rem' }}>Lote</th>
                  <th style={{ padding: '0.5rem' }}>Validade</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{it.name}</td>
                    <td style={{ padding: '0.5rem' }}>{it.category}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 700, color: it.isBelowMinimum ? '#ef4444' : 'inherit' }}>
                      {it.currentQuantity} {it.unit}
                    </td>
                    <td style={{ padding: '0.5rem', color: 'var(--color-text-muted)' }}>
                      {it.minimumQuantity} {it.unit}
                    </td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{it.lotNumber || '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{formatDate(it.expirationDate)}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {it.isExpired ? (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#dc2626', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                          VENCIDO
                        </span>
                      ) : it.isExpiringSoon ? (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#f59e0b', color: '#000', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                          VALIDADE PRÓXIMA
                        </span>
                      ) : it.isBelowMinimum ? (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#ef4444', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                          ESTOQUE BAIXO
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#10b981', color: '#fff', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          REGULAR
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="button button--secondary"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.8rem' }}
                          onClick={() => setMovementModal({ item: it, type: 'entry' })}
                        >
                          ➕ Entrada
                        </button>
                        <button
                          type="button"
                          className="button button--secondary"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.8rem', color: '#ef4444' }}
                          onClick={() => setMovementModal({ item: it, type: 'exit' })}
                        >
                          ➖ Baixa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar Insumo */}
      {createModalOpen ? (
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
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Cadastrar Insumo / Material Médico</h3>
            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="createItemName" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Nome do Item *
                </label>
                <input
                  id="createItemName"
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Luva de Procedimento Látex P (Caixa c/ 100)"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="createItemCategory" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Categoria *
                  </label>
                  <select
                    id="createItemCategory"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Materiais Descartáveis">Materiais Descartáveis</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="EPIs & Higiene">EPIs & Higiene</option>
                    <option value="Injetáveis & Curativos">Injetáveis & Curativos</option>
                    <option value="Equipamentos e Acessórios">Equipamentos e Acessórios</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="createItemUnit" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Unidade de Medida *
                  </label>
                  <input
                    id="createItemUnit"
                    type="text"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Ex: caixa, frasco, pacote, un"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="createItemInitialQty" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Qtd Inicial em Estoque *
                  </label>
                  <input
                    id="createItemInitialQty"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="createItemMinQty" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Estoque Mínimo de Alerta *
                  </label>
                  <input
                    id="createItemMinQty"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={minimumQuantity}
                    onChange={(e) => setMinimumQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="createItemLot" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Número do Lote (ANVISA)
                  </label>
                  <input
                    id="createItemLot"
                    type="text"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="Ex: LOTE-2026-X1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="createItemExpDate" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Data de Validade
                  </label>
                  <input
                    id="createItemExpDate"
                    type="date"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={savingItem}
                >
                  {savingItem ? 'Salvando...' : 'Salvar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modal Entrada ou Saída de Estoque */}
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
            <h3 style={{ margin: '0 0 0.5rem 0' }}>
              {movementModal.type === 'entry' ? 'Registrar Entrada de Estoque' : 'Registrar Saída / Baixa de Estoque'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Item: <strong>{movementModal.item.name}</strong> (Estoque atual: {movementModal.item.currentQuantity} {movementModal.item.unit})
            </p>

            <form onSubmit={handleMovementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="modalMovQty" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Quantidade ({movementModal.item.unit}) *
                </label>
                <input
                  id="modalMovQty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  required
                />
              </div>

              {movementModal.type === 'entry' ? (
                <div className="form-group">
                  <label htmlFor="modalMovUnitPrice" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Custo Unitário (R$)
                  </label>
                  <input
                    id="modalMovUnitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={movUnitPrice}
                    onChange={(e) => setMovUnitPrice(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              ) : null}

              <div className="form-group">
                <label htmlFor="modalMovReason" style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Motivo / Justificativa *
                </label>
                <input
                  id="modalMovReason"
                  type="text"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder={movementModal.type === 'entry' ? 'Ex: Nota fiscal NF-1092 / Fornecedor Cirúrgica' : 'Ex: Consumo em procedimentos ambulatoriais'}
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
                  className={`button ${movementModal.type === 'entry' ? 'button--primary' : 'button--danger'}`}
                  disabled={savingMov}
                >
                  {savingMov ? 'Registrando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
