import { useState } from 'react';

export type CervicalFindingType = 'acetobranco' | 'pontilhado' | 'mosaico' | 'vaso_atipico' | 'biopsia';

export interface CervicalClockMapProps {
  selectedHours: number[];
  findingType?: CervicalFindingType;
  ztType?: string; // '1' | '2' | '3'
  readOnly?: boolean;
  onChange: (hours: number[]) => void;
  onZtChange?: (zt: string) => void;
}

export function CervicalClockMap({
  selectedHours,
  findingType = 'acetobranco',
  ztType = '1',
  readOnly = false,
  onChange,
  onZtChange,
}: CervicalClockMapProps) {
  const [currentFinding, setCurrentFinding] = useState<CervicalFindingType>(findingType);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const toggleHour = (hour: number) => {
    if (readOnly) return;
    if (selectedHours.includes(hour)) {
      onChange(selectedHours.filter((h) => h !== hour));
    } else {
      onChange([...selectedHours, hour].sort((a, b) => a - b));
    }
  };

  const handleSelectAllEctopia = () => {
    if (readOnly) return;
    onChange([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onChange([]);
  };

  // Coordenadas trigonométricas para o mostrador horário (raio = 95, centro = 120, 120)
  const cx = 120;
  const cy = 120;
  const rOuter = 95;
  const rInner = 35;

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const getSectorPath = (hour: number) => {
    const angleCenter = ((hour % 12) * 30) - 90;
    const angleStart = (angleCenter - 15) * (Math.PI / 180);
    const angleEnd = (angleCenter + 15) * (Math.PI / 180);

    const x1 = cx + rInner * Math.cos(angleStart);
    const y1 = cy + rInner * Math.sin(angleStart);
    const x2 = cx + rOuter * Math.cos(angleStart);
    const y2 = cy + rOuter * Math.sin(angleStart);

    const x3 = cx + rOuter * Math.cos(angleEnd);
    const y3 = cy + rOuter * Math.sin(angleEnd);
    const x4 = cx + rInner * Math.cos(angleEnd);
    const y4 = cy + rInner * Math.sin(angleEnd);

    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;
  };

  const getTextCoord = (hour: number) => {
    const angle = (((hour % 12) * 30) - 90) * (Math.PI / 180);
    const rText = 110;
    return {
      x: cx + rText * Math.cos(angle),
      y: cy + rText * Math.sin(angle) + 4,
    };
  };

  // Cores semânticas clínicas padronizadas pelo design system Cana Med Mulher
  const getFindingColor = (type: CervicalFindingType) => {
    switch (type) {
      case 'acetobranco': return '#D97706'; // Âmbar acetobranco
      case 'pontilhado': return '#DD6B20';  // Laranja
      case 'mosaico': return '#C05621';     // Laranja escuro
      case 'vaso_atipico': return '#C33D49';// Vermelho alerta
      case 'biopsia': return '#9B2C2C';     // Vinho biópsia
      default: return 'var(--brand-primary, #852A91)';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#FAF7FA',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-neutral-border)',
        maxWidth: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <strong style={{ fontSize: '0.9rem', color: '#481361' }}>
          🎯 Mapa Cervical 12h (Odontograma Colposcópico)
        </strong>
        {onZtChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: '#626B79' }}>Zona de Transformação (ZT):</span>
            <select
              className="form__select"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.78rem' }}
              value={ztType}
              onChange={(e) => onZtChange(e.target.value)}
              disabled={readOnly}
            >
              <option value="1">Tipo 1 (Totalmente Ectocervical)</option>
              <option value="2">Tipo 2 (Componente Endocervical Visível)</option>
              <option value="3">Tipo 3 (Componente Endocervical Não Visível)</option>
            </select>
          </div>
        )}
      </div>

      {/* Seletor de Tipo de Achado Colposcópico */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'acetobranco', label: 'Acetobranco', color: '#D97706' },
            { id: 'pontilhado', label: 'Pontilhado', color: '#DD6B20' },
            { id: 'mosaico', label: 'Mosaico', color: '#C05621' },
            { id: 'vaso_atipico', label: 'Vaso Atípico', color: '#C33D49' },
            { id: 'biopsia', label: '📍 Biópsia', color: '#9B2C2C' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              className="button button--ghost button--small"
              style={{
                fontSize: '0.74rem',
                padding: '0.15rem 0.45rem',
                background: currentFinding === item.id ? item.color : '#FFFFFF',
                color: currentFinding === item.id ? '#FFFFFF' : '#4A5568',
                borderColor: item.color,
                border: '1px solid',
              }}
              onClick={() => setCurrentFinding(item.id as CervicalFindingType)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#626B79', textAlign: 'center' }}>
        Clique nos setores para marcar quadrantes com achados colposcópicos ou biópsia direcionada.
      </p>

      <svg width={240} height={240} viewBox="0 0 240 240" style={{ cursor: readOnly ? 'default' : 'pointer', maxWidth: '100%' }}>
        {/* Círculo de fundo do colo */}
        <circle cx={cx} cy={cy} r={rOuter + 2} fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />

        {/* Setores horários de 1 a 12 */}
        {hours.map((hour) => {
          const isSelected = selectedHours.includes(hour);
          const isHovered = hoveredHour === hour;

          let fillColor = '#FFFFFF';
          if (isSelected) {
            fillColor = getFindingColor(currentFinding);
          } else if (isHovered && !readOnly) {
            fillColor = '#F7ECF8';
          }

          return (
            <path
              key={hour}
              data-testid={`cervical-hour-${hour}`}
              d={getSectorPath(hour)}
              fill={fillColor}
              stroke="#CBD5E0"
              strokeWidth="1.2"
              onClick={() => toggleHour(hour)}
              onMouseEnter={() => setHoveredHour(hour)}
              onMouseLeave={() => setHoveredHour(null)}
              style={{ transition: 'fill 0.15s ease' }}
            >
              <title>{`Posição ${hour}h - ${isSelected ? 'Alteração Selecionada' : 'Normal'}`}</title>
            </path>
          );
        })}

        {/* Orifício Externo do Colo (Centro) */}
        <ellipse cx={cx} cy={cy} rx={16} ry={9} fill="#481361" stroke="#2D3748" strokeWidth="1.5" />
        <text x={cx} y={cy + 3} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
          OCE
        </text>

        {/* Rótulos dos números das horas */}
        {hours.map((hour) => {
          const pos = getTextCoord(hour);
          const isSelected = selectedHours.includes(hour);
          return (
            <text
              key={`label-${hour}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fill={isSelected ? '#852A91' : '#718096'}
              fontSize="10"
              fontWeight={isSelected ? 'bold' : 'normal'}
            >
              {hour}h
            </text>
          );
        })}
      </svg>

      {/* Ações rápidas e presets */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
          <button
            type="button"
            className="button button--ghost button--small"
            style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem' }}
            onClick={handleSelectAllEctopia}
          >
            Ectopia 360° (Todos)
          </button>
          <button
            type="button"
            className="button button--ghost button--small"
            style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem', color: '#C33D49' }}
            onClick={handleClearAll}
          >
            Limpar Colo (Normal)
          </button>
        </div>
      )}

      {/* Resumo textual das horas marcadas */}
      <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#202631' }}>
        {selectedHours.length === 0 ? (
          <span style={{ color: '#626B79' }}>Nenhum setor alterado selecionado (Colo Eutrófico / Normal).</span>
        ) : (
          <span>
            Setores com achados: <strong>{selectedHours.map((h) => `${h}h`).join(', ')}</strong> ({currentFinding})
          </span>
        )}
      </div>
    </div>
  );
}
