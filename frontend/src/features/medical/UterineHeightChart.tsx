import type { PrenatalVisitDto } from './medicalRecordsApi';

interface Props {
  visits: Array<Partial<PrenatalVisitDto> & { gestationalAgeWeeks?: number | null; uterineHeightCm?: number | null }>;
}

export function UterineHeightChart({ visits }: Props) {
  // Ordena visitas por idade gestacional em semanas
  const validPoints = visits
    .filter((v) => v.gestationalAgeWeeks && v.gestationalAgeWeeks >= 1 && v.uterineHeightCm && v.uterineHeightCm > 0)
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

  // Escala X: semanas 10 a 42 (permite consultas do 1º tri tardio até 42 semanas)
  const minW = 10;
  const maxW = 42;
  const scaleX = (w: number) => {
    const clampedW = Math.max(minW, Math.min(maxW, w));
    return padLeft + ((clampedW - minW) / (maxW - minW)) * chartW;
  };

  // Escala Y: Altura Uterina em cm (8 a 40cm, dinâmico até 48cm se necessário)
  const maxObservedAu = validPoints.length > 0 ? Math.max(...validPoints.map((p) => p.uterineHeightCm!)) : 40;
  // Se houver valor anômalo (> 50cm, ex: 160 digitado por engano em vez da estatura), ajustamos sem quebrar a escala
  const minAu = 8;
  const maxAu = maxObservedAu > 50 ? 46 : Math.max(40, Math.ceil(maxObservedAu + 2));

  const scaleY = (au: number) => {
    const clampedAu = Math.max(minAu, Math.min(maxAu, au));
    return padTop + chartH - ((clampedAu - minAu) / (maxAu - minAu)) * chartH;
  };

  // Curvas de referência FEBRASGO/MS: P10 e P90 para AU
  const refWeeks = [12, 14, 16, 20, 24, 28, 32, 36, 40];
  const p10Values = [9, 11, 13, 17, 21, 25, 29, 32, 34];
  const p90Values = [14, 16, 18, 23, 27, 31, 35, 38, 38];

  const p10Points = refWeeks.map((w, i) => `${scaleX(w)},${scaleY(p10Values[i])}`).join(' ');
  const p90Points = refWeeks.map((w, i) => `${scaleX(w)},${scaleY(p90Values[i])}`).join(' ');

  // Polígono sombreado entre P10 e P90
  const p10Arr = refWeeks.map((w, i) => `${scaleX(w)},${scaleY(p10Values[i])}`);
  const p90ArrReversed = [...refWeeks].reverse().map((w, i) => {
    const revIdx = refWeeks.length - 1 - i;
    return `${scaleX(w)},${scaleY(p90Values[revIdx])}`;
  });
  const bandPolygon = [...p10Arr, ...p90ArrReversed].join(' ');

  // Classificação do último registro
  const latestPoint = validPoints.length > 0 ? validPoints[validPoints.length - 1] : null;
  const getAuStatus = (gaWeeks: number, au: number) => {
    if (au > 50) return { label: 'Valor Incomum (>50cm)', color: '#C53030', bg: '#FFF1F2' };
    let idx = refWeeks.findIndex((w) => w >= gaWeeks);
    if (idx === -1) idx = refWeeks.length - 1;
    if (au < p10Values[idx]) return { label: 'Abaixo do P10 (Sugerir USG)', color: '#C05621', bg: '#FFFBEB' };
    if (au > p90Values[idx]) return { label: 'Acima do P90 (Investigar)', color: '#C53030', bg: '#FFF1F2' };
    return { label: 'Adequada (P10–P90)', color: '#852A91', bg: '#F7ECF8' };
  };

  const latestStatus = latestPoint ? getAuStatus(latestPoint.gestationalAgeWeeks!, latestPoint.uterineHeightCm!) : null;

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
            📏 Curva de Altura Uterina (P10 a P90 - FEBRASGO)
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
              Último: {latestPoint.gestationalAgeWeeks}s • AU {latestPoint.uterineHeightCm}cm ({latestStatus.label})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#B77AD8', fontWeight: 600 }}>-- Percentil 10</span>
          <span style={{ color: '#D83C91', fontWeight: 600 }}>-- Percentil 90</span>
          <span style={{ color: '#852A91', fontWeight: 700 }}>● Paciente</span>
        </div>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Faixa sombreada P10-P90 */}
        <polygon points={bandPolygon} fill="#FAF5FB" />

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
        {[10, 15, 20, 25, 30, 35, 40].map((au) => (
          <g key={`y-${au}`}>
            <line x1={padLeft - 4} y1={scaleY(au)} x2={padLeft} y2={scaleY(au)} stroke="#A0AEC0" />
            <text x={padLeft - 8} y={scaleY(au) + 3} fontSize="9" textAnchor="end" fill="#718096">
              {au}cm
            </text>
          </g>
        ))}

        {/* Linha P10 e P90 */}
        <polyline fill="none" stroke="#B77AD8" strokeWidth="2" strokeDasharray="4 3" points={p10Points} />
        <polyline fill="none" stroke="#D83C91" strokeWidth="2" strokeDasharray="4 3" points={p90Points} />

        {/* Aviso amigável quando não há dados de AU */}
        {validPoints.length === 0 && (
          <g>
            <rect
              x={padLeft + 15}
              y={padTop + chartH / 2 - 20}
              width={chartW - 30}
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
              A aferição da altura uterina inicia-se habitualmente a partir da 12ª–14ª semana.
            </text>
          </g>
        )}

        {/* Linha conectora de evolução da AU */}
        {validPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#852A91"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={validPoints.map((p) => `${scaleX(p.gestationalAgeWeeks!)},${scaleY(p.uterineHeightCm!)}`).join(' ')}
          />
        )}

        {/* Pontos plotados com visual em destaque e rótulo claro */}
        {validPoints.map((p, idx) => {
          const cx = scaleX(p.gestationalAgeWeeks!);
          const cy = scaleY(p.uterineHeightCm!);
          const isAnomaly = (p.uterineHeightCm || 0) > 50;

          return (
            <g key={`point-${idx}`}>
              {/* Halo externo */}
              <circle cx={cx} cy={cy} r={8} fill={isAnomaly ? '#E53E3E' : '#852A91'} fillOpacity={0.2} />
              {/* Ponto principal */}
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill={isAnomaly ? '#C53030' : '#6F217B'}
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                <title>{`${p.gestationalAgeWeeks}s: Altura Uterina ${p.uterineHeightCm}cm`}</title>
              </circle>
              {/* Rótulo de texto com valor da AU */}
              <text
                x={cx}
                y={cy - 9}
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                fill={isAnomaly ? '#C53030' : '#6F217B'}
              >
                {isAnomaly ? `${p.uterineHeightCm}cm ⚠️` : `${p.uterineHeightCm}cm`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
