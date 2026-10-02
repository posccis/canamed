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
  const [showPassword, setShowPassword] = useState(false);
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
      <section className="login__card" aria-labelledby="login-heading">
        <div className="login__brand">
          <div className="login__logo-wrapper">
            <img
              src="/assets/brand/canadamed_logogrande_comtitulo-removebg-preview.png"
              alt="CANA MED — Eficiência Para Quem Mais Precisa"
              className="login__logo-large"
            />
          </div>
          <h1 id="login-heading" className="visually-hidden">
            CANA MED
          </h1>
          <p className="login__tagline">Eficiência para quem mais precisa.</p>
        </div>

        {notice ? (
          <div className="alert alert--success" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>{notice}</p>
          </div>
        ) : null}

        {challengeId === null ? (
          <form className="form login__form" onSubmit={handlePasswordSubmit}>
            <div className="login__form-header">
              <h2 className="login__form-title">Acesse sua conta</h2>
              <p className="login__form-desc">Digite suas credenciais corporativas para entrar</p>
            </div>

            <label className="field">
              <span className="field__label">E-mail institucional</span>
              <div className="login__input-with-icon">
                <svg
                  className="login__field-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  className="field__input login__input"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu.nome@clinica.com.br"
                  required
                  autoFocus
                />
              </div>
            </label>

            <label className="field">
              <span className="field__label">Senha de acesso</span>
              <div className="login__input-with-icon">
                <svg
                  className="login__field-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  className="field__input login__input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  className="login__toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {error ? (
              <div className="alert alert--error" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
              </div>
            ) : null}

            <button type="submit" className="button button--primary login__submit" disabled={sending}>
              {sending ? (
                <>
                  <span className="login__spinner" aria-hidden="true" />
                  <span>Entrando…</span>
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        ) : (
          <form className="form login__form" onSubmit={handleCodeSubmit}>
            <div className="login__form-header">
              <div className="login__mfa-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 className="login__form-title">Verificação de Segurança</h2>
              <p className="login__form-desc">
                Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
              </p>
            </div>

            <label className="field">
              <span className="field__label">Código de verificação (TOTP)</span>
              <input
                className="field__input login__input-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                autoFocus
              />
            </label>

            {error ? (
              <div className="alert alert--error" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{error}</p>
              </div>
            ) : null}

            <div className="form__actions login__mfa-actions">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  setChallengeId(null);
                  setError(null);
                }}
              >
                Voltar
              </button>
              <button type="submit" className="button button--primary" disabled={sending || code.length < 6}>
                {sending ? 'Verificando…' : 'Verificar'}
              </button>
            </div>
          </form>
        )}

        <div className="login__footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Ambiente Seguro • Em conformidade com a LGPD</span>
        </div>
      </section>
    </main>
  );
}
