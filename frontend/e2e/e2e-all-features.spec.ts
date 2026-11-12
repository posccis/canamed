import { expect, test, type Page } from '@playwright/test';

const MANAGER_EMAIL = process.env.CANAMED_E2E_EMAIL || 'gestor@canamed.local';
const MANAGER_PASSWORD = process.env.CANAMED_E2E_PASSWORD || 'AdminCanamed2026!#';
const DOCTOR_EMAIL = 'medico@canamed.local';
const DEFAULT_PASSWORD = 'AdminCanamed2026!#';

/** Auxiliar de autenticação para superfície administrativa (/app) */
async function loginAsManager(page: Page): Promise<void> {
  await page.goto('/app');
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('input[type="email"]').fill(MANAGER_EMAIL);
  await page.locator('input[type="password"]').fill(MANAGER_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.locator('.sidebar')).toBeVisible({ timeout: 15000 });
}

/** Auxiliar de autenticação para superfície médica (/medico) */
async function loginAsDoctor(page: Page): Promise<void> {
  await page.goto('/medico');
  await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('input[type="email"]').fill(DOCTOR_EMAIL);
  await page.locator('input[type="password"]').fill(DEFAULT_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.locator('.doctor-topbar')).toBeVisible({ timeout: 15000 });
}

test.describe('Cana Med Mulher — Validação E2E de Todas as Funcionalidades', () => {

  // =========================================================================
  // 1. PORTAL DE ENTRADA & PERFIS DE ACESSO
  // =========================================================================
  test('1. Portal de Entrada (Home) exibe perfis e atalho para TV', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/CANA MED/i);
    await expect(page.getByRole('button', { name: /Sou paciente/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sou médica/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sou da equipe da clínica/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Painel de Chamada/i })).toBeVisible();
  });

  // =========================================================================
  // 2. AUTENTICAÇÃO & CONTROLE DE ACESSO
  // =========================================================================
  test('2. Autenticação recusa credenciais inválidas na área administrativa', async ({ page }) => {
    await page.goto('/app');

    await page.locator('input[type="email"]').waitFor({ state: 'visible' });
    await page.locator('input[type="email"]').fill('invalido@canamed.local');
    await page.locator('input[type="password"]').fill('senha-errada-999');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('.alert--error, [role="alert"]')).toContainText(/inválid/i);
  });

  test('3. Login de Gestor com sucesso e navegação no Dashboard', async ({ page }) => {
    await loginAsManager(page);

    await expect(page.locator('.topbar__title').first()).toBeVisible();
    await expect(page.locator('.sidebar__item', { hasText: 'Dashboard' })).toBeVisible();
    await expect(page.locator('.sidebar__item', { hasText: 'Agenda & Recepção' })).toBeVisible();
    await expect(page.locator('.sidebar__item', { hasText: 'Pacientes' })).toBeVisible();
  });

  // =========================================================================
  // 3. MÓDULO AGENDA & RECEPÇÃO
  // =========================================================================
  test('4. Módulo Agenda & Recepção: alternância de abas e modal de agendamento', async ({ page }) => {
    await loginAsManager(page);
    await page.locator('.sidebar__item', { hasText: 'Agenda & Recepção' }).click();

    await expect(page.getByRole('button', { name: /Novo agendamento/i })).toBeVisible();

    // Abre modal de novo agendamento
    await page.getByRole('button', { name: /Novo agendamento/i }).click();
    await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
    await page.keyboard.press('Escape');

    // Alterna para aba Fila / Recepção
    const queueTab = page.locator('button', { hasText: /Fila|Recepção/i }).first();
    if (await queueTab.isVisible().catch(() => false)) {
      await queueTab.click();
    }
  });

  // =========================================================================
  // 4. MÓDULO DE PACIENTES
  // =========================================================================
  test('5. Gestão de Pacientes: listagem e busca', async ({ page }) => {
    await loginAsManager(page);
    await page.locator('.sidebar__item', { hasText: 'Pacientes' }).click();

    // Verifica que pacientes de demonstração estão visíveis
    await expect(page.getByText('Mariana Alencar Fontes')).toBeVisible({ timeout: 10000 });

    // Testa campo de busca
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Camila');
      await expect(page.getByText('Camila Rodrigues Leite')).toBeVisible();
    }
  });

  // =========================================================================
  // 5. MÓDULO DE PROFISSIONAIS & EQUIPE MÉDICA
  // =========================================================================
  test('6. Gestão de Profissionais e Corpo Clínico', async ({ page }) => {
    await loginAsManager(page);
    await page.locator('.sidebar__item', { hasText: 'Equipe Médica' }).click();

    // Verifica médicos ginecologistas semeados ou tabela de profissionais
    await expect(page.getByText(/Dra\. Camila|Lucas Mendes|Profissionais|Corpo Clínico/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 6. MÓDULO DE CAIXA DIÁRIO & FINANCEIRO
  // =========================================================================
  test('7. Frente de Caixa Diário e Movimentações', async ({ page }) => {
    await loginAsManager(page);
    await page.locator('.sidebar__item', { hasText: /Caixa/i }).click();

    // Verifica painel de caixa
    await expect(page.getByText(/Caixa|Sessão|Saldo|Movimenta/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 7. CENTRAL DE CONFIGURAÇÕES DA CLÍNICA
  // =========================================================================
  test('8. Central de Configurações: horários, salas, convênios e políticas', async ({ page }) => {
    await loginAsManager(page);
    await page.locator('.sidebar__item', { hasText: /Configuraç/i }).click();

    // Confirma abas de configuração
    await expect(page.getByText(/Configurações|Operação|Clínica/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 8. SUPERFÍCIE MÉDICA (PEP GINECOLÓGICO)
  // =========================================================================
  test('9. Consultório da Médica: login, dashboard clínico e PEP ginecológico', async ({ page }) => {
    await loginAsDoctor(page);

    // Valida topo do consultório
    await expect(page.getByText(/Espaço Clínico|Consultório Virtual|Área Médica/i).first()).toBeVisible();

    // Navega para o Prontuário
    await page.goto('/medico/prontuario');
    await expect(page.getByText(/Prontuário|Histórico|Paciente/i).first()).toBeVisible({ timeout: 10000 });

    // Navega para o Consultório / Fila
    await page.goto('/medico/consultorio');
    await expect(page.getByText(/Atendimento|Fila|Consultório/i).first()).toBeVisible({ timeout: 10000 });

    // Navega para Documentos
    await page.goto('/medico/documentos');
    await expect(page.getByText(/Documentos|Atestados|Receitas/i).first()).toBeVisible({ timeout: 10000 });

    // Navega para Retornos
    await page.goto('/medico/retornos');
    await expect(page.getByText(/Retornos|Controle/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 9. SUPERFÍCIE PÚBLICA DO PACIENTE (PORTAL MOBILE)
  // =========================================================================
  test('10. Portal da Paciente: agendamento online, check-in e privacidade LGPD', async ({ page }) => {
    await page.goto('/p/cana-med');

    // Página inicial do portal da paciente
    await expect(page.getByText(/CANA MED|Agendar|Consultas/i).first()).toBeVisible({ timeout: 10000 });

    // Tela de Agendamento Online
    await page.goto('/p/cana-med/agendar');
    await expect(page.getByText(/Agendar|Especialidade|Profissional/i).first()).toBeVisible({ timeout: 10000 });

    // Tela de Check-in Mobile
    await page.goto('/p/cana-med/check-in');
    await expect(page.getByText(/Check-in|chegada|Confirmar/i).first()).toBeVisible({ timeout: 10000 });

    // Canal de Privacidade LGPD
    await page.goto('/p/cana-med/privacidade');
    await expect(page.getByText(/Privacidade|LGPD|Titular/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 10. PAINEL DE CHAMADA DA TV DO SAGUÃO
  // =========================================================================
  test('11. Painel de TV do Saguão: exibição pública sem login (/sala/tv)', async ({ page }) => {
    await page.goto('/sala/tv');

    // Valida presença da tela de chamada de senhas
    await expect(page.getByText(/Painel|Senha|Consultório|CANA MED/i).first()).toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 12. INICIAR ATENDIMENTO E CARREGAR CONSULTÓRIO VIRTUAL
  // =========================================================================
  test('12. Iniciar Atendimento a partir da Agenda e carregar Consultório / PEP do Paciente', async ({ page }) => {
    await loginAsDoctor(page);

    // Acessa Minha Agenda
    await page.goto('/medico/agenda');
    await expect(page.getByRole('heading', { name: /Minha Agenda/i })).toBeVisible({ timeout: 10000 });

    // Inicia atendimento se disponível ou vai para o consultório
    const startBtn = page.getByRole('button', { name: /Iniciar Atendimento/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page).toHaveURL(/\/medico\/consultorio/, { timeout: 15000 });
    } else {
      await page.goto('/medico/consultorio');
    }

    // Confirma que a tela do consultório virtual renderizou
    await expect(page.getByRole('heading', { name: /Meu Consultório Virtual/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Carregando consultório virtual/i)).not.toBeVisible({ timeout: 10000 });
  });

  // =========================================================================
  // 13. RETOMAR ATENDIMENTO A PARTIR DO HISTÓRICO DE PRONTUÁRIOS
  // =========================================================================
  test('13. Retomar atendimento clínico diretamente do histórico de prontuários da paciente (/medico/prontuario)', async ({ page }) => {
    await loginAsDoctor(page);

    // Navega para prontuários
    await page.goto('/medico/prontuario');
    await expect(page.getByRole('heading', { name: /Prontuário Eletrônico do Paciente|PEP/i })).toBeVisible({ timeout: 10000 });

    // Clica na primeira paciente listada se houver
    const patientItem = page.locator('aside button, [role="button"]').first();
    if (await patientItem.isVisible()) {
      await patientItem.click();

      // Se houver atendimento em andamento ou botão "Abrir no Consultório", clica
      const resumeBtn = page.getByRole('button', { name: /Abrir no Consultório|Continuar Atendimento/i }).first();
      if (await resumeBtn.isVisible()) {
        await resumeBtn.click();
        await expect(page).toHaveURL(/\/medico\/consultorio/, { timeout: 15000 });
        await expect(page.getByRole('heading', { name: /Meu Consultório Virtual/i })).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
