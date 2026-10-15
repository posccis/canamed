import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = path.resolve('artifacts/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Iniciando captura de telas com Edge/Playwright...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  const screens = [
    // 1. Home / Portal de Acesso Integrado
    {
      name: '01_home_portal_acesso',
      url: 'http://localhost:5173/',
      waitFor: '.login-profile-card',
      description: 'Página inicial com seleção dos 3 perfis de acesso: Paciente, Médica(o) e Equipe da clínica',
    },
    // 2. Painel de Chamada (TV do Saguão)
    {
      name: '02_tv_painel_saguao',
      url: 'http://localhost:5173/sala/tv',
      waitFor: '.tv-display-container',
      description: 'Painel público do saguão para chamada de senhas de atendimento com sintetizador de áudio',
    },
    // 3. Portal do Paciente - Agendamento Online
    {
      name: '03_paciente_portal_agendar',
      url: 'http://localhost:5173/p/cana-med/agendar',
      waitFor: '.patient-portal, .patient-page, body',
      description: 'Superfície pública do paciente com fluxo de agendamento online e escolha de profissional',
    },
    // 4. Portal do Paciente - Check-in Digital
    {
      name: '04_paciente_check_in',
      url: 'http://localhost:5173/p/cana-med/check-in',
      waitFor: '.patient-page',
      description: 'Check-in digital do paciente por celular/CPF com opção de atendimento prioritário',
    },
    // 5. Portal do Paciente - Cadastro Completo
    {
      name: '05_paciente_cadastro_completo',
      url: 'http://localhost:5173/p/cana-med/cadastro',
      waitFor: '.patient-page',
      description: 'Formulário mobile-first de pré-cadastro do paciente com consentimento LGPD',
    },
    // 6. Portal do Paciente - Acompanhamento da Fila
    {
      name: '06_paciente_fila_espera',
      url: 'http://localhost:5173/p/cana-med/fila',
      waitFor: '.patient-page',
      description: 'Acompanhamento do status da senha e posição na fila da clínica pelo celular',
    },
  ];

  for (const s of screens) {
    console.log(`Navegando para: ${s.url} (${s.name})`);
    try {
      await page.goto(s.url, { waitUntil: 'networkidle', timeout: 15000 });
      if (s.waitFor) {
        await page.waitForSelector(s.waitFor, { timeout: 8000 }).catch(() => {});
      }
      await page.waitForTimeout(1500); // estabilização visual
      const filePath = path.join(OUTPUT_DIR, `${s.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Salvo: ${filePath}`);
    } catch (err) {
      console.error(`Erro ao capturar ${s.name}: ${err.message}`);
    }
  }

  // 7. Login Administrativo & Operação da Clínica (/app)
  console.log('Realizando login para capturar telas de Gestão / Recepção...');
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.login-profile-card', { timeout: 8000 });
    
    // Clica no perfil "admin" (Sou da equipe da clínica)
    const adminCard = page.locator('.login-profile-card', { hasText: 'equipe da clínica' });
    await adminCard.click();
    await page.waitForTimeout(500);

    // Preenche credenciais
    await page.fill('input[type="email"], input[placeholder*="recepcao"]', 'gestor@canamed.local');
    await page.fill('input[type="password"]', 'AdminCanamed2026!#');
    await page.click('button[type="submit"]');

    // Aguarda navegação para /app/dashboard
    await page.waitForURL('**/app/**', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const staffScreens = [
      {
        name: '07_app_dashboard',
        url: 'http://localhost:5173/app/dashboard',
        waitFor: '.app-shell',
        description: 'Dashboard geral da clínica com métricas operacionais, atendimentos e resumos do dia',
      },
      {
        name: '08_app_agenda_recepcao',
        url: 'http://localhost:5173/app/agenda',
        waitFor: '.app-shell',
        description: 'Módulo unificado de Agenda e Recepção com visão de grade horária e status de sala',
      },
      {
        name: '09_app_recepcao_fila',
        url: 'http://localhost:5173/app/recepcao',
        waitFor: '.app-shell',
        description: 'Painel da fila de recepção com emissão e chamada de senhas de atendimento',
      },
      {
        name: '10_app_pacientes',
        url: 'http://localhost:5173/app/pacientes',
        waitFor: '.app-shell',
        description: 'Gestão e busca de pacientes da clínica com prontuário e histórico',
      },
      {
        name: '11_app_profissionais',
        url: 'http://localhost:5173/app/profissionais',
        waitFor: '.app-shell',
        description: 'Catálogo de profissionais de saúde, especialidades e configurações de atendimento',
      },
      {
        name: '12_app_caixa_financeiro',
        url: 'http://localhost:5173/app/caixa',
        waitFor: '.app-shell',
        description: 'Caixa diário da recepção e conciliação básica de recebimentos',
      },
      {
        name: '13_app_configuracoes',
        url: 'http://localhost:5173/app/configuracoes',
        waitFor: '.app-shell',
        description: 'Central de configurações da clínica em abas (Políticas, Usuários, DPO/LGPD e Links)',
      },
    ];

    for (const ss of staffScreens) {
      console.log(`Navegando para tela da clínica: ${ss.url} (${ss.name})`);
      await page.goto(ss.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
      const filePath = path.join(OUTPUT_DIR, `${ss.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Salvo: ${filePath}`);
    }

    // 14. Espaço do Médico (/medico)
    const doctorScreens = [
      {
        name: '14_medico_consultorio_dashboard',
        url: 'http://localhost:5173/medico',
        waitFor: '.doctor-shell',
        description: 'Painel principal do consultório médico com lista de pacientes do dia e alertas clínicos',
      },
      {
        name: '15_medico_workspace_atendimento',
        url: 'http://localhost:5173/medico/consultorio',
        waitFor: '.doctor-shell',
        description: 'Área de atendimento e evolução clínica ginecológica durante a consulta',
      },
      {
        name: '16_medico_prontuario',
        url: 'http://localhost:5173/medico/prontuario',
        waitFor: '.doctor-shell',
        description: 'Prontuário Eletrônico do Paciente (PEP) ginecológico e histórico clínico longitudinal',
      },
      {
        name: '17_medico_agenda',
        url: 'http://localhost:5173/medico/agenda',
        waitFor: '.doctor-shell',
        description: 'Agenda pessoal do profissional médico com horários e retornos',
      },
      {
        name: '18_medico_documentos',
        url: 'http://localhost:5173/medico/documentos',
        waitFor: '.doctor-shell',
        description: 'Emissão e gestão de prescrições eletrônicas, atestados e laudos clínicos',
      },
    ];

    for (const ds of doctorScreens) {
      console.log(`Navegando para tela médica: ${ds.url} (${ds.name})`);
      await page.goto(ds.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
      const filePath = path.join(OUTPUT_DIR, `${ds.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Salvo: ${filePath}`);
    }

  } catch (err) {
    console.error('Falha nas capturas autenticadas:', err);
  }

  await browser.close();
  console.log('Todas as capturas foram concluídas!');
}

run();
