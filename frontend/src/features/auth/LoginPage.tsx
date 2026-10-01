import { useState } from 'react';

import { describeError } from '../agenda/agendaErrors';
import { login, loginWithMfa } from './authApi';

type LoginPageProps = {
  onAuthenticated: () => void;
  notice?: string;
};

/** Tela de entrada: e-mail e senha, com passo adicional de segundo fator quando exigido (F-001 e F-002). */
export function LoginPage({ onAuthenticated, notice }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const result = await login(email.trim(), password);

      if (result.mfaRequired && result.challengeId) {
        setChallengeId(result.challengeId);
        setPassword('');
        return;
      }

      onAuthenticated();
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSending(false);
    }
  }

  async function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!challengeId) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      await loginWithMfa(challengeId, code.trim());
      onAuthenticated();
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="login">
      <section className="login__card">
        <h1 className="login__title">CANA MED</h1>
        <p className="page__tagline">Eficiência para quem mais precisa.</p>

        {notice ? (
          <div className="alert alert--success" role="status">
            <p>{notice}</p>
          </div>
        ) : null}

        {challengeId === null ? (
          <form className="form" onSubmit={handlePasswordSubmit}>
            <label className="field">
              <span className="field__label">E-mail</span>
              <input
                className="field__input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="field">
              <span className="field__label">Senha</span>
              <input
                className="field__input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? (
              <div className="alert alert--error" role="alert">
                <p>{error}</p>
              </div>
            ) : null}

            <button type="submit" className="button button--primary" disabled={sending}>
              {sending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleCodeSubmit}>
            <p className="form__hint">
              Informe o código de 6 dígitos do aplicativo autenticador. O código expira a cada 30 segundos.
            </p>

            <label className="field">
              <span className="field__label">Código de verificação</span>
              <input
                className="field__input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
                autoFocus
              />
            </label>

            {error ? (
              <div className="alert alert--error" role="alert">
                <p>{error}</p>
              </div>
            ) : null}

            <div className="form__actions">
              <button type="button" className="button button--ghost" onClick={() => setChallengeId(null)}>
                Voltar
              </button>
              <button type="submit" className="button button--primary" disabled={sending}>
                {sending ? 'Verificando…' : 'Verificar'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
