import { request, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { generateTotp } from './totp.js';

// A base é a raiz da API: caminhos absolutos substituem o caminho da base na resolução de URL.
const apiBaseUrl = 'http://localhost:5080';
const apiPrefix = '/api/v1';
const secretFile = fileURLToPath(new URL('../.state/mfa-secret.txt', import.meta.url));

type AgendaDay = {
  appointments: { id: string; status: string }[];
};

/** Cria um contexto de API autenticado como gestor sintético (incluindo o segundo fator). */
export async function createManagerApi(): Promise<APIRequestContext> {
  const email = process.env.CANAMED_E2E_EMAIL ?? '';
  const password = process.env.CANAMED_E2E_PASSWORD ?? '';

  const api = await request.newContext({
    baseURL: apiBaseUrl,
    extraHTTPHeaders: { 'X-Canamed-Requested-With': 'canamed-spa' },
  });

  const login = await api.post(`${apiPrefix}/auth/login`, { data: { email, password } });

  if (!login.ok()) {
    throw new Error(`Login pela API falhou: ${login.status()} ${await login.text()}`);
  }

  const payload = (await login.json()) as { mfaRequired: boolean; challengeId?: string };

  if (payload.mfaRequired) {
    const secret = readFileSync(secretFile, 'utf8').trim();
    const mfa = await api.post(`${apiPrefix}/auth/login/mfa`, {
      data: { challengeId: payload.challengeId, code: generateTotp(secret) },
    });

    if (!mfa.ok()) {
      throw new Error(`Segundo fator recusado: ${mfa.status()} ${await mfa.text()}`);
    }
  }

  return api;
}

/**
 * Cancela os agendamentos ativos de um dia para que o cenário seja repetível em execuções
 * sucessivas. Cancelar é a operação de negócio correta: o horário volta a ficar livre e o histórico
 * é preservado (RN-006).
 */
export async function prepareDay(api: APIRequestContext, date: string): Promise<void> {
  const response = await api.get(`${apiPrefix}/appointments?date=${date}`);

  if (!response.ok()) {
    throw new Error(`Consulta da agenda pela API falhou: ${response.status()}`);
  }

  const day = (await response.json()) as AgendaDay;

  for (const appointment of day.appointments ?? []) {
    if (appointment.status === 'agendado' || appointment.status === 'confirmado') {
      const cancel = await api.post(`${apiPrefix}/appointments/${appointment.id}/cancel`, {
        data: { reason: 'limpeza automática do cenário de teste' },
      });

      if (!cancel.ok()) {
        throw new Error(`Cancelamento de preparação falhou: ${cancel.status()}`);
      }
    }
  }
}
