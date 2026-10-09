import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { patientApi, type PublicDocumentValidation } from '../patientApi';

/**
 * Validação pública de documento clínico por QR Code (link L-14, SPEC-0016/SPEC-0026).
 * Destinada a farmácias e terceiros: exibe apenas autenticidade, sem dado clínico.
 */
export function PatientDocumentValidationPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'ready'; document: PublicDocumentValidation }
    | { status: 'invalid' }
  >({ status: 'loading' });

  useEffect(() => {
    let active = true;
    if (!token) {
      setState({ status: 'invalid' });
      return () => {
        active = false;
      };
    }

    patientApi
      .validatePublicDocument(token)
      .then((document) => {
        if (active) {
          setState({ status: 'ready', document });
        }
      })
      .catch(() => {
        if (active) {
          setState({ status: 'invalid' });
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Validação de documento</h1>
        <p className="patient-page__subtitle">
          Confira a autenticidade do documento clínico apresentado.
        </p>
      </header>

      {state.status === 'loading' ? <p className="patient-help">Verificando documento…</p> : null}

      {state.status === 'invalid' ? (
        <div className="patient-notice patient-notice--error" role="alert">
          Documento não localizado. Confira o código e tente novamente.
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <div className={`patient-validation ${state.document.isValid ? 'is-valid' : 'is-invalid'}`}>
          <p className="patient-validation__status">
            {state.document.isValid ? 'Documento autêntico e válido' : 'Documento cancelado'}
          </p>
          <dl className="patient-validation__data">
            <div>
              <dt>Tipo</dt>
              <dd>{state.document.documentType}</dd>
            </div>
            <div>
              <dt>Profissional</dt>
              <dd>{state.document.doctorName}</dd>
            </div>
            <div>
              <dt>Clínica</dt>
              <dd>{state.document.clinicName}</dd>
            </div>
            <div>
              <dt>Paciente</dt>
              <dd>{state.document.patientInitials}</dd>
            </div>
            {state.document.issuedAt ? (
              <div>
                <dt>Emitido em</dt>
                <dd>{new Date(state.document.issuedAt).toLocaleString('pt-BR')}</dd>
              </div>
            ) : null}
          </dl>
          {state.document.cancellationReason ? (
            <p className="patient-validation__reason">
              Motivo do cancelamento: {state.document.cancellationReason}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
