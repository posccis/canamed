import type { PrenatalVisitDto } from './medicalRecordsApi';

interface Props {
  visits: PrenatalVisitDto[];
}

export function UterineHeightChart({ visits }: Props) {
  // Ordena visitas por idade gestacional em semanas
  const validPoints = visits
    .filter((v) => v.gestationalAgeWeeks && v.gestationalAgeWeeks >= 12 && v.uterineHeightCm)
    .sort((a, b) => a.gestationalAgeWeeks! - b.gestationalAgeWeeks!);

  // Dimensões do SVG
  const width = 500;
  const height = 240;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Escala X: semanas 12 a 40
  const minW = 12;
  const maxW = 40;
  const scaleX = (w: number) => padLeft + ((w - minW) / (maxW - minW)) * chartW;

  // Escala Y: Altura Uterina em cm (10 a 40cm)
  const minAu = 8;
  const maxAu = 40;
  const scaleY = (au: number) => padTop + chartH - ((au - minAu) / (maxAu - minAu)) * chartH;

  // Curvas de referência FEBRASGO/MS: P10 e P90 para AU
  // Aproximação linear padrão:
  // P10: a partir de 16 semanas ~ (IG - 3) cm
  // P90: a partir de 16 semanas ~ (IG + 3) cm
  const refWeeks = [14, 16, 20, 24, 28, 32, 36, 40];
  const p10Points = refWeeks.map((w) => `${scaleX(w)},${scaleY(Math.max(10, w - 3.5))}`).join(' ');
  const p90Points = refWeeks.map((w) => `${scaleX(w)},${scaleY(Math.min(38, w + 3.0))}`).join(' ');

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--color-neutral-border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        marginTop: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '0.9rem', color: '#481361' }}>
          📏 Curva de Altura Uterina (P10 a P90 - FEBRASGO)
        </strong>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
          <span style={{ color: '#E53E3E' }}>-- Percentil 10</span>
          <span style={{ color: '#3182CE' }}>-- Percentil 90</span>
          <span style={{ color: '#852A91', fontWeight: 600 }}>● Paciente</span>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Eixos */}
        <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#CBD5E0" strokeWidth="1.5" />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#CBD5E0" strokeWidth="1.5" />

        {/* Ticks X: semanas */}
        {[12, 16, 20, 24, 28, 32, 36, 40].map((sem) => (
          <g key={`x-${sem}`}>
            <line x1={scaleX(sem)} y1={padTop + chartH} x2={scaleX(sem)} y2={padTop + chartH + 4} stroke="#A0AEC0" />
            <text x={scaleX(sem)} y={padTop + chartH + 16} fontSize="9" textAnchor="middle" fill="#718096">
              {sem}s
            </text>
          </g>
        ))}

        {/* Ticks Y: cm */}
        {[10, 15, 20, 25, 30, 35].map((au) => (
          <g key={`y-${au}`}>
            <line x1={padLeft - 4} y1={scaleY(au)} x2={padLeft} y2={scaleY(au)} stroke="#A0AEC0" />
            <text x={padLeft - 8} y={scaleY(au) + 3} fontSize="9" textAnchor="end" fill="#718096">
              {au}cm
            </text>
          </g>
        ))}

        {/* Linha P10 e P90 */}
        <polyline fill="none" stroke="#E53E3E" strokeWidth="1.5" strokeDasharray="4 3" points={p10Points} />
        <polyline fill="none" stroke="#3182CE" strokeWidth="1.5" strokeDasharray="4 3" points={p90Points} />

        {/* Linha e Pontos de evolução da AU da paciente */}
        {validPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#852A91"
            strokeWidth="2.5"
            points={validPoints.map((p) => `${scaleX(p.gestationalAgeWeeks!)},${scaleY(p.uterineHeightCm!)}`).join(' ')}
          />
        )}

        {validPoints.map((p, idx) => (
          <g key={`point-${idx}`}>
            <circle
              cx={scaleX(p.gestationalAgeWeeks!)}
              cy={scaleY(p.uterineHeightCm!)}
              r={4.5}
              fill="#852A91"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            >
              <title>{`${p.gestationalAgeWeeks}s: Altura Uterina ${p.uterineHeightCm}cm`}</title>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
