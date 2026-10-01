import { apiGet, apiPost } from '../../api/client';
import type { components } from '../../api/schema';

export type Session = components['schemas']['SessionResponse'];
export type LoginResult = components['schemas']['LoginResponse'];
export type ManagedUser = components['schemas']['UserResponse'];
export type MfaEnrollment = components['schemas']['MfaEnrollResponse'];

/** F-001 — autentica por e-mail e senha. */
export function login(email: string, password: string, signal?: AbortSignal): Promise<LoginResult> {
  return apiPost<LoginResult>('/auth/login', { email, password }, signal);
}

/** F-002 — conclui o login com o código do segundo fator. */
export function loginWithMfa(challengeId: string, code: string, signal?: AbortSignal): Promise<LoginResult> {
  return apiPost<LoginResult>('/auth/login/mfa', { challengeId, code }, signal);
}

/** F-004 — encerra a sessão corrente. */
export function logout(signal?: AbortSignal): Promise<void> {
  return apiPost<void>('/auth/logout', undefined, signal);
}

/** Estado da sessão corrente. */
export function fetchSession(signal?: AbortSignal): Promise<Session> {
  return apiGet<Session>('/auth/session', signal);
}

/** F-003 — inicia o cadastro do segundo fator. */
export function enrollMfa(signal?: AbortSignal): Promise<MfaEnrollment> {
  return apiPost<MfaEnrollment>('/auth/mfa/enroll', undefined, signal);
}

/** F-003 — ativa o segundo fator com um código válido. */
export function activateMfa(code: string, signal?: AbortSignal): Promise<Session> {
  return apiPost<Session>('/auth/mfa/activate', { code }, signal);
}

/** Troca a própria senha. */
export function changePassword(currentPassword: string, newPassword: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>('/auth/password', { currentPassword, newPassword }, signal);
}

/** F-005 — lista os usuários da clínica ativa. */
export function fetchUsers(signal?: AbortSignal): Promise<ManagedUser[]> {
  return apiGet<ManagedUser[]>('/users', signal);
}

/** F-005 — cria um usuário na clínica ativa. */
export function createUser(
  request: components['schemas']['CreateUserRequest'],
  signal?: AbortSignal,
): Promise<ManagedUser> {
  return apiPost<ManagedUser>('/users', request, signal);
}

/** F-005 — redefine a senha de um usuário da clínica. */
export function resetUserPassword(userId: string, newPassword: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/users/${userId}/password`, { newPassword }, signal);
}

/** F-005 — desativa um usuário da clínica. */
export function deactivateUser(userId: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/users/${userId}/deactivate`, undefined, signal);
}

/** F-004 — revoga todas as sessões de um usuário. */
export function revokeUserSessions(userId: string, signal?: AbortSignal): Promise<void> {
  return apiPost<void>(`/users/${userId}/sessions/revoke`, undefined, signal);
}
