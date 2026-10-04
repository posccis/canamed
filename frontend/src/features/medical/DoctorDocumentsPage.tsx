import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getPatientMedicalDocuments,
  cancelMedicalDocument,
  type MedicalDocumentResponse,
  type MedicalDocumentType,
} from './medicalDocumentsApi';
import { fetchPatients, type ManagedPatient } from '../catalog/catalogApi';
import { DocumentModal } from './DocumentModal';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS } from '../../navigation/routes';

export function DoctorDocumentsPage() {
  const { addToast } = useToast();

  const [patients, setPatients] = useState<ManagedPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [documents, setDocuments] = useState<MedicalDocumentResponse[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [typeFilter, setTypeFilter] = useState<string>('todas');
  const [docModalOpen, setDocModalOpen] = useState(false);

  // Cancelamento
  const [cancellingDocId, setCancellingDocId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [savingCancel, setSavingCancel] = useState(false);

  // Carrega pacientes
  useEffect(() => {
    let active = true;
    setLoadingPatients(true);

    fetchPatients()
      .then((data) => {
        if (active) {
          setPatients(data);
          if (data.length > 0 && !selectedPatientId) {
            setSelectedPatientId(data[0].id);
          }
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao buscar pacientes.';
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (active) setLoadingPatients(false);
      });

    return () => {
      active = false;
    };
  }, [addToast, selectedPatientId]);

  // Carrega documentos do paciente selecionado
  useEffect(() => {
    if (!selectedPatientId) {
      setDocuments([]);
      return;
    }

    let active = true;
    setLoadingDocs(true);

    getPatientMedicalDocuments(selectedPatientId)
      .then((data) => {
        if (active) setDocuments(data);
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Falha ao buscar documentos.';
          addToast(msg, 'error');
        }
      })
      .finally(() => {
        if (active) setLoadingDocs(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPatientId, addToast]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const filteredDocs = useMemo(() => {
    if (typeFilter === 'todas') return documents;
    return documents.filter((d) => d.documentType === typeFilter);
  }, [documents, typeFilter]);

  async function handleCancelDoc(docId: string) {
    if (!cancelReason.trim()) {
      addToast('Justificativa obrigatória para revogar documento conforme CFM.', 'error');
      return;
    }

    setSavingCancel(true);
    try {
      await cancelMedicalDocument(docId, { reason: cancelReason.trim() });
      addToast('Documento cancelado / revogado com sucesso.', 'success');
      setCancellingDocId(null);
      setCancelReason('');

      if (selectedPatientId) {
        const refreshed = await getPatientMedicalDocuments(selectedPatientId);
        setDocuments(refreshed);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cancelar documento.';
      addToast(msg, 'error');
    } finally {
      setSavingCancel(false);
    }
  }

  function getDocumentTypeName(type: MedicalDocumentType) {
    switch (type) {
      case 'receita_simples':
        return 'Receita Simples';
      case 'receita_controle_especial':
        return 'Receita de Controle Especial';
      case 'atestado_medico':
        return 'Atestado Médico';
      case 'solicitacao_exames':
        return 'Solicitação de Exames';
      default:
        return type;
    }
  }

  return (
    <div className="page" style={{ maxWidth: '1400px' }}>
      <header className="page__header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page__title">Documentos Clínicos & Prescrições</h1>
          <p className="form__hint">
            Emissão de receitas, atestados e pedidos com assinatura digital e validação pública por QR Code.
          </p>
        </div>

        {selectedPatientId && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link
              to={DOCTOR_PATHS.patientRecord(selectedPatientId)}
              target="_blank"
              rel="noopener noreferrer"
              className="button button--secondary button--small"
              title="Abrir Prontuário deste paciente em uma nova aba"
            >
              📋 Ver Prontuário em Nova Aba ↗
            </Link>
            <button
              type="button"
              className="button button--primary button--small"
              onClick={() => setDocModalOpen(true)}
            >
              📄 + Emitir Novo Documento
            </button>
          </div>
        )}
      </header>

      {/* Barra de Filtros e Seleção do Paciente */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-border)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          alignItems: 'end',
        }}
      >
        <label className="field">
          <span className="field__label" style={{ fontWeight: 600 }}>Selecionar Paciente</span>
          <select
            className="form__select"
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            disabled={loadingPatients}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.phone ? `(${p.phone})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label" style={{ fontWeight: 600 }}>Tipo de Documento</span>
          <select
            className="form__select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="todas">Todos os Documentos</option>
            <option value="receita_simples">Receitas Simples</option>
            <option value="receita_controle_especial">Receitas de Controle Especial</option>
            <option value="atestado_medico">Atestados Médicos</option>
            <option value="solicitacao_exames">Solicitações de Exames</option>
          </select>
        </label>
      </div>

      {/* Lista de Documentos */}
      <section
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-neutral-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {loadingDocs ? (
          <p className="form__hint">Carregando documentos do paciente…</p>
        ) : filteredDocs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-neutral-muted)' }}>
            <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>Nenhum documento encontrado para este paciente.</p>
            {selectedPatient && (
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => setDocModalOpen(true)}
                style={{ marginTop: '0.5rem' }}
              >
                📄 Emitir Documento para {selectedPatient.name}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredDocs.map((doc) => (
              <article
                key={doc.id}
                style={{
                  border: '1px solid var(--color-neutral-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  background: doc.status === 'cancelado' ? '#fef2f2' : 'var(--color-neutral-surface)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                      {getDocumentTypeName(doc.documentType)}
                    </strong>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: doc.status === 'assinado' ? '#dcfce7' : doc.status === 'cancelado' ? '#fee2e2' : '#fef9c3',
                        color: doc.status === 'assinado' ? '#15803d' : doc.status === 'cancelado' ? '#991b1b' : '#854d0e',
                      }}
                    >
                      {doc.status.toUpperCase()}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-muted)' }}>
                    Emitido em: {new Date(doc.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-neutral-border)',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {doc.contentPayload}
                </div>

                {doc.cid10Code && (
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                    CID-10 Declarado: <strong>{doc.cid10Code}</strong> (Consentimento do paciente registrado)
                  </p>
                )}

                {doc.cancellationReason && (
                  <div
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    Motivo do cancelamento: <em>{doc.cancellationReason}</em>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted)' }}>
                    Token de Validação Pública: <code>{doc.publicToken}</code>
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      to={`/p/cana-med/validar/${doc.publicToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button--secondary button--small"
                      title="Ver página de validação pública e QR Code em nova aba"
                    >
                      🔍 Validar Documento ↗
                    </Link>

                    {doc.status !== 'cancelado' && (
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        onClick={() => {
                          setCancellingDocId(doc.id);
                          setCancelReason('');
                        }}
                        style={{ color: '#b91c1c' }}
                      >
                        Revogar / Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {cancellingDocId === doc.id && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #feb2b2',
                    }}
                  >
                    <h5 style={{ margin: '0 0 0.5rem', color: '#991b1b' }}>Revogação de Documento Clínico</h5>
                    <p className="form__hint" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      Informe o motivo da anulação do documento (ex.: erro de dosagem, documento emitido em duplicidade).
                    </p>
                    <input
                      type="text"
                      className="form__input"
                      placeholder="Motivo obrigatório…"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      style={{ marginBottom: '0.5rem' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="button button--secondary button--small"
                        onClick={() => setCancellingDocId(null)}
                      >
                        Desistir
                      </button>
                      <button
                        type="button"
                        className="button button--primary button--small"
                        onClick={() => handleCancelDoc(doc.id)}
                        disabled={savingCancel}
                        style={{ background: '#b91c1c' }}
                      >
                        {savingCancel ? 'Revogando…' : 'Confirmar Revogação'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Novo Documento */}
      {selectedPatient && (
        <DocumentModal
          isOpen={docModalOpen}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          onClose={() => setDocModalOpen(false)}
          onDocumentIssued={() => {
            if (selectedPatientId) {
              getPatientMedicalDocuments(selectedPatientId).then(setDocuments);
            }
          }}
        />
      )}
    </div>
  );
}
