import { describe, expect, it } from 'vitest';

declare const process: any;

describe('Identidade Visual Canônica e Tokens Oficiais Cana Med Mulher', () => {
  it('define as cores canônicas oficiais de Cana Med Mulher em theme.css (Roxo/Magenta)', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const themeCssPath = path.resolve(process.cwd(), 'src/styles/theme.css');
    const themeContent = fs.readFileSync(themeCssPath, 'utf-8');

    // #852A91 Roxo de marca, #6F217B Roxo escuro / Hover, #D83C91 Magenta, #B77AD8 Lilás, #F7ECF8 Soft
    expect(themeContent).toMatch(/--brand-primary:\s*#852A91/i);
    expect(themeContent).toMatch(/--brand-hover:\s*#6F217B/i);
    expect(themeContent).toMatch(/--brand-magenta:\s*#D83C91/i);
    expect(themeContent).toMatch(/--brand-lilac:\s*#B77AD8/i);
    expect(themeContent).toMatch(/--brand-soft:\s*#F7ECF8/i);
    expect(themeContent).toContain('--brand-primary: #852A91;');
    expect(themeContent).toContain('--brand-hover: #6F217B;');
    expect(themeContent).toContain('--brand-magenta: #D83C91;');
    expect(themeContent).toContain('--brand-lilac: #B77AD8;');
    expect(themeContent).toContain('--brand-soft: #F7ECF8;');
  });

  it('não contém nenhum resquício de hexadecimais teal/petróleo (#008080, #005F6A) em theme.css', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const themeCssPath = path.resolve(process.cwd(), 'src/styles/theme.css');
    const themeContent = fs.readFileSync(themeCssPath, 'utf-8');

    const forbiddenColors = [
      '#008080',
      '#005F6A',
      '#006666',
      '#66CDAA',
      '#E6F3F3',
      '%23008080',
    ];

    for (const color of forbiddenColors) {
      const regex = new RegExp(color, 'i');
      expect(themeContent, `theme.css contém cor não autorizada ${color}`).not.toMatch(regex);
    }
  });

  it('não contém hexadecimais de teal/petróleo (#008080, #005F6A) nos componentes do frontend', async () => {
    // @ts-ignore
    const fs = await import('node:fs');
    // @ts-ignore
    const path = await import('node:path');
    const srcDir = path.resolve(process.cwd(), 'src');
    const forbiddenRegex = /#(008080|005F6A|006666|66CDAA|E6F3F3)\b/i;

    const checkDir = (dir: string): { file: string; line: number; text: string }[] => {
      let violations: { file: string; line: number; text: string }[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          violations = violations.concat(checkDir(fullPath));
        } else if (/\.(tsx|ts|css)$/.test(entry.name) && entry.name !== 'themeTokens.test.ts') {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          lines.forEach((line: string, idx: number) => {
            if (forbiddenRegex.test(line)) {
              violations.push({
                file: path.relative(srcDir, fullPath),
                line: idx + 1,
                text: line.trim(),
              });
            }
          });
        }
      }
      return violations;
    };

    const violations = checkDir(srcDir);
    expect(violations, `Encontradas cores teal/petróleo: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });
});
