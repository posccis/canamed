import { chromium } from '../node_modules/playwright/index.mjs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('../artifacts/screenshots');

async function capturePepAndRegistration() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // 1. Login Gestor
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('.login-profile-card');
  const adminCard = page.locator('.login-profile-card', { hasText: 'equipe da clínica' });
  await adminCard.click();
  await page.waitForTimeout(500);

  await page.fill('input[type="email"], input[placeholder*="recepcao"]', 'gestor@canamed.local');
  await page.fill('input[type="password"]', 'AdminCanamed2026!#');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app/**', { timeout: 12000 });

  // 2. PEP detalhado da Paciente Sintética (33333333-3333-4333-8333-333333333333)
  const patientId = '33333333-3333-4333-8333-333333333333';
  console.log('Navegando para PEP completo da paciente...');
  await page.goto(`http://localhost:5173/medico/prontuario/${patientId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const pepPath = path.join(OUTPUT_DIR, '21_medico_prontuario_paciente_detalhe.png');
  await page.screenshot({ path: pepPath, fullPage: false });
  console.log(`Salvo: ${pepPath}`);

  // Clica na aba Ficha Ginecológica
  console.log('Navegando para Ficha Gineco-Obstétrica...');
  const gynTab = page.locator('button:has-text("Ficha Gineco-Obstétrica")');
  if (await gynTab.count() > 0) {
    await gynTab.click();
    await page.waitForTimeout(1000);
    const gynPath = path.join(OUTPUT_DIR, '22_medico_ficha_ginecologica.png');
    await page.screenshot({ path: gynPath, fullPage: false });
    console.log(`Salvo: ${gynPath}`);
  }

  // Clica na aba Rastreamento Preventivo
  console.log('Navegando para Rastreamento Preventivo...');
  const scrTab = page.locator('button:has-text("Rastreamento Preventivo")');
  if (await scrTab.count() > 0) {
    await scrTab.click();
    await page.waitForTimeout(1000);
    const scrPath = path.join(OUTPUT_DIR, '23_medico_rastreamento_preventivo.png');
    await page.screenshot({ path: scrPath, fullPage: false });
    console.log(`Salvo: ${scrPath}`);
  }

  await browser.close();
  console.log('Capturas detalhadas do prontuário concluídas!');
}

capturePepAndRegistration();
