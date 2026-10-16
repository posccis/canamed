import { chromium } from '../node_modules/playwright/index.mjs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('../artifacts/screenshots');

async function runExtra() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('.login-profile-card');
  const adminCard = page.locator('.login-profile-card', { hasText: 'equipe da clínica' });
  await adminCard.click();
  await page.waitForTimeout(500);

  await page.fill('input[type="email"], input[placeholder*="recepcao"]', 'gestor@canamed.local');
  await page.fill('input[type="password"]', 'AdminCanamed2026!#');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/**', { timeout: 12000 });

  // Acessa Prontuário detalhado de paciente
  console.log('Acessando Prontuário do Paciente...');
  await page.goto('http://localhost:5173/medico/prontuario', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const openButtons = page.locator('button:has-text("Abrir Prontuário")');
  if ((await openButtons.count()) > 0) {
    await openButtons.first().click();
    await page.waitForTimeout(2000);
    const detailPath = path.join(OUTPUT_DIR, '21_medico_prontuario_paciente_detalhe.png');
    await page.screenshot({ path: detailPath, fullPage: false });
    console.log(`Salvo: ${detailPath}`);
  }

  // Paciente com sessão para capturar o Portal LGPD preenchido
  console.log('Acessando Portal LGPD com sessão do paciente...');
  const patientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const patientPage = await patientContext.newPage();
  await patientPage.goto('http://localhost:5173/');
  await patientPage.evaluate(() => {
    const session = {
      token: 'demo-token',
      patientId: 'pat-1',
      patientName: 'Mariana Fontes',
    };
    localStorage.setItem('canamed_patient_session', JSON.stringify(session));
    localStorage.setItem('canamed_patient_session_cana-med', JSON.stringify(session));
  });

  await patientPage.goto('http://localhost:5173/p/cana-med/privacidade', { waitUntil: 'networkidle' });
  await patientPage.waitForTimeout(1500);
  const lgpdPath = path.join(OUTPUT_DIR, '07_paciente_privacidade_lgpd_autenticado.png');
  await patientPage.screenshot({ path: lgpdPath, fullPage: false });
  console.log(`Salvo: ${lgpdPath}`);

  await browser.close();
}

runExtra();
