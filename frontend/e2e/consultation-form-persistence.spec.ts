import { expect, test, type Page } from '@playwright/test';

const DOCTOR_EMAIL = 'medico@canamed.local';
const DEFAULT_PASSWORD = 'AdminCanamed2026!#';

/**
 * Autenticação específica para o perfil médico (Profissional de Saúde).
 */
async function loginAsDoctor(page: Page): Promise<void> {
  await page.goto('/medico');
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('input[type="email"]').fill(DOCTOR_EMAIL);
  await page.locator('input[type="password"]').fill(DEFAULT_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.locator('.doctor-topbar')).toBeVisible({ timeout: 15000 });
}

/**
 * Teste E2E focado estritamente no formulário de atendimento médico (DoctorWorkspace)
 * para comprovar que os dados preenchidos pela médica não são resetados/sobrescritos
 * pelos ciclos de atualização automática (polling a cada 10 segundos).
 */
test.describe('Consultório Médico - Preservação do Formulário', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
  });

  test('campos de anamnese/SOAP permanecem inalterados após ciclos de polling', async ({ page }) => {
    // Acessa o consultório virtual da médica
    await page.goto('/medico/consultorio');
    await expect(page.getByText('Meu Consultório Virtual')).toBeVisible({ timeout: 15_000 });

    // Localiza o campo de evolução subjetiva (S)
    const subjectiveArea = page.getByPlaceholder(/Relato dos sintomas pelo paciente/i);
    await expect(subjectiveArea).toBeVisible({ timeout: 15_000 });

    const testText = 'Sintomas ginecológicos digitados pela médica em teste de integridade ' + Date.now();
    await subjectiveArea.fill(testText);

    // Localiza o campo de avaliação/diagnóstico (A)
    const assessmentArea = page.getByPlaceholder(/Hipóteses diagnósticas principais/i);
    const testAssessment = 'Avaliação clínica especializada sem perda de dados ' + Date.now();
    await assessmentArea.fill(testAssessment);

    // Aguarda 12 segundos para passar pelo ciclo de polling de 10s do workspace
    await page.waitForTimeout(12_000);

    // Comprova que os campos NÃO foram resetados ou apagados
    await expect(subjectiveArea).toHaveValue(testText);
    await expect(assessmentArea).toHaveValue(testAssessment);
  });
});
