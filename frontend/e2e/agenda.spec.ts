import { expect, test, type Page } from '@playwright/test';

import { createManagerApi, prepareDay } from './support/api.js';
import { signInAsManager } from './support/session.js';

const dateTimeLabel = 'Data e hora (horário de Brasília/Fortaleza)';

/** Escopo do diálogo aberto, evitando colisão com botões de mesmo nome na página. */
function dialog(page: Page) {
  return page.getByRole('dialog');
}

/** Lista de agendamentos ativos (exclui bloqueios e cancelados, que aparecem em seções próprias). */
function activeList(page: Page) {
  return page.locator('.agenda__list').first();
}

/** Prepara o dia pela API e recarrega a agenda na interface. */
async function prepare(page: Page, dayOffset: number): Promise<void> {
  const api = await createManagerApi();

  try {
    await prepareDay(api, dateValue(dayOffset));
  } finally {
    await api.dispose();
  }

  await page.getByRole('button', { name: 'Atualizar' }).click();
}

/** Fluxos F-001 a F-004 da SPEC-0002 executados na interface, com sessão real. */
test.describe('Agenda de consultas', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsManager(page);
  });

  test('F-004: mostra o estado vazio em um dia sem agendamentos', async ({ page }) => {
    await selectDate(page, 300);

    await expect(page.getByText('Nenhum agendamento para esta data.')).toBeVisible();
  });

  test('F-001: cria um agendamento e ele aparece na agenda do dia', async ({ page }) => {
    await selectDate(page, 40);
    await prepare(page, 40);

    await createAppointment(page, 40, '14:00');

    await expect(activeList(page).getByText('Paciente Sintético Um')).toBeVisible();
    await expect(activeList(page).getByText('14:00 – 14:30')).toBeVisible();
    await expect(activeList(page).getByText('Agendado')).toBeVisible();
  });

  test('F-001: recusa horário ocupado e sugere horários livres', async ({ page }) => {
    await selectDate(page, 41);
    await prepare(page, 41);
    await createAppointment(page, 41, '13:00');

    await page.getByRole('button', { name: 'Novo agendamento', exact: true }).click();
    await dialog(page).getByLabel(dateTimeLabel, { exact: true }).fill(`${dateValue(41)}T13:15`);
    await dialog(page).getByRole('button', { name: 'Agendar' }).click();

    const alert = page.getByRole('alert').filter({ hasText: 'já está ocupado' });

    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Horários livres próximos');

    await dialog(page).getByRole('button', { name: 'Cancelar', exact: true }).click();
  });

  test('F-002: remarca o agendamento para um horário livre', async ({ page }) => {
    await selectDate(page, 42);
    await prepare(page, 42);
    await createAppointment(page, 42, '09:00');

    await page.getByRole('button', { name: 'Remarcar' }).first().click();
    await dialog(page).getByLabel('Novo horário (horário de Brasília/Fortaleza)', { exact: true }).fill(`${dateValue(42)}T16:30`);
    await dialog(page).getByRole('button', { name: 'Confirmar remarcação' }).click();

    await expect(page.getByRole('status')).toContainText('Agendamento remarcado.');
    await expect(activeList(page).getByText('16:30 – 17:00')).toBeVisible();
  });

  test('F-003: exige motivo e cancela liberando o horário', async ({ page }) => {
    await selectDate(page, 43);
    await prepare(page, 43);
    await createAppointment(page, 43, '11:00');

    await page.getByRole('button', { name: 'Cancelar', exact: true }).first().click();
    await dialog(page).getByRole('button', { name: 'Confirmar cancelamento' }).click();

    await expect(page.getByRole('alert')).toContainText('Informe o motivo do cancelamento.');

    await dialog(page).getByLabel('Motivo do cancelamento').fill('Paciente solicitou por telefone');
    await dialog(page).getByRole('button', { name: 'Confirmar cancelamento' }).click();

    await expect(page.getByRole('status')).toContainText('Agendamento cancelado.');
  });

  test('RN-011: bloqueia o intervalo e impede novo agendamento nele', async ({ page }) => {
    await selectDate(page, 44);
    await prepare(page, 44);

    await page.getByRole('button', { name: 'Bloquear horário' }).click();
    await dialog(page).getByLabel('Início do bloqueio').fill(`${dateValue(44)}T08:00`);
    await dialog(page).getByLabel('Fim do bloqueio').fill(`${dateValue(44)}T09:00`);
    await dialog(page).getByLabel('Motivo (opcional)').fill('Reunião clínica');
    await dialog(page).getByRole('button', { name: 'Bloquear horário' }).click();

    await expect(page.getByRole('status')).toContainText('Horário bloqueado.');
    await expect(page.getByText('Indisponível').first()).toBeVisible();

    await page.getByRole('button', { name: 'Novo agendamento', exact: true }).click();
    await dialog(page).getByLabel(dateTimeLabel, { exact: true }).fill(`${dateValue(44)}T08:30`);
    await dialog(page).getByRole('button', { name: 'Agendar' }).click();

    await expect(dialog(page).getByRole('alert').filter({ hasText: 'indisponível' })).toBeVisible();
  });
});

async function createAppointment(page: Page, dayOffset: number, time: string): Promise<void> {
  await page.getByRole('button', { name: 'Novo agendamento', exact: true }).click();
  // Seleciona o paciente sintético do seed, independentemente de outros pacientes de desenvolvimento.
  const patientSelect = dialog(page).getByLabel('Paciente');
  const syntheticPatient = await patientSelect
    .locator('option', { hasText: 'Paciente Sintético' })
    .first()
    .getAttribute('value');

  if (syntheticPatient) {
    await patientSelect.selectOption(syntheticPatient);
  }

  // O tipo padrão do catálogo é o primeiro em ordem alfabética; fixamos "Consulta" (30 min) para que
  // as asserções de duração sejam determinísticas.
  const typeSelect = dialog(page).getByLabel('Tipo de atendimento');
  const consultationValue = await typeSelect
    .locator('option', { hasText: 'Consulta' })
    .first()
    .getAttribute('value');

  await typeSelect.selectOption(consultationValue ?? { index: 0 });
  await dialog(page).getByLabel(dateTimeLabel, { exact: true }).fill(`${dateValue(dayOffset)}T${time}`);
  await dialog(page).getByRole('button', { name: 'Agendar' }).click();
  await expect(page.getByRole('status')).toContainText('Agendamento criado.');
}

async function selectDate(page: Page, dayOffset: number): Promise<void> {
  await page.getByLabel('Data', { exact: true }).fill(dateValue(dayOffset));
  await expect(page.getByRole('heading', { level: 2, name: /Agenda de/ })).toBeVisible();
}

/** Data no formato aceito pelo campo `date`, deslocada em dias a partir de hoje. */
function dateValue(dayOffset: number): string {
  const now = new Date();
  const target = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset));

  return target.toISOString().slice(0, 10);
}
