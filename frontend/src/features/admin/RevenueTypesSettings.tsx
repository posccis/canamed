import { useState, useEffect, useCallback } from 'react';
import {
  listRevenueTypes,
  createRevenueType,
  updateRevenueType,
  toggleRevenueTypeActive,
  type RevenueTypeDto,
  type RevenueCategory,
} from './revenueTypesApi';
import { Modal } from '../../shared/Modal';

type RevenueTypesSettingsProps = {
  clinicId: string;
};

const CATEGORY_LABELS: Record<RevenueCategory, { label: string; color: string; bg: string }> = {
  consulta: { label: 'Consulta', color: '#852A91', bg: '#F7ECF8' },
  procedimento: { label: 'Procedimento', color: '#1B6B93', bg: '#E3F2FD' },
  exame: { label: 'Exame / Coleta', color: '#2E7D32', bg: '#E8F5E9' },
  outros: { label: 'Outros', color: '#626B79', bg: '#F1F3F6' },
};

export function RevenueTypesSettings({ clinicId }: RevenueTypesSettingsProps) {
  const [types, setTypes] = useState<RevenueTypeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RevenueTypeDto | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RevenueCategory>('consulta');
  const [amount, setAmount] = useState('0.00');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const data = await listRevenueTypes(clinicId);
      setTypes(data);
    } catch {
      setErrorMessage('Falha ao carregar tipos de entrada.');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleOpenCreate() {
    setEditingType(null);
    setName('');
    setCategory('consulta');
    setAmount('0.00');
    setDescription('');
    setErrorMessage(null);
    setModalOpen(true);
  }

  function handleOpenEdit(item: RevenueTypeDto) {
    setEditingType(item);
    setName(item.name);
    setCategory(item.category);
    setAmount(item.defaultAmount.toFixed(2));
    setDescription(item.description || '');
    setErrorMessage(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const numericAmount = parseFloat(amount) || 0;
      if (editingType) {
        await updateRevenueType(clinicId, editingType.id, {
          name,
          category,
          defaultAmount: numericAmount,
          description: description || undefined,
        });
      } else {
        await createRevenueType(clinicId, {
          name,
          category,
          defaultAmount: numericAmount,
          description: description || undefined,
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar tipo de entrada.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(item: RevenueTypeDto) {
    try {
      await toggleRevenueTypeActive(clinicId, item.id);
      await loadData();
    } catch {
      // Falha silenciosa
    }
  }

  function formatBrl(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--content-primary, #202631)' }}>
            Tipos de Entrada Financeira
          </h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--content-secondary, #626B79)', fontSize: '0.88rem' }}>
            Padronize os tipos de serviços, procedimentos ginecológicos e recebimentos aceitos no caixa da clínica.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={handleOpenCreate}
        >
          + Novo Tipo de Entrada
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--content-muted, #858D99)' }}>Carregando tipos cadastrados...</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--base-border, #E2E6EC)', borderRadius: '10px' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--base-muted, #F1F3F6)', borderBottom: '1px solid var(--base-border, #E2E6EC)', fontSize: '0.82rem', color: 'var(--content-secondary, #626B79)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Nome da Entrada</th>
                <th style={{ padding: '0.75rem 1rem' }}>Categoria</th>
                <th style={{ padding: '0.75rem 1rem' }}>Valor Padrão</th>
                <th style={{ padding: '0.75rem 1rem' }}>Descrição / Finalidade</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => {
                const cat = CATEGORY_LABELS[t.category] || CATEGORY_LABELS.outros;
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--base-border, #E2E6EC)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--content-primary, #202631)' }}>
                      {t.name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: cat.color,
                          backgroundColor: cat.bg,
                        }}
                      >
                        {cat.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {t.defaultAmount === 0 ? 'Gratuito / Retorno' : formatBrl(t.defaultAmount)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--content-secondary, #626B79)', fontSize: '0.82rem' }}>
                      {t.description || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: t.active ? '#E9F5EC' : '#F1F3F6',
                          color: t.active ? '#237A52' : '#858D99',
                        }}
                      >
                        {t.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="button button--ghost"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                        onClick={() => handleOpenEdit(t)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: t.active ? '#C33D49' : '#237A52' }}
                        onClick={() => void handleToggleActive(t)}
                      >
                        {t.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={editingType ? 'Editar Tipo de Entrada Financeira' : 'Novo Tipo de Entrada Financeira'}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMessage && (
              <div className="alert alert--error" role="alert" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                {errorMessage}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="revName" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Nome da Entrada *
              </label>
              <input
                id="revName"
                type="text"
                className="input"
                style={{ width: '100%', padding: '0.5rem' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Consulta Particular Ginecológica, DIU Hormonal, etc."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="revCategory" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Categoria *
                </label>
                <select
                  id="revCategory"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RevenueCategory)}
                >
                  <option value="consulta">Consulta</option>
                  <option value="procedimento">Procedimento</option>
                  <option value="exame">Exame / Coleta</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="revAmount" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Valor Padrão Sugerido (R$) *
                </label>
                <input
                  id="revAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="revDesc" style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Descrição / Orientações do Balcão
              </label>
              <textarea
                id="revDesc"
                className="input"
                style={{ width: '100%', padding: '0.5rem', minHeight: '60px' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Não cobrar se estiver dentro do prazo de retorno (30 dias)."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="button button--primary"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Salvar Tipo de Entrada'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
