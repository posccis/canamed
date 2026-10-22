import { chromium } from '../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('artifacts/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Iniciando captura das 4 telas solicitadas...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // 1. Tela Inicial
  console.log('1. Capturando Tela Inicial...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_tela_inicial.png'), fullPage: false, animations: 'disabled' });
  console.log('Salvo: 01_tela_inicial.png');

  // 2. Tela de Agendamento do Paciente
  console.log('2. Capturando Tela de Agendamento do Paciente...');
  await page.goto('http://localhost:5173/p/cana-med/agendar', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_agendamento_paciente.png'), fullPage: false, animations: 'disabled' });
  console.log('Salvo: 02_agendamento_paciente.png');

  // 3. Login e Dashboard da Administração
  console.log('3. Realizando Login Administrativo para Dashboard da Administração...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForSelector('.login-profile-card', { timeout: 8000 });
  
  const adminCard = page.locator('.login-profile-card', { hasText: 'equipe da clínica' });
  await adminCard.click();
  await page.waitForTimeout(500);

  await page.fill('input[type="email"], input[placeholder*="recepcao"]', 'gestor@canamed.local');
  await page.fill('input[type="password"]', 'AdminCanamed2026!#');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/app/**', { timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:5173/app/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_dashboard_administracao.png'), fullPage: false, animations: 'disabled' });
  console.log('Salvo: 03_dashboard_administracao.png');

  // 4. Dashboard do Médico
  console.log('4. Capturando Dashboard do Médico...');
  await page.goto('http://localhost:5173/medico', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_dashboard_medico.png'), fullPage: false, animations: 'disabled' });
  console.log('Salvo: 04_dashboard_medico.png');

  await browser.close();
  console.log('Todas as 4 capturas solicitadas foram concluídas!');
}

run().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
