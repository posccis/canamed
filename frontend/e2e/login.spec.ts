import { expect, test } from '@playwright/test';

import { signInAsManager } from './support/session.js';

/** F-001 e F-002 da SPEC-0003: entrada com senha, segundo fator e proteção do sistema. */
test.describe('Login e sessão', () => {
  test('recusa credencial inválida sem revelar se a conta existe', async ({ page }) => {
    await page.goto('/app');

    await page.locator('input[type="email"]').waitFor({ state: 'visible' });
    await page.locator('input[type="email"]').fill('nao-existe@canamed.local');
    await page.locator('input[type="password"]').fill('senha-errada-123456');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('.alert--error, [role="alert"]')).toContainText(/inválid/i);
  });

  test('exige login antes de qualquer funcionalidade', async ({ page }) => {
    await page.goto('/app');

    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Novo agendamento', exact: true })).toHaveCount(0);
  });

  test('autentica o gestor, concluindo o segundo fator quando necessário', async ({ page }) => {
    await signInAsManager(page);

    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('encerra a sessão ao sair', async ({ page }) => {
    await signInAsManager(page);
    await page.locator('#profile-button').click();
    await page.getByRole('menuitem', { name: /Encerrar Sessão/i }).click();

    // O logout redireciona para a página inicial pública
    await expect(page.getByRole('button', { name: /Sou da equipe da clínica/i })).toBeVisible();
  });
});
