import { useState } from 'react';
import {
  createMedicalDocument,
  signMedicalDocument,
  type MedicalDocumentType,
  type MedicalDocumentResponse,
} from './medicalDocumentsApi';
import { useToast } from '../layout/Toast';

interface DocumentModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  medicalRecordId?: string;
  onClose: () => void;
  onDocumentIssued?: (doc: MedicalDocumentResponse) => void;
}

export function DocumentModal({
  isOpen,
  patientId,
  patientName,
  medicalRecordId,
  onClose,
  onDocumentIssued,
}: DocumentModalProps) {
  const { addToast } = useToast();
  const [docType, setDocType] = useState<MedicalDocumentType>('receita_simples');

  // Receita
  const [medications, setMedications] = useState([
    { medication: '', concentration: '', route: 'Oral', instructions: '', quantity: '' },
  ]);
  const [generalInstructions, setGeneralInstructions] = useState('');

  // Atestado
  const [leaveDays, setLeaveDays] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [atestadoText, setAtestadoText] = useState('Atesto para os devidos fins que o paciente necessita de repouso por motivo de saúde.');
  const [cidCode, setCidCode] = useState('');
  const [consentCid, setConsentCid] = useState(false);

  // Exames
  const [examList, setExamList] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');

  const [saving, setSending] = useState(false);
  const [issuedDoc, setIssuedDoc] = useState<MedicalDocumentResponse | null>(null);

  if (!isOpen) return null;

  function handleAddMedication() {
    setMedications((prev) => [
      ...prev,
      { medication: '', concentration: '', route: 'Oral', instructions: '', quantity: '' },
    ]);
  }

  function handleRemoveMedication(index: number) {
    if (medications.length <= 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMedChange(index: number, field: string, value: string) {
    setMedications((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  async function handleSignAndIssue() {
    setSending(true);
    try {
      let payloadObj: unknown;

      if (docType === 'receita_simples' || docType === 'receita_controle_especial') {
        const validItems = medications.filter((m) => m.medication.trim().length > 0);
        if (validItems.length === 0) {
          addToast('Preencha ao menos um medicamento.', 'error');
          setSending(false);
          return;
        }
        payloadObj = {
          items: validItems,
          generalInstructions: generalInstructions.trim(),
        };
      } else if (docType === 'atestado_medico') {
        if (leaveDays < 1) {
          addToast('Os dias de afastamento devem ser de no mínimo 1 dia.', 'error');
          setSending(false);
          return;
        }
        payloadObj = {
          leaveDays,
          startDate,
          justificationText: atestadoText.trim(),
        };
      } else {
        if (!examList.trim()) {
          addToast('Informe os exames solicitados.', 'error');
          setSending(false);
          return;
        }
        payloadObj = {
          exams: examList.trim(),
          indication: clinicalIndication.trim(),
        };
      }

      // 1. Cria rascunho
      const draft = await createMedicalDocument({
        patientId,
        medicalRecordId,
        documentType: docType,
        contentPayload: JSON.stringify(payloadObj),
        cid10Code: consentCid && cidCode.trim() ? cidCode.trim() : undefined,
        patientConsentedCid: consentCid,
      });

      // 2. Assina digitalmente
      const signed = await signMedicalDocument(draft.id);
      setIssuedDoc(signed);
      addToast('Documento emitido e assinado digitalmente com sucesso!', 'success');
      onDocumentIssued?.(signed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao emitir documento.';
      addToast(msg, 'error');
    } finally {
      setSending(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="doc-modal-title">
      <div className="modal modal--large" style={{ maxWidth: '780px' }}>
        <header className="modal__header">
          <div>
            <h2 id="doc-modal-title">Emissão de Documento Médico</h2>
            <p className="form__hint">Paciente: <strong>{patientName}</strong></p>
          </div>
          <button type="button" className="button button--secondary button--small" onClick={onClose}>
            ✕ Fechar
          </button>
        </header>

        {issuedDoc ? (
          <div className="modal__body" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
              Documento Assinado Digitalmente
            </h3>
            <p className="form__hint" style={{ marginBottom: '1.5rem' }}>
              Padrão ICP-Brasil • Token de Validação: <code>{issuedDoc.publicToken}</code>
            </p>

            <div style={{ background: 'var(--color-neutral-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p><strong>Tipo:</strong> {issuedDoc.documentType.replace('_', ' ').toUpperCase()}</p>
              <p><strong>Hash da Assinatura:</strong> <code style={{ fontSize: '0.75rem' }}>{issuedDoc.signatureHash}</code></p>
              <p><strong>Data de Emissão:</strong> {issuedDoc.signedAt ? new Date(issuedDoc.signedAt).toLocaleString('pt-BR') : '-'}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button type="button" className="button button--primary" onClick={handlePrint}>
                🖨️ Imprimir Documento
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setIssuedDoc(null);
                  onClose();
                }}
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div className="modal__body">
            <div className="form__group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="doc-type-select" className="form__label">Tipo de Documento</label>
              <select
                id="doc-type-select"
                className="form__select"
                value={docType}
                onChange={(e) => setDocType(e.target.value as MedicalDocumentType)}
              >
                <option value="receita_simples">Receita Médica Simples</option>
                <option value="receita_controle_especial">Receita de Controle Especial</option>
                <option value="atestado_medico">Atestado Médico / Comparecimento</option>
                <option value="solicitacao_exames">Solicitação de Exames Complementares</option>
              </select>
            </div>

            {/* Prescrição */}
            {(docType === 'receita_simples' || docType === 'receita_controle_especial') && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>Medicamentos Prescritos</h4>
                {medications.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--color-neutral-surface)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.75rem',
                      border: '1px solid var(--color-neutral-border)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form__input"
                        placeholder="Nome do Medicamento (ex.: Amoxicilina)"
                        value={item.medication}
                        onChange={(e) => handleMedChange(idx, 'medication', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form__input"
                        placeholder="Concentração (ex.: 500mg)"
                        value={item.concentration}
                        onChange={(e) => handleMedChange(idx, 'concentration', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form__input"
                        placeholder="Quantidade (ex.: 1cx)"
                        value={item.quantity}
                        onChange={(e) => handleMedChange(idx, 'quantity', e.target.value)}
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          className="button button--secondary button--small"
                          onClick={() => handleRemoveMedication(idx)}
                          title="Remover medicamento"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form__input"
                      placeholder="Posologia e Instruções (ex.: Tomar 1 comprimido a cada 8 horas durante 7 dias)"
                      value={item.instructions}
                      onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={handleAddMedication}
                  style={{ marginBottom: '1rem' }}
                >
                  + Adicionar Outro Medicamento
                </button>

                <div className="form__group">
                  <label htmlFor="gen-instr" className="form__label">Instruções Gerais ao Paciente</label>
                  <textarea
                    id="gen-instr"
                    className="form__textarea"
                    rows={2}
                    placeholder="Orientações complementares (hidratação, alimentação, etc.)"
                    value={generalInstructions}
                    onChange={(e) => setGeneralInstructions(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Atestado */}
            {docType === 'atestado_medico' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form__group">
                    <label htmlFor="leave-days" className="form__label">Dias de Afastamento / Repouso</label>
                    <input
                      id="leave-days"
                      type="number"
                      min={1}
                      max={90}
                      className="form__input"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(Number(e.target.value))}
                    />
                  </div>
                  <div className="form__group">
                    <label htmlFor="start-date" className="form__label">A partir de</label>
                    <input
                      id="start-date"
                      type="date"
                      className="form__input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form__group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="atestado-text" className="form__label">Texto do Atestado</label>
                  <textarea
                    id="atestado-text"
                    className="form__textarea"
                    rows={3}
                    value={atestadoText}
                    onChange={(e) => setAtestadoText(e.target.value)}
                  />
                </div>

                <div
                  style={{
                    background: 'var(--color-neutral-surface)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-border)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={consentCid}
                      onChange={(e) => setConsentCid(e.target.checked)}
                    />
                    O paciente solicitou a inclusão expressa do diagnóstico CID-10 (Art. 73 do CEM)
                  </label>

                  {consentCid && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label htmlFor="cid-code" className="form__label">Código CID-10</label>
                      <input
                        id="cid-code"
                        type="text"
                        className="form__input"
                        placeholder="Ex.: M54.5"
                        value={cidCode}
                        onChange={(e) => setCidCode(e.target.value)}
                        style={{ maxWidth: '160px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Exames */}
            {docType === 'solicitacao_exames' && (
              <div>
                <div className="form__group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="exam-list" className="form__label">Exames Solicitados</label>
                  <textarea
                    id="exam-list"
                    className="form__textarea"
                    rows={4}
                    placeholder="Ex.: 1. Hemograma Completo&#10;2. Glicemia de Jejum&#10;3. Ultrassonografia Abdominal"
                    value={examList}
                    onChange={(e) => setExamList(e.target.value)}
                  />
                </div>
                <div className="form__group">
                  <label htmlFor="clinical-ind" className="form__label">Indicação Clínica / Suspeita Diagnóstica</label>
                  <textarea
                    id="clinical-ind"
                    className="form__textarea"
                    rows={2}
                    placeholder="Justificativa clínica para realização dos exames"
                    value={clinicalIndication}
                    onChange={(e) => setClinicalIndication(e.target.value)}
                  />
                </div>
              </div>
            )}

            <footer className="modal__footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="button button--secondary" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="button button--primary" onClick={handleSignAndIssue} disabled={saving}>
                {saving ? 'Assinando Digitalmente…' : '🔏 Assinar e Emitir'}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
