import { useState } from 'react';

export interface QuickComplaintArchetype {
  id: string;
  label: string;
  icon: string;
  template: string;
}

export const COMMON_GYNECOLOGICAL_COMPLAINTS: QuickComplaintArchetype[] = [
  {
    id: 'rotina',
    label: 'Rotina / Preventivo',
    icon: '🔍',
    template: 'Consulta de rotina ginecológica e realização de exames preventivos periódicos.',
  },
  {
    id: 'atraso',
    label: 'Atraso Menstrual',
    icon: '📅',
    template: 'Atraso menstrual recente com ciclo previamente regular; investigando possível gestação ou amenorreia secundária.',
  },
  {
    id: 'dor_pelvica',
    label: 'Dor Pélvica / Dismenorreia',
    icon: '⚡',
    template: 'Queixa de dor pélvica e cólica menstrual de intensidade moderada a grave com impacto nas atividades habituais.',
  },
  {
    id: 'corrimento',
    label: 'Corrimento / Prurido',
    icon: '💧',
    template: 'Corrimento vaginal atípico associado a prurido vulvar, odor desagradável e desconforto local.',
  },
  {
    id: 'sua',
    label: 'Sangramento Anormal (SUA)',
    icon: '🩸',
    template: 'Sangramento uterino anormal fora do período menstrual / fluxo excessivo com eliminação de coágulos.',
  },
  {
    id: 'diu',
    label: 'Inserção / Revisão DIU',
    icon: '🌀',
    template: 'Avaliação para inserção ou revisão periódica de dispositivo intrauterino (fios e posicionamento).',
  },
  {
    id: 'climaterio',
    label: 'Climatério / Fogachos',
    icon: '🔥',
    template: 'Sintomas climatéricos: queixas de ondas de calor (fogachos), oscilação de humor e irregularidade menstrual.',
  },
  {
    id: 'gestacao',
    label: 'Suspeita de Gravidez',
    icon: '🤰',
    template: 'Atraso menstrual e teste de gravidez positivo; cálculo de idade gestacional e pré-natal inicial.',
  },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function QuickChiefComplaintSelector({ value, onChange, disabled = false }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const match = COMMON_GYNECOLOGICAL_COMPLAINTS.find((c) => c.template === value);
    return match ? match.id : null;
  });

  const handleChipClick = (complaint: QuickComplaintArchetype) => {
    if (disabled) return;
    if (selectedId === complaint.id) {
      setSelectedId(null);
    } else {
      setSelectedId(complaint.id);
      onChange(complaint.template);
    }
  };

  const handleInputChange = (text: string) => {
    onChange(text);
    const match = COMMON_GYNECOLOGICAL_COMPLAINTS.find((c) => c.template === text);
    setSelectedId(match ? match.id : null);
  };

  return (
    <div className="quick-complaint-selector">
      <div className="quick-complaint-header" style={{ marginBottom: '0.5rem' }}>
        <label htmlFor="chief-complaint-input" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
          Queixa Principal (Motivo da Consulta)
        </label>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-muted)' }}>
          Selecione um atalho ágil de 1 clique ou digite livremente:
        </span>
      </div>

      {/* Chips Rápidos */}
      <div
        className="quick-complaint-chips"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          marginBottom: '0.75rem',
        }}
      >
        {COMMON_GYNECOLOGICAL_COMPLAINTS.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => handleChipClick(item)}
              className={`complaint-chip ${isSelected ? 'complaint-chip--active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 700 : 500,
                borderRadius: '999px',
                border: isSelected ? '1.5px solid var(--color-brand-primary, #852A91)' : '1px solid var(--color-neutral-border, #CBD5E1)',
                background: isSelected ? 'var(--color-brand-surface-accent, #F7ECF8)' : '#F8FAFC',
                color: isSelected ? 'var(--color-primary-dark, #6F217B)' : '#334155',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease-in-out',
              }}
              title={item.template}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {isSelected && <span style={{ fontSize: '0.75rem', marginLeft: '0.15rem' }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Campo de Entrada com Edição Livre */}
      <input
        id="chief-complaint-input"
        type="text"
        className="form__input"
        placeholder="Ex.: Rotina ginecológica anual, renovação de anticoncepcional, cólica intensa..."
        value={value}
        disabled={disabled}
        onChange={(e) => handleInputChange(e.target.value)}
        style={{
          width: '100%',
          fontWeight: 500,
        }}
      />
    </div>
  );
}

