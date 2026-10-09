import { useState, useEffect } from 'react';
import {
  getPatientMedicalRecordHistory,
  addMedicalRecordAddendum,
  type MedicalRecordResponse,
} from './medicalRecordsApi';
import { useToast } from '../layout/Toast';

interface PatientHistoryModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  onClose: () => void;
}

export function PatientHistoryModal({
  isOpen,
  patientId,
  patientName,
  onClose,
}: PatientHistoryModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MedicalRecordResponse[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Adendo
  const [addendumJustification, setAddendumJustification] = useState('');
  const [addendumNotes, setAddendumNotes] = useState('');
  const [savingAddendum, setSavingAddendum] = useState(false);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    let active = true;
    setLoading(true);

    getPatientMedicalRecordHistory(patientId)
      .then((records) => {
        if (active) setHistory(records);
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao buscar histórico.';
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, patientId, addToast]);

  if (!isOpen) return null;

  async function handleAddAddendum(recordId: string) {
    if (!addendumJustification.trim() || !addendumNotes.trim()) {
      addToast('Preencha a justificativa e o texto do adendo.', 'error');
      return;
    }

    setSavingAddendum(true);
    try {
      await addMedicalRecordAddendum(recordId, {
        justification: addendumJustification.trim(),
        notes: addendumNotes.trim(),
      });
      addToast('Adendo clínico registrado com sucesso!', 'success');
      setAddendumJustification('');
      setAddendumNotes('');
      setSelectedRecordId(null);

      // Recarrega histórico
      const refreshed = await getPatientMedicalRecordHistory(patientId);
      setHistory(refreshed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar adendo.';
      addToast(msg, 'error');
    } finally {
      setSavingAddendum(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="modal modal--large" style={{ maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <header className="modal__header">
          <div>
            <h2 id="history-modal-title">Histórico de Atendimentos Anteriores</h2>
            <p className="form__hint">Paciente: <strong>{patientName}</strong></p>
          </div>
          <button type="button" className="button button--secondary button--small" onClick={onClose}>
            ✕ Fechar
          </button>
        </header>

        <div className="modal__body" style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p className="form__hint">Carregando histórico clínico…</p>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-neutral-muted)' }}>
              Nenhum atendimento anterior registrado para este paciente nesta clínica.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map((record) => (
                <article
                  key={record.id}
                  style={{
                    background: 'var(--color-neutral-surface)',
                    border: '1px solid var(--color-neutral-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--color-neutral-border)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                      Consulta em {new Date(record.createdAt).toLocaleDateString('pt-BR')} às {new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: record.status === 'finalizado' ? 'var(--color-success-bg, #e6fffa)' : 'var(--color-warning-bg, #fffaf0)',
                        color: record.status === 'finalizado' ? 'var(--color-primary-dark)' : 'var(--color-warning-text, #c05621)',
                      }}
                    >
                      {record.status === 'finalizado' ? 'Finalizado' : 'Em Andamento'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                    {record.subjective && (
                      <div>
                        <strong>Subjetivo:</strong>
                        <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{record.subjective}</p>
                      </div>
                    )}
                    {record.objective && (
                      <div>
                        <strong>Objetivo / Exame:</strong>
                        <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{record.objective}</p>
                      </div>
                    )}
                    {record.assessment && (
                      <div>
                        <strong>Avaliação / Diagnóstico:</strong>
                        <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{record.assessment}</p>
                      </div>
                    )}
                    {record.plan && (
                      <div>
                        <strong>Plano / Conduta:</strong>
                        <p style={{ marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>{record.plan}</p>
                      </div>
                    )}
                  </div>

                  {/* Adendos do prontuário */}
                  {record.addenda && record.addenda.length > 0 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--color-neutral-border)', paddingTop: '0.75rem' }}>
                      <h5 style={{ fontSize: '0.8rem', color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
                        Adendos e Retificações ({record.addenda.length})
                      </h5>
                      {record.addenda.map((ad) => (
                        <div key={ad.id} style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.4rem', borderLeft: '3px solid var(--color-primary)' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-neutral-muted)' }}>
                            {new Date(ad.createdAt).toLocaleString('pt-BR')} • Motivo: <em>{ad.justification}</em>
                          </p>
                          <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{ad.notes}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão de adicionar adendo se finalizado */}
                  {record.status === 'finalizado' && (
                    <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                      {selectedRecordId === record.id ? (
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)', textAlign: 'left', marginTop: '0.5rem' }}>
                          <h5 style={{ marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>Novo Adendo Clínico</h5>
                          <input
                            type="text"
                            className="form__input"
                            placeholder="Justificativa obrigatória (ex.: Recebimento de resultado de biópsia)"
                            value={addendumJustification}
                            onChange={(e) => setAddendumJustification(e.target.value)}
                            style={{ marginBottom: '0.5rem' }}
                          />
                          <textarea
                            className="form__textarea"
                            rows={2}
                            placeholder="Texto e anotações do adendo clínico"
                            value={addendumNotes}
                            onChange={(e) => setAddendumNotes(e.target.value)}
                            style={{ marginBottom: '0.5rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="button button--secondary button--small" onClick={() => setSelectedRecordId(null)}>
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="button button--primary button--small"
                              onClick={() => handleAddAddendum(record.id)}
                              disabled={savingAddendum}
                            >
                              {savingAddendum ? 'Salvando…' : 'Salvar Adendo'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="button button--secondary button--small"
                          onClick={() => {
                            setSelectedRecordId(record.id);
                            setAddendumJustification('');
                            setAddendumNotes('');
                          }}
                        >
                          + Adicionar Adendo Clínico
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
