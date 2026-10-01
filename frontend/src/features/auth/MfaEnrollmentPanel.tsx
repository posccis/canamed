import { useState } from 'react';

import { describeError } from '../agenda/agendaErrors';
import { activateMfa, enrollMfa } from './authApi';

type MfaEnrollmentPanelProps = {
  onActivated: () => void;
  onSignOut: () => void;
};

/**
 * Cadastro obrigatório do segundo fator (RN-011): enquanto não concluído, a clínica não libera as
 * funcionalidades de negócio para o perfil que exige MFA.
 */
export function MfaEnrollmentPanel({ onActivated, onSignOut }: MfaEnrollmentPanelProps) {
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleEnroll() {
    setSending(true);
    setError(null);

    try {
      const enrollment = await enrollMfa();
      setSecret(enrollment.secret);
      setUri(enrollment.otpAuthUri);
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSending(false);
    }
  }

  async function handleActivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      await activateMfa(code.trim());
      onActivated();
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="login">
      <section className="login__card">
        <h1 className="login__title">Verificação em duas etapas</h1>
        <p className="form__hint">
          O seu perfil administra usuários e configurações, por isso exige verificação em duas etapas.
        </p>

        {error ? (
          <div className="alert alert--error" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        {secret === null ? (
          <div className="form">
            <button type="button" className="button button--primary" onClick={() => void handleEnroll()} disabled={sending}>
              {sending ? 'Gerando código…' : 'Começar cadastro'}
            </button>
            <button type="button" className="button button--ghost" onClick={onSignOut}>
              Sair
            </button>
          </div>
        ) : (
          <form className="form" onSubmit={handleActivate}>
            <p className="form__hint">
              Abra o aplicativo autenticador, adicione uma conta e informe o código abaixo. Se preferir, use o
              código manual.
            </p>

            <p className="mfa__uri">{uri}</p>
            <p className="mfa__secret">Código manual: {secret}</p>

            <label className="field">
              <span className="field__label">Código de 6 dígitos</span>
              <input
                className="field__input"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>

            <div className="form__actions">
              <button type="button" className="button button--ghost" onClick={onSignOut}>
                Sair
              </button>
              <button type="submit" className="button button--primary" disabled={sending}>
                {sending ? 'Ativando…' : 'Ativar verificação'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
