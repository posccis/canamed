import { useCallback, useEffect, useState } from 'react';

import { describeError } from '../agenda/agendaErrors';
import {
  createUser,
  deactivateUser,
  fetchUsers,
  resetUserPassword,
  revokeUserSessions,
  type ManagedUser,
} from './authApi';

const roleLabels: Record<string, string> = {
  gestor: 'Gestor',
  recepcionista: 'Recepção',
  profissional: 'Profissional',
};

/** F-005 — administração dos usuários da clínica ativa, restrita ao gestor. */
export function UsersPanel() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('recepcionista');
  const [resettingUser, setResettingUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      setUsers(await fetchUsers());
      setError(null);
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      await reload();
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1 className="page__title page__title--section">Usuários da clínica</h1>

      {message ? (
        <div className="alert alert--success" role="status">
          <p>{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <section className="card">
        <h2 className="card__title">Novo usuário</h2>

        <form
          className="form form--inline"
          onSubmit={(event) => {
            event.preventDefault();
            void run(
              () =>
                createUser({
                  name: name.trim(),
                  email: email.trim(),
                  password,
                  role,
                  professionalId: null,
                }),
              'Usuário criado. A senha inicial deve ser trocada no primeiro acesso.',
            ).then(() => {
              setName('');
              setEmail('');
              setPassword('');
            });
          }}
        >
          <label className="field">
            <span className="field__label">Nome</span>
            <input
              className="field__input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={200}
            />
          </label>

          <label className="field">
            <span className="field__label">E-mail</span>
            <input
              className="field__input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Senha inicial</span>
            <input
              className="field__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              required
            />
          </label>

          <label className="field field--short">
            <span className="field__label">Papel</span>
            <select className="field__input" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="gestor">Gestor</option>
              <option value="recepcionista">Recepção</option>
              <option value="profissional">Profissional</option>
            </select>
          </label>

          <button type="submit" className="button button--primary" disabled={saving}>
            Criar usuário
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card__title">Usuários vinculados</h2>

        {loading ? <div className="skeleton"><div className="skeleton__row" /></div> : null}

        {!loading && users.length === 0 ? <p className="empty">Nenhum usuário vinculado a esta clínica.</p> : null}

        {users.length > 0 ? (
          <ul className="agenda__list">
            {users.map((user) => (
              <li key={user.id} className="agenda__item">
                <div className="agenda__details">
                  <p className="agenda__patient">{user.name}</p>
                  <p className="agenda__meta">
                    {user.email} • {roleLabels[user.role] ?? user.role} • {user.activeSessions} sessão(ões) ativa(s)
                    {user.mfaEnabled ? ' • 2 etapas ativo' : ''}
                  </p>
                </div>
                <span className={`badge ${user.isActive ? 'badge--confirmado' : 'badge--cancelado'}`}>
                  {user.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <div className="agenda__actions">
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => {
                      setResettingUser(user);
                      setNewPassword('');
                    }}
                  >
                    Redefinir senha
                  </button>
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() =>
                      void run(() => revokeUserSessions(user.id), 'Sessões revogadas.')
                    }
                  >
                    Revogar sessões
                  </button>
                  {user.isActive ? (
                    <button
                      type="button"
                      className="button button--link"
                      onClick={() => void run(() => deactivateUser(user.id), 'Usuário desativado.')}
                    >
                      Desativar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {resettingUser ? (
        <section className="card">
          <h2 className="card__title">Redefinir senha de {resettingUser.name}</h2>

          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => resetUserPassword(resettingUser.id, newPassword),
                'Senha redefinida. As sessões do usuário foram revogadas.',
              ).then(() => {
                setResettingUser(null);
                setNewPassword('');
              });
            }}
          >
            <label className="field">
              <span className="field__label">Nova senha (mínimo 12 caracteres)</span>
              <input
                className="field__input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={12}
                required
              />
            </label>
            <button type="submit" className="button button--primary" disabled={saving}>
              Salvar
            </button>
            <button type="button" className="button button--ghost" onClick={() => setResettingUser(null)}>
              Cancelar
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
