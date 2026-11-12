import { useRef } from 'react';

export interface HmaSnippet {
  id: string;
  label: string;
  text: string;
}

export const HMA_CLINICAL_SNIPPETS: HmaSnippet[] = [
  {
    id: 'inicio',
    label: '+ Início/Tempo',
    text: 'Sintomas com início há aproximadamente [X] dias/meses, de evolução progressiva.',
  },
  {
    id: 'ciclo',
    label: '+ Relação com Ciclo',
    text: 'Sintomas com exacerbação evidente no período pré-menstrual/periovulatório.',
  },
  {
    id: 'melhora_piora',
    label: '+ Melhora / Piora',
    text: 'Refere alívio com repouso e analgesia comum. Piora após esforço físico ou relação sexual.',
  },
  {
    id: 'tratamentos',
    label: '+ Tratamentos Prévios',
    text: 'Fez uso empírico prévio de medicamentos sem resolução satisfatória.',
  },
  {
    id: 'nega_sistemicos',
    label: '+ Nega Sistêmicos',
    text: 'Nega febre, disúria, hematúria ou alterações do hábito intestinal associadas.',
  },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function GuidedHmaEditor({ value, onChange, disabled = false }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertSnippet = (snippetText: string) => {
    if (disabled) return;
    const el = textareaRef.current;
    if (!el) {
      const nextValue = value ? `${value}\n${snippetText}` : snippetText;
      onChange(nextValue);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const prefix = before.length > 0 && !before.endsWith('\n') && !before.endsWith(' ') ? ' ' : '';
    const nextValue = `${before}${prefix}${snippetText}${after ? ' ' + after : ''}`;

    onChange(nextValue);
    setTimeout(() => {
      el.focus();
      const newPos = start + prefix.length + snippetText.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div className="guided-hma-editor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <label htmlFor="hma-textarea" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)', margin: 0 }}>
          História da Moléstia Atual (HMA) Estruturada
        </label>

        {/* Pílulas de Inserção Rápida */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {HMA_CLINICAL_SNIPPETS.map((snippet) => (
            <button
              key={snippet.id}
              type="button"
              disabled={disabled}
              onClick={() => insertSnippet(snippet.text)}
              className="hma-snippet-btn"
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm, 4px)',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                color: 'var(--color-primary-dark, #6F217B)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s ease',
              }}
              title={`Inserir: "${snippet.text}"`}
            >
              {snippet.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        id="hma-textarea"
        ref={textareaRef}
        className="form__textarea"
        rows={4}
        placeholder="Descreva a cronologia dos sintomas, intensidade, fatores agravantes, tratamentos anteriores e repercussão clínica..."
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          lineHeight: 1.5,
          fontSize: '0.9rem',
        }}
      />
    </div>
  );
}

