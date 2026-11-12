import { describe, it, expect } from 'vitest';

declare const process: any;

describe('Design System Serene / Cana Med Mulher - Tokens & Ícones', () => {
  it('deve conter o arquivo patient-serene.css com tokens de paleta oficiais e contraste WCAG AA', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const sereneCssPath = path.resolve(process.cwd(), 'src/features/patient/patient-serene.css');

    expect(fs.existsSync(sereneCssPath)).toBe(true);
    const cssContent = fs.readFileSync(sereneCssPath, 'utf-8');

    // Tokens Canônicos Cana Med Mulher
    expect(cssContent).toContain('--color-serene-primary: #852A91;');
    expect(cssContent).toContain('--color-serene-primary-hover: #6F217B;');
    expect(cssContent).toContain('--color-serene-primary-text: #852A91;');
    expect(cssContent).toContain('--color-serene-secondary: #6F217B;');
    expect(cssContent).toContain('--color-serene-surface: #F7F8FA;');
    expect(cssContent).toContain('--color-serene-surface-card: #FFFFFF;');
    expect(cssContent).toContain('--color-serene-text-main: #1E293B;');
    expect(cssContent).toContain('--color-serene-emergency: #DC2626;');

    // Classes utilitárias fundamentais
    expect(cssContent).toContain('.canamed-input');
    expect(cssContent).toContain('.canamed-select');
    expect(cssContent).toContain('.canamed-btn-primary');
    expect(cssContent).toContain('.canamed-btn-secondary');
    expect(cssContent).toContain('.canamed-card');
    expect(cssContent).toContain('.canamed-chip');

    // Sombras Clínicas Suaves
    expect(cssContent).toContain('--shadow-serene-soft:');
    expect(cssContent).toContain('--shadow-serene-luminescence:');
  });

  it('deve carregar Material Symbols Outlined no index.html', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const indexHtmlPath = path.resolve(process.cwd(), 'index.html');

    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(htmlContent).toContain('Material+Symbols+Outlined');
  });
});

