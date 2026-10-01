import { expect, test } from '@playwright/test';

import { signInAsManager } from './support/session.js';

/** F-001 e F-002 da SPEC-0003: entrada com senha, segundo fator e proteção do sistema. */
test.describe('Login e sessão', () => {
  test('recusa credencial inválida sem revelar se a conta existe', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('E-mail').fill('nao-existe@canamed.local');
    await page.getByLabel('Senha', { exact: true }).fill('senha-errada-123456');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos.');
  });

  test('exige login antes de qualquer funcionalidade', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Novo agendamento', exact: true })).toHaveCount(0);
  });

  test('autentica o gestor, concluindo o segundo fator quando necessário', async ({ page }) => {
    await signInAsManager(page);

    await expect(page.getByRole('heading', { level: 1, name: 'CANA MED' })).toBeVisible();
  });

  test('encerra a sessão ao sair', async ({ page }) => {
    await signInAsManager(page);
    await page.getByRole('button', { name: 'Sair' }).click();

    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });
});
