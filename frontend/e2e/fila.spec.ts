import { expect, test, type Page } from '@playwright/test';

import { createManagerApi, prepareDay } from './support/api.js';
import { signInAsManager } from './support/session.js';

/**
 * Fila de espera (SPEC-0005) na interface: check-in com hora marcada, chamada, atendimento e
 * fechamento do dia. O horário é criado para um dia futuro, mas o check-in exige o dia de hoje — por
 * isso o cenário usa um encaixe (sem agendamento), que a fila aceita em qualquer momento do dia.
 */
test.describe('Fila de espera', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsManager(page);
  });

  test('encaixe, chamada e conclusão do atendimento', async ({ page }) => {
    await openQueueAsync(page);
    await clearTodayQueueAsync(page);

    await page.getByRole('button', { name: 'Encaixe (sem agendamento)' }).click();

    // Escopo do formulário de encaixe: a barra de filtros também tem os rótulos Paciente/Profissional.
    const walkInForm = page.locator('form', { has: page.getByRole('button', { name: 'Registrar encaixe' }) });

    await selectOptionByText(walkInForm.getByLabel('Paciente'), 'Paciente Sintético');
    await selectOptionByText(walkInForm.getByLabel('Profissional'), 'Dra. Ana');
    await walkInForm.getByLabel('Prioridade').selectOption('preferencial');
    await walkInForm.getByRole('button', { name: 'Registrar encaixe' }).click();

    await expect(page.getByRole('status')).toContainText('Encaixe registrado.');

    const row = page.locator('.agenda__list .agenda__item').filter({ hasText: 'Paciente Sintético Um' }).first();

    await expect(row).toContainText('Preferencial');

    await row.getByRole('button', { name: 'Chamar' }).click();
    await expect(page.getByRole('status')).toContainText('Paciente chamado.');

    await row.getByRole('button', { name: 'Iniciar' }).click();
    await expect(page.getByRole('status')).toContainText('Atendimento iniciado.');

    await row.getByRole('button', { name: 'Finalizar' }).click();
    await expect(page.getByRole('status')).toContainText('Atendimento concluído.');
    await expect(row).toContainText('Atendido');
  });

  test('fechamento do dia devolve o resumo', async ({ page }) => {
    await openQueueAsync(page);

    await page.getByRole('button', { name: 'Fechar o dia' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'fechado:' })).toBeVisible();
  });
});

async function openQueueAsync(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Recepção' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Fila de espera' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /Fila do dia/ })).toBeVisible();
}

/** Limpa a fila do dia via API para o cenário ser repetível. */
async function clearTodayQueueAsync(page: Page): Promise<void> {
  const api = await createManagerApi();

  try {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    await prepareDay(api, date);

    const response = await api.get(`/api/v1/queue?date=${date}`);
    const day = (await response.json()) as { entries: { id: string; status: string }[] };

    for (const entry of day.entries ?? []) {
      if (entry.status === 'aguardando' || entry.status === 'chamado') {
        await api.post(`/api/v1/queue/${entry.id}/leave`, { data: { } });
      }
    }
  } finally {
    await api.dispose();
  }

  await page.getByRole('button', { name: 'Atualizar' }).first().click();
}

async function selectOptionByText(
  select: ReturnType<Page['getByLabel']>,
  text: string,
): Promise<void> {
  const value = await select.locator('option', { hasText: text }).first().getAttribute('value');

  if (value) {
    await select.selectOption(value);
  }
}
