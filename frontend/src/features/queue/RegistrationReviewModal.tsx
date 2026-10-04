import { useCallback, useEffect, useState } from 'react';
import { patientApi, type PendingRegistrationReviewDto } from '../patient/patientApi';

interface RegistrationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewCompleted?: () => void;
}

interface ParsedRegistrationForm {
  name?: string;
  document?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  healthPlanName?: string;
  healthPlanCardNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  chronicConditions?: string;
  consentTerms?: boolean;
}

export function RegistrationReviewModal({
  isOpen,
  onClose,
  onReviewCompleted,
}: RegistrationReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<PendingRegistrationReviewDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await patientApi.listPendingRegistrationReviews();
      const safeList = Array.isArray(data) ? data : [];
      setReviews(safeList);
      setSelectedId((prev) => (prev && safeList.some((r) => r.draftId === prev) ? prev : safeList[0]?.draftId ?? null));
    } catch {
      setNotice({ type: 'error', message: 'Erro ao carregar cadastros pendentes.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadReviews();
      setShowReturnInput(false);
      setReturnNote('');
    }
  }, [isOpen, loadReviews]);

  if (!isOpen) return null;

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const currentReview = safeReviews.find((r) => r.draftId === selectedId) ?? safeReviews[0] ?? null;

  let parsed: ParsedRegistrationForm = {};
  if (currentReview?.payloadJson) {
    try {
      parsed = JSON.parse(currentReview.payloadJson);
    } catch {
      // payload não é JSON válido
    }
  }

  const handleApprove = async () => {
    if (!currentReview) return;
    setActionBusy(true);
    setNotice(null);
    try {
      await patientApi.approveRegistrationReview(currentReview.draftId);
      setNotice({ type: 'success', message: `Cadastro de ${currentReview.patientName} aprovado com sucesso!` });
      onReviewCompleted?.();
      const updated = reviews.filter((r) => r.draftId !== currentReview.draftId);
      setReviews(updated);
      setSelectedId(updated[0]?.draftId ?? null);
    } catch {
      setNotice({ type: 'error', message: 'Falha ao aprovar cadastro. Tente novamente.' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleReturn = async () => {
    if (!currentReview) return;
    if (!returnNote.trim()) {
      setNotice({ type: 'error', message: 'Informe a orientação de ajuste para devolver ao paciente.' });
      return;
    }
    setActionBusy(true);
    setNotice(null);
    try {
      await patientApi.returnRegistrationReview(currentReview.draftId, returnNote.trim());
      setNotice({ type: 'success', message: `Cadastro devolvido com orientações para ${currentReview.patientName}.` });
      setShowReturnInput(false);
      setReturnNote('');
      onReviewCompleted?.();
      const updated = reviews.filter((r) => r.draftId !== currentReview.draftId);
      setReviews(updated);
      setSelectedId(updated[0]?.draftId ?? null);
    } catch {
      setNotice({ type: 'error', message: 'Falha ao devolver cadastro. Tente novamente.' });
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-lg, 8px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div>
            <h3 id="review-modal-title" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text)' }}>
              Validação de Cadastros Prévios (F-004 / RN-016)
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              Conferência dos dados enviados pelos pacientes antes do atendimento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--color-muted)',
            }}
          >
            &times;
          </button>
        </div>

        {/* Feedback Alert */}
        {notice && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: notice.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: notice.type === 'success' ? '#15803d' : '#b91c1c',
              borderBottom: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {notice.message}
          </div>
        )}

        {/* Corpo principal */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Coluna Lateral: Lista de Pendências */}
          <aside
            style={{
              width: '320px',
              borderRight: '1px solid var(--color-border)',
              overflowY: 'auto',
              backgroundColor: 'var(--color-surface-subtle, #f9fafb)',
              padding: '0.75rem',
            }}
          >
            <h4 style={{ margin: '0.5rem 0.5rem 0.75rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>
              Pendentes de Conferência ({safeReviews.length})
            </h4>

            {loading && <p style={{ fontSize: '0.875rem', padding: '0.5rem' }}>Carregando pendências…</p>}

            {!loading && safeReviews.length === 0 && (
              <p style={{ fontSize: '0.875rem', padding: '0.5rem', color: 'var(--color-muted)' }}>
                Nenhum cadastro aguardando conferência no momento.
              </p>
            )}

            {safeReviews.map((rev) => {
              const isSelected = rev.draftId === currentReview?.draftId;
              return (
                <button
                  key={rev.draftId}
                  type="button"
                  onClick={() => {
                    setSelectedId(rev.draftId);
                    setShowReturnInput(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-surface)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                    {rev.patientName || 'Paciente'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                    Tel: {rev.patientPhone || 'Não informado'}
                  </div>
                  {rev.submittedAt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                      Enviado em: {new Date(rev.submittedAt).toLocaleDateString('pt-BR')} {new Date(rev.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Coluna Principal: Detalhes do Formulário */}
          <main style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto' }}>
            {!currentReview ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-muted)' }}>
                Selecione um cadastro para visualizar e conferir os dados.
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                    {currentReview.patientName}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                    ID do Paciente: {currentReview.patientId}
                  </span>
                </div>

                {/* Seção 1: Dados Pessoais */}
                <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <legend style={{ fontWeight: 600, color: 'var(--color-primary-dark)', fontSize: '0.875rem' }}>
                    1. Dados Pessoais
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Nome Completo:</span>
                      <strong>{parsed.name || currentReview.patientName || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>CPF:</span>
                      <strong>{parsed.document || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Data de Nascimento:</span>
                      <strong>{parsed.birthDate || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Telefone / WhatsApp:</span>
                      <strong>{parsed.phone || currentReview.patientPhone || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>E-mail:</span>
                      <strong>{parsed.email || '—'}</strong>
                    </div>
                  </div>
                </fieldset>

                {/* Seção 2: Endereço */}
                <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <legend style={{ fontWeight: 600, color: 'var(--color-primary-dark)', fontSize: '0.875rem' }}>
                    2. Endereço Residencial
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>CEP:</span>
                      <strong>{parsed.cep || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Logradouro:</span>
                      <strong>{parsed.street ? `${parsed.street}, nº ${parsed.number || 'S/N'}` : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Complemento:</span>
                      <strong>{parsed.complement || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Bairro:</span>
                      <strong>{parsed.neighborhood || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Cidade / UF:</span>
                      <strong>{parsed.city ? `${parsed.city}/${parsed.state || ''}` : '—'}</strong>
                    </div>
                  </div>
                </fieldset>

                {/* Seção 3: Convênio e Saúde */}
                <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  <legend style={{ fontWeight: 600, color: 'var(--color-primary-dark)', fontSize: '0.875rem' }}>
                    3. Convênio e Histórico Declarado
                  </legend>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Convênio:</span>
                      <strong>{parsed.healthPlanName || 'Particular'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Nº Carteirinha:</span>
                      <strong>{parsed.healthPlanCardNumber || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Contato de Emergência:</span>
                      <strong>{parsed.emergencyContactName ? `${parsed.emergencyContactName} (${parsed.emergencyContactPhone || ''})` : '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)', display: 'block' }}>Alergias:</span>
                      <strong style={{ color: parsed.allergies ? '#dc2626' : 'inherit' }}>
                        {parsed.allergies || 'Nenhuma declarada'}
                      </strong>
                    </div>
                  </div>
                </fieldset>

                {/* Campo de Devolução com Nota */}
                {showReturnInput && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '6px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#9a3412', marginBottom: '0.5rem' }}>
                      Orientação / Motivo do Ajuste Solicitado ao Paciente:
                    </label>
                    <textarea
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #fed7aa',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                      }}
                      placeholder="Ex: Favor conferir o número do CPF digitado ou informar o nome do convênio correto."
                      value={returnNote}
                      onChange={(e) => setReturnNote(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => setShowReturnInput(false)}
                        disabled={actionBusy}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="button button--primary"
                        style={{ backgroundColor: '#c2410c', borderColor: '#c2410c' }}
                        onClick={() => void handleReturn()}
                        disabled={actionBusy}
                      >
                        {actionBusy ? 'Devolvendo…' : 'Confirmar Devolução'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Barra de Ações */}
                {!showReturnInput && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => setShowReturnInput(true)}
                      disabled={actionBusy}
                    >
                      Solicitar Ajustes
                    </button>
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => void handleApprove()}
                      disabled={actionBusy}
                    >
                      {actionBusy ? 'Aprovando…' : 'Aprovar e Consolidar Cadastro'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
