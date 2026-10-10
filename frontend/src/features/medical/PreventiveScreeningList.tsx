import { useState } from 'react';
import {
  type PreventiveScreeningDto,
  type CreatePreventiveScreeningRequest,
  addPatientScreening,
} from './medicalRecordsApi';
import { useToast } from '../layout/Toast';

interface Props {
  patientId: string;
  screenings: PreventiveScreeningDto[];
  onScreeningAdded: (screening: PreventiveScreeningDto) => void;
  readOnly?: boolean;
}

export function PreventiveScreeningList({ patientId, screenings, onScreeningAdded, readOnly }: Props) {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [examType, setExamType] = useState('citopatologico');
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [resultSummary, setResultSummary] = useState('');
  const [classification, setClassification] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultSummary.trim()) {
      addToast('O laudo/resultado do exame é obrigatório.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: CreatePreventiveScreeningRequest = {
        examType,
        performedAt,
        resultSummary: resultSummary.trim(),
        classification: classification.trim() || undefined,
        nextDueDate: nextDueDate ? nextDueDate : undefined,
      };

      const added = await addPatientScreening(patientId, payload);
      onScreeningAdded(added);
      addToast('Exame preventivo registrado com sucesso!', 'success');
      setResultSummary('');
      setClassification('');
      setNextDueDate('');
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar exame preventivo.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getExamLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'citopatologico': return '🔬 Citopatológico (Papanicolau)';
      case 'pesquisa_hpv': return '🧬 Pesquisa de HPV (DNA-HPV)';
      case 'mamografia': return '🎀 Mamografia Bilateral';
      case 'ultrassom_transvaginal': return '📷 Ultrassonografia Transvaginal';
      case 'colposcopia': return '🔍 Colposcopia';
      default: return type.toUpperCase();
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--color-neutral-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-neutral-border)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🛡️</span>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--color-primary-dark)' }}>
            Rastreamento Preventivo & Linha do Tempo ({screenings.length})
          </h3>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="button button--primary button--small"
            onClick={() => setModalOpen(true)}
          >
            ➕ Registrar Exame Preventivo
          </button>
        )}
      </div>

      {screenings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--color-neutral-muted)' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📋</span>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Nenhum exame preventivo registrado ainda.</p>
          <p className="form__hint" style={{ margin: 0 }}>
            Registre os resultados de Citopatológico (Papanicolau), HPV, Mamografia ou USG para manter a linha do tempo assistencial atualizada.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {screenings.map((s) => {
            const isDue = s.nextDueDate && new Date(s.nextDueDate) < new Date();

            return (
              <div
                key={s.id}
                style={{
                  border: '1px solid var(--color-neutral-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  background: 'var(--color-neutral-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <strong style={{ color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>
                      {getExamLabel(s.examType)}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)' }}>
                      • Realizado em: {new Date(s.performedAt).toLocaleDateString('pt-BR')}
                    </span>
                    {s.classification && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          background: s.classification.toLowerCase().includes('negativo') ? '#c6f6d5' : '#feebc8',
                          color: s.classification.toLowerCase().includes('negativo') ? '#22543d' : '#744210',
                        }}
                      >
                        {s.classification}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#2d3748' }}>
                    {s.resultSummary}
                  </p>
                </div>

                {s.nextDueDate && (
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--color-neutral-muted)', display: 'block' }}>Próximo Controle:</span>
                    <strong style={{ color: isDue ? '#c53030' : 'var(--color-primary)' }}>
                      {isDue ? '⚠️ Atrasado: ' : '✅ Em dia: '}
                      {new Date(s.nextDueDate).toLocaleDateString('pt-BR')}
                    </strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Registro de Novo Preventivo */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '540px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Novo Exame Preventivo</h3>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="field">
                <span className="field__label">Tipo de Exame</span>
                <select
                  className="form__select"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                >
                  <option value="citopatologico">Citopatológico de Colo (Papanicolau)</option>
                  <option value="pesquisa_hpv">Pesquisa de HPV (DNA-HPV / Co-teste)</option>
                  <option value="mamografia">Mamografia Bilateral</option>
                  <option value="ultrassom_transvaginal">Ultrassonografia Transvaginal</option>
                  <option value="colposcopia">Colposcopia</option>
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label className="field">
                  <span className="field__label">Data de Realização</span>
                  <input
                    type="date"
                    className="form__input"
                    value={performedAt}
                    onChange={(e) => setPerformedAt(e.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span className="field__label">Classificação (opcional)</span>
                  <input
                    type="text"
                    className="form__input"
                    placeholder="Ex: BI-RADS 2, Negativo..."
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <span className="field__label">Resumo do Laudo / Conclusão</span>
                <textarea
                  className="form__textarea"
                  rows={3}
                  placeholder="Descreva a conclusão do exame preventivo..."
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span className="field__label">Data Sugerida para Próximo Controle (opcional)</span>
                <input
                  type="date"
                  className="form__input"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={saving}
                >
                  {saving ? 'Registrando…' : 'Salvar Exame'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
