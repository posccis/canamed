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
        <article className="patient-document">
          <h2 className="patient-document__type">{document.documentType}</h2>
          <p className="patient-document__meta">
            Emitido em {new Date(document.createdAt).toLocaleString('pt-BR')}
          </p>
          <pre className="patient-document__content">{document.contentPayload}</pre>
          <a
            className="patient-action"
            href={`/api/v1/medical-documents/public/validate-document/${document.publicToken}/download`}
            target="_blank"
            rel="noreferrer"
          >
            Baixar PDF
          </a>
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
