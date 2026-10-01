import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Testes de comportamento (Playwright) dos fluxos de login e de agenda.
 *
 * A suíte sobe a API e a SPA automaticamente e usa o gestor sintético do `.env` local (nunca
 * versionado). O navegador é instalado em D:\Tools\ms-playwright, conforme a preferência de disco do
 * projeto. Os testes rodam em série porque compartilham o banco de desenvolvimento.
 */
function readLocalEnv(): Record<string, string> {
  const path = fileURLToPath(new URL('../.env', import.meta.url));

  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
        .map((line) => {
          const separator = line.indexOf('=');

          return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
        }),
    );
  } catch {
    return {};
  }
}

const env = readLocalEnv();

process.env.CANAMED_E2E_EMAIL = env['Canamed__Development__SeedUserEmail'] ?? '';
process.env.CANAMED_E2E_PASSWORD = env['Canamed__Development__SeedUserPassword'] ?? '';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'pt-BR',
    timezoneId: 'America/Fortaleza',
    trace: 'off',
  },
  webServer: [
    {
      command: 'dotnet run --project ../backend/src/Canamed.Api --no-build',
      url: 'http://localhost:5080/api/v1/health/live',
      reuseExistingServer: true,
      timeout: 180_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        // A suíte autentica várias vezes por minuto na mesma origem; o limite de produção (10/min) é
        // validado separadamente, não nos testes de comportamento.
        Canamed__RateLimiting__LoginPermitLimit: '300',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
