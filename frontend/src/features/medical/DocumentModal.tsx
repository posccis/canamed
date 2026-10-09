import { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle,
  Plus,
  Trash2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
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
  const [atestadoText, setAtestadoText] = useState('Atesto para os devidos fins que a paciente necessita de repouso por motivo de saúde.');
  const [cidCode, setCidCode] = useState('');
  const [consentCid, setConsentCid] = useState(false);

  // Exames
  const [examList, setExamList] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');

  const [saving, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    setFormError(null);

    try {
      let payloadObj: unknown;

      if (docType === 'receita_simples' || docType === 'receita_controle_especial') {
        const validItems = medications.filter((m) => m.medication.trim().length > 0);
        if (validItems.length === 0) {
          const err = 'Preencha o nome e posologia de ao menos um medicamento.';
          setFormError(err);
          addToast(err, 'error');
          setSending(false);
          return;
        }
        payloadObj = {
          items: validItems,
          generalInstructions: generalInstructions.trim(),
        };
      } else if (docType === 'atestado_medico') {
        if (leaveDays < 1) {
          const err = 'Os dias de afastamento devem ser de no mínimo 1 dia.';
          setFormError(err);
          addToast(err, 'error');
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
          const err = 'Informe ao menos um exame solicitado.';
          setFormError(err);
          addToast(err, 'error');
          setSending(false);
          return;
        }
        payloadObj = {
          exams: examList.trim(),
          indication: clinicalIndication.trim(),
        };
      }

      // 1. Criação do Rascunho com controle explícito de consentimento de CID (Art. 73 CEM - MED-01)
      const draft = await createMedicalDocument({
        patientId,
        medicalRecordId,
        documentType: docType,
        contentPayload: JSON.stringify(payloadObj),
        cid10Code: consentCid && cidCode.trim() ? cidCode.trim().toUpperCase() : undefined,
        patientConsentedCid: consentCid,
      });

      // 2. Assinatura Digital ICP-Brasil
      const signed = await signMedicalDocument(draft.id);
      setIssuedDoc(signed);
      addToast('Documento médico assinado digitalmente com sucesso!', 'success');
      onDocumentIssued?.(signed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao emitir documento.';
      setFormError(msg);
      addToast(msg, 'error');
    } finally {
      setSending(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const pdfDownloadUrl = issuedDoc
    ? `/api/v1/public/validate-document/${encodeURIComponent(issuedDoc.publicToken)}/download`
    : null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="doc-modal-title">
      <button type="button" className="modal__backdrop" aria-label="Fechar" onClick={onClose} />
      <div className="modal__content modal__content--large" style={{ maxWidth: '840px', width: 'min(840px, 95vw)' }}>
        <header className="modal__header">
          <div>
            <h2 id="doc-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FileText size={22} color="var(--color-primary)" />
              Emissão de Documento Clínico
            </h2>
            <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
              Paciente: <strong>{patientName}</strong> • Emissão com Assinatura Digital ICP-Brasil
            </p>
          </div>
          <button type="button" className="button button--secondary button--small" onClick={onClose}>
            ✕ Fechar
          </button>
        </header>

        {issuedDoc ? (
          <div className="modal__body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '999px', background: '#dcfce7', color: '#15803d', marginBottom: '1rem' }}>
              <CheckCircle size={48} />
            </div>

            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.35rem', fontSize: '1.4rem' }}>
              Documento Assinado Digitalmente
            </h3>
            <p className="form__hint" style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Em conformidade com a ICP-Brasil e o Conselho Federal de Medicina.
            </p>

            {/* Detalhes do Documento com Realce do Token */}
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.75rem',
                textAlign: 'left',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Tipo de Documento:</span>
                <strong style={{ textTransform: 'uppercase', color: 'var(--color-primary-dark)' }}>
                  {issuedDoc.documentType.replace('_', ' ')}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Código Verificador Público:</span>
                <code
                  style={{
                    background: '#e6fffa',
                    color: '#005f6a',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95rem',
                    border: '1px solid #66cdaa',
                  }}
                >
                  {issuedDoc.publicToken}
                </code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Hash SHA-256 ICP-Brasil:</span>
                <code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {issuedDoc.signatureHash}
                </code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Data e Hora de Emissão:</span>
                <span>{issuedDoc.signedAt ? new Date(issuedDoc.signedAt).toLocaleString('pt-BR') : '-'}</span>
              </div>
            </div>

            {/* Ações: Download PDF e Impressão */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {pdfDownloadUrl && (
                <a
                  href={pdfDownloadUrl}
                  download={`canamed-${issuedDoc.documentType}-${issuedDoc.publicToken.slice(0, 8)}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={16} />
                  Baixar PDF Autenticado
                </a>
              )}

              <button
                type="button"
                className="button button--secondary"
                onClick={handlePrint}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Printer size={16} />
                Imprimir Documento
              </button>

              <button
                type="button"
                className="button button--ghost"
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
            {formError && (
              <div className="alert alert--error" role="alert" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form__group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="doc-type-select" className="form__label">
                Tipo de Documento Clínico
              </label>
              <select
                id="doc-type-select"
                className="form__select"
                value={docType}
                onChange={(e) => {
                  setDocType(e.target.value as MedicalDocumentType);
                  setFormError(null);
                }}
              >
                <option value="receita_simples">Receita Médica Simples</option>
                <option value="receita_controle_especial">Receita de Controle Especial</option>
                <option value="atestado_medico">Atestado Médico / Afastamento</option>
                <option value="solicitacao_exames">Solicitação de Exames Complementares</option>
              </select>
            </div>

            {/* Formulário de Prescrição */}
            {(docType === 'receita_simples' || docType === 'receita_controle_especial') && (
              <div>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary-dark)' }}>
                  Medicamentos Prescritos
                </h4>

                {medications.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--color-surface)',
                      padding: '0.9rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '0.75rem',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        className="form__input"
                        placeholder="Nome do Medicamento (ex.: Progesterona Natural)"
                        value={item.medication}
                        onChange={(e) => handleMedChange(idx, 'medication', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form__input"
                        placeholder="Dose (ex.: 200mg)"
                        value={item.concentration}
                        onChange={(e) => handleMedChange(idx, 'concentration', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form__input"
                        placeholder="Qtd (ex.: 30 cápsulas)"
                        value={item.quantity}
                        onChange={(e) => handleMedChange(idx, 'quantity', e.target.value)}
                      />
                      {medications.length > 1 && (
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => handleRemoveMedication(idx)}
                          title="Remover medicamento"
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form__input"
                      placeholder="Posologia e Instruções (ex.: Tomar 1 cápsula por via vaginal à noite durante 14 dias)"
                      value={item.instructions}
                      onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  className="button button--secondary button--small"
                  onClick={handleAddMedication}
                  style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Plus size={16} />
                  Adicionar Outro Medicamento
                </button>

                <div className="form__group">
                  <label htmlFor="gen-instr" className="form__label">
                    Orientações Gerais ao Paciente (opcional)
                  </label>
                  <textarea
                    id="gen-instr"
                    className="form__textarea"
                    rows={2}
                    placeholder="Instruções de hidratação, alimentação ou retorno..."
                    value={generalInstructions}
                    onChange={(e) => setGeneralInstructions(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Formulário de Atestado Médico com Proteção Ética CFM Art. 73 (MED-01) */}
            {docType === 'atestado_medico' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form__group">
                    <label htmlFor="leave-days" className="form__label">
                      Dias de Afastamento / Repouso *
                    </label>
                    <input
                      id="leave-days"
                      type="number"
                      min={1}
                      max={90}
                      className="form__input"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="form__group">
                    <label htmlFor="start-date" className="form__label">
                      A partir de *
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      className="form__input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form__group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="atestado-text" className="form__label">
                    Texto do Atestado
                  </label>
                  <textarea
                    id="atestado-text"
                    className="form__textarea"
                    rows={3}
                    value={atestadoText}
                    onChange={(e) => setAtestadoText(e.target.value)}
                  />
                </div>

                {/* Controle de Sigilo do CID-10 conforme Código de Ética Médica Art. 73 */}
                <div
                  style={{
                    background: 'var(--color-surface)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      className="form__checkbox"
                      checked={consentCid}
                      onChange={(e) => setConsentCid(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <span>
                      Imprimir CID no documento (Requer consentimento expresso da paciente — Art. 73 do CEM)
                    </span>
                  </label>

                  {consentCid && (
                    <div style={{ marginTop: '0.75rem', paddingLeft: '1.75rem' }}>
                      <label htmlFor="cid-code" className="form__label" style={{ fontSize: '0.85rem' }}>
                        Código CID-10
                      </label>
                      <input
                        id="cid-code"
                        type="text"
                        className="form__input"
                        placeholder="Ex.: N92.0, N80.0"
                        value={cidCode}
                        onChange={(e) => setCidCode(e.target.value)}
                        style={{ maxWidth: '180px' }}
                      />
                      <span className="form__hint" style={{ display: 'block', marginTop: '0.25rem' }}>
                        O diagnóstico só será visível no documento impresso/PDF mediante a confirmação da paciente.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Formulário de Solicitação de Exames Complementares */}
            {docType === 'solicitacao_exames' && (
              <div>
                <div className="form__group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="exam-list" className="form__label">
                    Exames Solicitados *
                  </label>
                  <textarea
                    id="exam-list"
                    className="form__textarea"
                    rows={4}
                    placeholder="Ex.: 1. Ultrassonografia Transvaginal&#10;2. Mamografia Digital Bilateral&#10;3. Citopatológico do Colo Uterino"
                    value={examList}
                    onChange={(e) => setExamList(e.target.value)}
                    required
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="clinical-ind" className="form__label">
                    Indicação Clínica / Suspeita Diagnóstica (opcional)
                  </label>
                  <textarea
                    id="clinical-ind"
                    className="form__textarea"
                    rows={2}
                    placeholder="Justificativa clínica para realização dos exames complementares"
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
              <button
                type="button"
                className="button button--primary"
                onClick={handleSignAndIssue}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ShieldCheck size={16} />
                {saving ? 'Assinando Digitalmente…' : 'Assinar e Emitir'}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
