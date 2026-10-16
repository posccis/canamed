import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { patientApi, type MedicalDocumentItem } from '../patientApi';

/**
 * Documento específico com desafio de identidade (link L-13, SPEC-0026/RN-005).
 * O token identifica o documento; o conteúdo só é liberado após o desafio.
 */
export function PatientDocumentPage() {
  const { token } = useParams<{ token: string }>();
  const [answer, setAnswer] = useState('');
  const [document, setDocument] = useState<MedicalDocumentItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUnlock() {
    if (!token || !answer.trim()) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      setDocument(await patientApi.unlockPublicDocument(token, answer.trim()));
    } catch {
      setErrorMessage('Não conseguimos confirmar seus dados. Tente novamente ou fale com a recepção.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Meu documento</h1>
        <p className="patient-page__subtitle">
          Por segurança, confirme seus dados para visualizar o documento.
        </p>
      </header>

      {!document ? (
        <>
          <label className="patient-field">
            <span>Informe os 3 primeiros dígitos do seu CPF ou seu ano de nascimento</span>
            <input
              type="text"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="patient-action patient-action--primary"
            onClick={handleUnlock}
            disabled={busy || !answer.trim()}
          >
            {busy ? 'Verificando…' : 'Ver documento'}
          </button>
        </>
      ) : (
        <article className="patient-document" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '1.5rem', marginTop: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #00695c', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', background: '#00695c', color: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>
                C
              </div>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#1f2937', display: 'block' }}>Cana Med — Clínica Ginecológica</strong>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Documento Clínico Autenticado</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', background: '#e0f2f1', color: '#004d40', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                {document.documentType.replace('_', ' ')}
              </span>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.2rem 0 0' }}>
                Emitido em {new Date(document.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </header>

          <div style={{ padding: '0.5rem 0 1.25rem' }}>
            {(() => {
              try {
                const parsed = JSON.parse(document.contentPayload);
                if (parsed.items && Array.isArray(parsed.items)) {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', margin: 0 }}>
                        Medicamentos Prescritos:
                      </h3>
                      {parsed.items.map((m: any, idx: number) => (
                        <div key={idx} style={{ paddingLeft: '1rem', borderLeft: '2px solid #b2dfdb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <strong style={{ color: '#1f2937', fontSize: '0.95rem' }}>
                              <span style={{ color: '#00695c', marginRight: '0.25rem' }}>{idx + 1}.</span>
                              {m.medication} {m.concentration ? `- ${m.concentration}` : ''}
                            </strong>
                            {m.quantity && (
                              <span style={{ fontSize: '0.8rem', background: '#f3f4f6', color: '#374151', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                                {m.quantity}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#4b5563' }}>
                            <strong>Uso:</strong> {m.route || 'Oral'} — {m.instructions}
                          </p>
                        </div>
                      ))}
                      {parsed.generalInstructions && (
                        <div style={{ marginTop: '0.75rem', background: '#e0f2f1', padding: '0.75rem 1rem', borderRadius: '6px', borderLeft: '3px solid #00695c' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#004d40', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                            Orientações Complementares
                          </strong>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#374151' }}>{parsed.generalInstructions}</p>
                        </div>
                      )}
                    </div>
                  );
                } else if (parsed.justificationText) {
                  return (
                    <div>
                      <p style={{ fontSize: '0.95rem', color: '#1f2937', lineHeight: 1.6 }}>{parsed.justificationText}</p>
                      {parsed.leaveDays && (
                        <p style={{ fontSize: '0.9rem', color: '#00695c', fontWeight: 600, marginTop: '0.5rem' }}>
                          Período de afastamento: {parsed.leaveDays} dia(s).
                        </p>
                      )}
                    </div>
                  );
                } else if (parsed.exams) {
                  return (
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#1f2937', display: 'block', marginBottom: '0.5rem' }}>Exames Solicitados:</strong>
                      <pre style={{ fontFamily: 'inherit', fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {parsed.exams}
                      </pre>
                      {parsed.indication && (
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem' }}>
                          <strong>Indicação:</strong> {parsed.indication}
                        </p>
                      )}
                    </div>
                  );
                }
              } catch {
                // Conteúdo simples
              }
              return <pre className="patient-document__content">{document.contentPayload}</pre>;
            })()}
          </div>

          <footer style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Código de Verificação: <code style={{ color: '#00695c', fontWeight: 700 }}>{document.publicToken}</code>
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                className="patient-action patient-action--primary"
                href={`/api/v1/public/validate-document/${document.publicToken}/download`}
                target="_blank"
                rel="noreferrer"
                download={`canamed-${document.documentType}-${document.publicToken.slice(0, 8)}.pdf`}
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                📥 Baixar PDF Autenticado
              </a>
            </div>
          </footer>
        </article>
      )}

      {errorMessage ? (
        <div className="patient-notice patient-notice--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <p className="patient-help">Precisa de ajuda? Ligue para a recepção da clínica.</p>
    </section>
  );
}
