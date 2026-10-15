import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  Download,
  Trash2,
  ShieldCheck,
  Calendar,
  Building,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  getPatientExamAttachments,
  uploadPatientExamAttachment,
  deactivatePatientExamAttachment,
  getExamAttachmentDownloadUrl,
  type PatientExamAttachmentDto,
} from './medicalRecordsApi';
import { useToast } from '../layout/Toast';

interface PatientExamAttachmentsSectionProps {
  patientId: string;
  medicalRecordId?: string;
  canEdit?: boolean;
}

const EXAM_TYPE_OPTIONS = [
  { value: 'usg_transvaginal', label: 'Ultrassonografia Transvaginal', color: '#0f766e', bg: '#f0fdfa' },
  { value: 'mamografia', label: 'Mamografia Digital / Convencional', color: '#9d174d', bg: '#fdf2f8' },
  { value: 'citopatologico', label: 'Citopatológico / Papanicolau', color: '#6b21a8', bg: '#faf5ff' },
  { value: 'usg_pelvica', label: 'Ultrassonografia Pélvica', color: '#0f766e', bg: '#f0fdfa' },
  { value: 'usg_mamas', label: 'Ultrassonografia de Mamas', color: '#9d174d', bg: '#fdf2f8' },
  { value: 'colposcopia', label: 'Colposcopia / Vulvoscopia', color: '#7c2d12', bg: '#fff7ed' },
  { value: 'laboratorial', label: 'Exames Laboratoriais / Hormonais', color: '#1d4ed8', bg: '#eff6ff' },
  { value: 'anatomopatologico', label: 'Anatomopatológico / Biópsia', color: '#b45309', bg: '#fffbeb' },
  { value: 'densitometria', label: 'Densitometria Óssea', color: '#374151', bg: '#f3f4f6' },
  { value: 'outros', label: 'Outros Exames Complementares', color: '#4b5563', bg: '#f9fafb' },
];

export function PatientExamAttachmentsSection({
  patientId,
  medicalRecordId,
  canEdit = true,
}: PatientExamAttachmentsSectionProps) {
  const { addToast } = useToast();

  const [attachments, setAttachments] = useState<PatientExamAttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('usg_transvaginal');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [labFacility, setLabFacility] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPatientExamAttachments(patientId);
      setAttachments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao buscar exames anteriores.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [patientId, addToast]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  function handleFileSelect(file: File) {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFormError('Formato inválido. Selecione um arquivo PDF ou imagem (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFormError('Arquivo muito grande. O tamanho máximo permitido é de 15 MB.');
      return;
    }

    setFormError(null);
    setSelectedFile(file);

    // Preenche título sugerido a partir do nome do arquivo se estiver vazio
    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.slice(0, 80));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
      setShowUploadModal(true);
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setFormError('Selecione um arquivo para envio.');
      return;
    }

    if (!title.trim()) {
      setFormError('Informe o título ou identificação do exame.');
      return;
    }

    setIsUploading(true);
    setFormError(null);

    try {
      await uploadPatientExamAttachment(patientId, {
        file: selectedFile,
        title: title.trim(),
        examType,
        examDate,
        labFacility: labFacility.trim() || undefined,
        notes: notes.trim() || undefined,
        medicalRecordId,
      });

      addToast('Exame anexado ao prontuário com sucesso!', 'success');
      setShowUploadModal(false);
      resetForm();
      await loadAttachments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar arquivo de exame.';
      setFormError(msg);
      addToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeactivate(id: string, examTitle: string) {
    const confirmed = window.confirm(`Deseja inativar o anexo "${examTitle}"? Ele deixará de ser visível no prontuário ativo.`);
    if (!confirmed) return;

    try {
      await deactivatePatientExamAttachment(patientId, id);
      addToast('Exame inativado.', 'info');
      await loadAttachments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao inativar anexo.';
      addToast(msg, 'error');
    }
  }

  function resetForm() {
    setSelectedFile(null);
    setTitle('');
    setExamType('usg_transvaginal');
    setExamDate(new Date().toISOString().slice(0, 10));
    setLabFacility('');
    setNotes('');
    setFormError(null);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="exam-attachments-section" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={20} color="var(--color-primary)" />
            Exames Anteriores Trazidos pela Paciente ({attachments.length})
          </h3>
          <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
            Laudos, ultrassonografias, mamografias e exames laboratoriais prévios anexados com integridade probatória (SHA-256).
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            className="button button--primary button--small"
            onClick={() => setShowUploadModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <UploadCloud size={16} />
            + Anexar Novo Exame
          </button>
        )}
      </div>

      {/* Zona de Drag & Drop para Agilidade de Consultório */}
      {canEdit && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            fileInputRef.current?.click();
          }}
          style={{
            border: isDragOver ? '2px solid var(--color-primary)' : '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            background: isDragOver ? 'var(--color-highlight)' : 'var(--color-surface)',
            cursor: 'pointer',
            transition: 'all var(--transition-speed) ease',
            marginBottom: '1.25rem',
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Área de envio de exames anteriores por arrastar ou selecionar"
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
                setShowUploadModal(true);
              }
            }}
          />
          <UploadCloud size={32} color="var(--color-primary)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>
            Arraste um laudo/exame aqui ou <span style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>clique para selecionar</span>
          </p>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Formatos suportados: PDF, PNG, JPG, WEBP (Máximo 15 MB)
          </span>
        </div>
      )}

      {/* Lista de Exames Anexados */}
      {loading ? (
        <p className="form__hint">Carregando exames anexados…</p>
      ) : attachments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2.5rem 1rem',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <FileText size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
          <p style={{ margin: '0 0 0.35rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Nenhum exame anterior anexado para esta paciente.
          </p>
          <p className="form__hint" style={{ margin: 0 }}>
            Utilize o botão acima para digitalizar ou anexar laudos e imagens trazidos na consulta.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
          {attachments.map((item) => {
            const typeConfig = EXAM_TYPE_OPTIONS.find((t) => t.value === item.examType) || {
              label: item.examType,
              color: '#4b5563',
              bg: '#f3f4f6',
            };
            const downloadUrl = getExamAttachmentDownloadUrl(patientId, item.id);

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        background: typeConfig.bg,
                        color: typeConfig.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {typeConfig.label}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(item.fileSizeBytes)}
                    </span>
                  </div>

                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.4rem' }}>
                    {item.title}
                  </strong>

                  <div style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      Data do Exame: <strong>{new Date(`${item.examDate}T00:00:00`).toLocaleDateString('pt-BR')}</strong>
                    </span>

                    {item.labFacility && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building size={14} />
                        Local / Laboratório: {item.labFacility}
                      </span>
                    )}

                    {item.notes && (
                      <p style={{ margin: '0.35rem 0 0', color: 'var(--color-text)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#15803d' }} title={`Hash SHA-256: ${item.fileHash}`}>
                    <ShieldCheck size={14} />
                    <span>Integridade SHA-256</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button button--secondary button--small"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem' }}
                      title="Visualizar ou Baixar arquivo do exame"
                    >
                      <Download size={14} />
                      Abrir
                    </a>

                    {canEdit && (
                      <button
                        type="button"
                        className="button button--ghost button--small"
                        onClick={() => handleDeactivate(item.id, item.title)}
                        style={{ color: 'var(--color-danger)', padding: '0.25rem 0.5rem' }}
                        title="Inativar anexo"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Envio de Exame */}
      {showUploadModal && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-upload-title">
          <button
            type="button"
            className="modal__backdrop"
            aria-label="Fechar"
            onClick={() => {
              setShowUploadModal(false);
              resetForm();
            }}
          />
          <div className="modal__content modal__content--large" style={{ maxWidth: '640px' }}>
            <header className="modal__header">
              <div>
                <h2 id="modal-upload-title" style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                  Anexar Exame Anterior ao Prontuário
                </h2>
                <p className="form__hint" style={{ margin: '0.2rem 0 0' }}>
                  Documentação externa com metadados clínicos e valor probatório (Lei 13.787/2018).
                </p>
              </div>
              <button
                type="button"
                className="button button--secondary button--small"
                onClick={() => {
                  setShowUploadModal(false);
                  resetForm();
                }}
              >
                ✕ Fechar
              </button>
            </header>

            <form onSubmit={handleUploadSubmit} className="modal__body">
              {formError && (
                <div className="alert alert--error" role="alert" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Arquivo Selecionado */}
              <div style={{ background: 'var(--color-surface)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FileText size={24} color="var(--color-primary)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)', display: 'block' }}>
                      {selectedFile ? selectedFile.name : 'Nenhum arquivo selecionado'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {selectedFile ? formatFileSize(selectedFile.size) : 'Clique no botão ao lado para escolher'}
                    </span>
                  </div>
                </div>

                <label
                  className="button button--secondary button--small"
                  style={{ cursor: 'pointer', margin: 0 }}
                >
                  Alterar Arquivo
                  <input
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Título do Exame */}
              <div className="form__group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="upload-title" className="form__label">
                  Título / Descrição do Exame *
                </label>
                <input
                  id="upload-title"
                  type="text"
                  className="form__input"
                  placeholder="Ex.: Ultrassonografia Pélvica Transvaginal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Tipo e Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form__group">
                  <label htmlFor="upload-type" className="form__label">
                    Categoria do Exame *
                  </label>
                  <select
                    id="upload-type"
                    className="form__select"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                  >
                    {EXAM_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form__group">
                  <label htmlFor="upload-date" className="form__label">
                    Data de Realização do Exame *
                  </label>
                  <input
                    id="upload-date"
                    type="date"
                    className="form__input"
                    max={new Date().toISOString().slice(0, 10)}
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Laboratório Emissor */}
              <div className="form__group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="upload-lab" className="form__label">
                  Laboratório ou Clínica Emissora (opcional)
                </label>
                <input
                  id="upload-lab"
                  type="text"
                  className="form__input"
                  placeholder="Ex.: Laboratório Marcelo Magalhães, Cerpe, etc."
                  value={labFacility}
                  onChange={(e) => setLabFacility(e.target.value)}
                />
              </div>

              {/* Observações Clínicas */}
              <div className="form__group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="upload-notes" className="form__label">
                  Observações / Conclusão Clínica Relevante (opcional)
                </label>
                <textarea
                  id="upload-notes"
                  className="form__textarea"
                  rows={2}
                  placeholder="Ex.: Achado de nódulo intramural de 1,5cm, endométrio proliferativo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <footer className="modal__footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetForm();
                  }}
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? 'Calculando Hash e Enviando…' : 'Salvar no Prontuário'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
