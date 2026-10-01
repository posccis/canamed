import { expect, type Page } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { generateTotp } from './totp.js';

const secretFile = fileURLToPath(new URL('../.state/mfa-secret.txt', import.meta.url));

function readStoredSecret(): string | null {
  try {
    return readFileSync(secretFile, 'utf8').trim() || null;
  } catch {
    return null;
  }
}

function storeSecret(secret: string): void {
  mkdirSync(fileURLToPath(new URL('../.state', import.meta.url)), { recursive: true });
  writeFileSync(secretFile, secret, 'utf8');
}

/**
 * Entra como gestor sintético do `.env`. Cobre os estados possíveis: cadastro pendente de segundo
 * fator (concluído aqui) e segundo fator já habilitado (código calculado pelo segredo guardado).
 */
export async function signInAsManager(page: Page): Promise<void> {
  const email = process.env.CANAMED_E2E_EMAIL ?? '';
  const password = process.env.CANAMED_E2E_PASSWORD ?? '';

  expect(email, 'Defina Canamed__Development__SeedUserEmail no .env').not.toBe('');
  expect(password, 'Defina Canamed__Development__SeedUserPassword no .env').not.toBe('');

  await page.goto('/');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  const agendaButton = page.getByRole('button', { name: 'Agenda', exact: true });
  const codeField = page.getByLabel('Código de verificação');
  const enrollmentHeading = page.getByRole('heading', { name: 'Verificação em duas etapas' });

  await expect(codeField.or(enrollmentHeading).or(agendaButton)).toBeVisible();

  if (await enrollmentHeading.isVisible().catch(() => false)) {
    const secret = await completeEnrollment(page);

    storeSecret(secret);
  } else if (await codeField.isVisible().catch(() => false)) {
    const stored = readStoredSecret();

    expect(
      stored,
      'MFA já habilitado no gestor e o segredo não está em frontend/e2e/.state/mfa-secret.txt',
    ).not.toBeNull();

    await codeField.fill(generateTotp(stored as string));
    await page.getByRole('button', { name: 'Verificar' }).click();
  }

  await expect(agendaButton).toBeVisible();

  // Aguarda o cadastro mínimo carregar: sem profissional, a agenda fica sem ação de agendamento.
  await expect(page.getByRole('button', { name: 'Novo agendamento', exact: true })).toBeEnabled();
}

async function completeEnrollment(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Começar cadastro' }).click();

  const manual = page.locator('.mfa__secret');

  await expect(manual).toBeVisible();

  const secret = ((await manual.textContent()) ?? '').replace('Código manual:', '').trim();

  // O segredo é guardado antes da ativação: se a asserção seguinte falhar, a suíte ainda consegue
  // calcular códigos nas próximas execuções.
  storeSecret(secret);

  await page.getByLabel('Código de 6 dígitos').fill(generateTotp(secret));
  await page.getByRole('button', { name: 'Ativar verificação' }).click();
  await expect(page.getByRole('button', { name: 'Agenda', exact: true })).toBeVisible();

  return secret;
}
