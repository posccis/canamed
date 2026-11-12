import type { PrenatalVisitDto } from './medicalRecordsApi';

interface Props {
  visits: Array<Partial<PrenatalVisitDto> & { gestationalAgeWeeks?: number | null; bmi?: number | null }>;
  heightCm?: number | null;
}

export function AtalahWeightGainChart({ visits, heightCm = 165 }: Props) {
  const maternalHeight = heightCm && heightCm > 50 ? heightCm : 165;

  // Ordena visitas por idade gestacional em semanas e calcula IMC efetivo se ausente
  const validPoints = visits
    .map((v) => {
      const calculatedBmi =
        v.bmi ??
        (v as any).maternalBmi ??
        (v.weightKg ? Number((v.weightKg / Math.pow(maternalHeight / 100, 2)).toFixed(1)) : null);

      return {
        ...v,
        effectiveBmi: calculatedBmi,
      };
    })
    .filter((v) => v.gestationalAgeWeeks && v.gestationalAgeWeeks >= 1 && v.effectiveBmi && v.effectiveBmi > 0)
    .sort((a, b) => a.gestationalAgeWeeks! - b.gestationalAgeWeeks!);

  // Dimensões do SVG
  const width = 520;
  const height = 260;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 28;
  const padBottom = 38;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Escala X: semanas 4 a 42 (cobre do início do 1º trimestre até pós-termo)
  const minW = 4;
  const maxW = 42;
  const scaleX = (w: number) => {
    const clampedW = Math.max(minW, Math.min(maxW, w));
    return padLeft + ((clampedW - minW) / (maxW - minW)) * chartW;
  };

  // Escala Y dinâmica para nunca truncar IMCs (ex: obesidade materna grave ou desnutrição)
  const minObservedBmi = validPoints.length > 0 ? Math.min(...validPoints.map((p) => p.effectiveBmi!)) : 16;
  const maxObservedBmi = validPoints.length > 0 ? Math.max(...validPoints.map((p) => p.effectiveBmi!)) : 38;

  const minBmi = Math.min(16, Math.floor(minObservedBmi - 1));
  const maxBmi = Math.max(38, Math.ceil(maxObservedBmi + 2));

  const scaleY = (bmi: number) => {
    const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi));
    return padTop + chartH - ((clampedBmi - minBmi) / (maxBmi - minBmi)) * chartH;
  };

  // Polígonos de faixas de Atalah com progressão fisiológica ascendente (semanas 4 a 42)
  const atalahWeeks = [4, 6, 10, 15, 20, 25, 30, 35, 40, 42];
  const lowAdequateThresholds = [19.8, 19.8, 19.8, 20.6, 21.5, 22.4, 23.2, 24.1, 24.9, 25.1];
  const adequateOverweightThresholds = [24.9, 24.9, 24.9, 25.8, 26.7, 27.5, 28.4, 29.3, 30.1, 30.3];
  const overweightObeseThresholds = [29.0, 29.0, 29.0, 29.9, 30.8, 31.7, 32.6, 33.5, 34.4, 34.6];

  // Gera string de pontos para polígonos fechados
  const buildPolygon = (topThresholds: number[], bottomThresholds: number[]) => {
    const topPoints = atalahWeeks.map((w, i) => `${scaleX(w)},${scaleY(topThresholds[i])}`);
    const bottomPoints = [...atalahWeeks].reverse().map((w, i) => {
      const revIdx = atalahWeeks.length - 1 - i;
      return `${scaleX(w)},${scaleY(bottomThresholds[revIdx])}`;
    });
    return [...topPoints, ...bottomPoints].join(' ');
  };

  const obesePolygon = buildPolygon(
    atalahWeeks.map(() => maxBmi),
    overweightObeseThresholds
  );

  const overweightPolygon = buildPolygon(
    overweightObeseThresholds,
    adequateOverweightThresholds
  );

  const adequatePolygon = buildPolygon(
    adequateOverweightThresholds,
    lowAdequateThresholds
  );

  const underweightPolygon = buildPolygon(
    lowAdequateThresholds,
    atalahWeeks.map(() => minBmi)
  );

  // Status da última consulta
  const latestPoint = validPoints.length > 0 ? validPoints[validPoints.length - 1] : null;
  const getAtalahStatus = (gaWeeks: number, bmi: number) => {
    let idx = atalahWeeks.findIndex((w) => w >= gaWeeks);
    if (idx === -1) idx = atalahWeeks.length - 1;
    if (bmi < lowAdequateThresholds[idx]) return { label: 'Baixo Peso', color: '#2B6CB0', bg: '#EFF6FF' };
    if (bmi <= adequateOverweightThresholds[idx]) return { label: 'Adequado', color: '#852A91', bg: '#F7ECF8' };
    if (bmi <= overweightObeseThresholds[idx]) return { label: 'Sobrepeso', color: '#C05621', bg: '#FFFBEB' };
    return { label: 'Obesidade', color: '#C53030', bg: '#FFF1F2' };
  };

  const latestStatus = latestPoint ? getAtalahStatus(latestPoint.gestationalAgeWeeks!, latestPoint.effectiveBmi!) : null;

  // Gerador de ticks para eixo Y
  const yTicks: number[] = [];
  const step = maxBmi - minBmi > 25 ? 6 : 4;
  for (let val = Math.ceil(minBmi / step) * step; val <= maxBmi; val += step) {
    yTicks.push(val);
  }

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E9D5FF',
        borderRadius: '12px',
        padding: '1rem',
        marginTop: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: '0.88rem', color: '#6F217B' }}>
            📈 Curva de Ganho de Peso Gestacional (Atalah / Ministério da Saúde)
          </strong>
          {latestPoint && latestStatus && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: latestStatus.bg,
                color: latestStatus.color,
                border: `1px solid ${latestStatus.color}40`,
              }}
            >
              Último: {latestPoint.gestationalAgeWeeks}s • IMC {latestPoint.effectiveBmi} ({latestStatus.label})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.72rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#2B6CB0' }}>🟦 Baixo Peso</span>
          <span style={{ color: '#852A91', fontWeight: 600 }}>🟪 Adequado</span>
          <span style={{ color: '#C05621' }}>🟧 Sobrepeso</span>
          <span style={{ color: '#C53030' }}>🟥 Obesidade</span>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Polígonos ascendentes Atalah */}
        <polygon points={obesePolygon} fill="#FFF1F2" />
        <polygon points={overweightPolygon} fill="#FFFBEB" />
        <polygon points={adequatePolygon} fill="#F7ECF8" />
        <polygon points={underweightPolygon} fill="#F0F9FF" />

        {/* Eixos */}
        <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#CBD5E0" strokeWidth="1.5" />
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#CBD5E0" strokeWidth="1.5" />

        {/* Ticks X: semanas */}
        {[6, 12, 18, 24, 30, 36, 40].map((sem) => (
          <g key={`x-${sem}`}>
            <line x1={scaleX(sem)} y1={padTop + chartH} x2={scaleX(sem)} y2={padTop + chartH + 4} stroke="#A0AEC0" />
            <text x={scaleX(sem)} y={padTop + chartH + 16} fontSize="9" textAnchor="middle" fill="#718096">
              {sem}s
            </text>
          </g>
        ))}

        {/* Ticks Y: IMC */}
        {yTicks.map((bmi) => (
          <g key={`y-${bmi}`}>
            <line x1={padLeft - 4} y1={scaleY(bmi)} x2={padLeft} y2={scaleY(bmi)} stroke="#A0AEC0" />
            <text x={padLeft - 8} y={scaleY(bmi) + 3} fontSize="9" textAnchor="end" fill="#718096">
              {bmi}
            </text>
          </g>
        ))}

        {/* Aviso amigável quando não há pontos válidos */}
        {validPoints.length === 0 && (
          <g>
            <rect
              x={padLeft + 20}
              y={padTop + chartH / 2 - 20}
              width={chartW - 40}
              height={40}
              rx={8}
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#B77AD8"
              strokeDasharray="4 3"
            />
            <text
              x={padLeft + chartW / 2}
              y={padTop + chartH / 2 + 5}
              textAnchor="middle"
              fontSize="11"
              fill="#6F217B"
              fontWeight="600"
            >
              Nenhum registro com peso/IMC disponível. Os pontos aparecerão conforme as consultas.
            </text>
          </g>
        )}

        {/* Linha conectora de evolução do IMC */}
        {validPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#852A91"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={validPoints.map((p) => `${scaleX(p.gestationalAgeWeeks!)},${scaleY(p.effectiveBmi!)}`).join(' ')}
          />
        )}

        {/* Pontos plotados com visual em destaque e rótulo claro */}
        {validPoints.map((p, idx) => {
          const cx = scaleX(p.gestationalAgeWeeks!);
          const cy = scaleY(p.effectiveBmi!);
          return (
            <g key={`point-${idx}`}>
              {/* Halo externo para destaque visual */}
              <circle cx={cx} cy={cy} r={8} fill="#852A91" fillOpacity={0.2} />
              {/* Ponto principal */}
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill="#6F217B"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                <title>{`${p.gestationalAgeWeeks}s: IMC ${p.effectiveBmi} (${p.weightKg}kg)`}</title>
              </circle>
              {/* Rótulo de texto com valor do IMC */}
              <text
                x={cx}
                y={cy - 9}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                fill="#6F217B"
              >
                {p.effectiveBmi}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
