export interface PrescriptionsAndOrientationsSectionProps {
  prescriptionNotes: string;
  onPrescriptionNotesChange: (val: string) => void;
  generalOrientationNotes: string;
  onGeneralOrientationNotesChange: (val: string) => void;
  disabled?: boolean;
  onEmitPrescription?: (type: 'receita_simples' | 'receita_controle_especial') => void;
}

export const COMMON_PRESCRIPTION_TEMPLATES = [
  {
    id: 'anticoncepcional',
    label: '+ Anticoncepcional Oral',
    text: '1. Desogestrel 75mcg (ou combinado equivalente) — Tomar 1 comprimido por via oral diariamente sempre no mesmo horário, sem interrupções.',
  },
  {
    id: 'creme_vaginal',
    label: '+ Miconazol Creme',
    text: '1. Nitrato de Miconazol creme vaginal 2% — Aplicar 1 aplicador cheio via vaginal profunda à noite ao deitar, por 7 noites consecutivas.',
  },
  {
    id: 'analgesia_colica',
    label: '+ Analgesia Cólica / AINE',
    text: '1. Ibuprofeno 400mg — Tomar 1 comprimido via oral de 8/8h em caso de dor ou cólica menstrual intensa, por até 3 a 5 dias.',
  },
  {
    id: 'prenatal_folico',
    label: '+ Ácido Fólico / Ferro',
    text: '1. Ácido Fólico 5mg — Tomar 1 comprimido via oral 1 vez ao dia.\n2. Sulfato Ferroso 40mg (Fe elementar) — Tomar 1 comprimido via oral 1 vez ao dia, 30 min antes do almoço.',
  },
];

export const COMMON_ORIENTATION_TEMPLATES = [
  {
    id: 'higiene_intima',
    label: '+ Higiene Íntima & Hábitos',
    text: 'Orientações de saúde íntima: dar preferência a roupas íntimas de algodão, evitar protetores diários impermeáveis contínuos e higienizar externamente com sabonete neutro líquido.',
  },
  {
    id: 'retorno_exames',
    label: '+ Retorno com Exames',
    text: 'Retornar em 30 a 45 dias para avaliação dos resultados dos exames solicitados e revisão da conduta.',
  },
  {
    id: 'cuidados_diu',
    label: '+ Cuidados Pós-DIU',
    text: 'Cuidados pós-inserção de DIU: repouso relativo no dia de hoje, evitar esforço físico intenso por 24h e agendar USG de controle em 30 a 45 dias.',
  },
];

export function PrescriptionsAndOrientationsSection({
  prescriptionNotes,
  onPrescriptionNotesChange,
  generalOrientationNotes,
  onGeneralOrientationNotesChange,
  disabled = false,
  onEmitPrescription,
}: PrescriptionsAndOrientationsSectionProps) {
  const appendText = (current: string, updater: (val: string) => void, snippet: string) => {
    if (disabled) return;
    const prefix = current && !current.endsWith('\n') && !current.endsWith(' ') ? '\n\n' : '';
    updater(`${current}${prefix}${snippet}`);
  };

  return (
    <div
      id="sec-presc"
      className="card gyn-prescriptions-card"
      style={{
        border: '1px solid var(--color-neutral-border, #CBD5E1)',
        borderRadius: 'var(--radius-lg, 12px)',
        background: '#ffffff',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.3rem' }}>💊</span>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark, #6F217B)', margin: 0, fontWeight: 700 }}>
            Prescrições Segregadas & Recomendações Assistenciais
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted, #64748B)' }}>
            Distinção clara entre receitas médicas terapêuticas e orientações de autocuidado/retornos
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Prescrição Medicamentosa */}
        <div className="form__group" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <label className="form__label" htmlFor="presc-meds" style={{ fontWeight: 700, color: 'var(--color-primary-dark, #6F217B)', margin: 0 }}>
              Prescrição Medicamentosa (Fármacos & Doses)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {COMMON_PRESCRIPTION_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => appendText(prescriptionNotes, onPrescriptionNotesChange, tmpl.text)}
                  className="hma-snippet-btn"
                  style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                  title={`Inserir: "${tmpl.text}"`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="presc-meds"
            className="form__textarea"
            rows={5}
            placeholder="Ex.: 1. Anticoncepcional oral combinado - 1 cp/dia por 21 dias...\n2. Analgésico se dor..."
            value={prescriptionNotes}
            disabled={disabled}
            onChange={(e) => onPrescriptionNotesChange(e.target.value)}
            style={{ width: '100%', fontSize: '0.875rem', lineHeight: 1.5, flex: 1 }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => onEmitPrescription?.('receita_simples')}
              disabled={disabled || !prescriptionNotes.trim()}
              title="Emitir receita simples preenchida com as anotações acima"
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              📄 Emitir Receita Médica
            </button>
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => onEmitPrescription?.('receita_controle_especial')}
              disabled={disabled || !prescriptionNotes.trim()}
              title="Emitir receita de controle especial em 2 vias (Portaria 344/98)"
              style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              📑 Receita Especial (2 Vias)
            </button>
          </div>
        </div>

        {/* Orientações Gerais & Estilo de Vida */}
        <div className="form__group" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <label className="form__label" htmlFor="presc-orientations" style={{ fontWeight: 700, color: 'var(--color-primary-dark, #6F217B)', margin: 0 }}>
              Orientações Gerais, Estilo de Vida & Retornos
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {COMMON_ORIENTATION_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => appendText(generalOrientationNotes, onGeneralOrientationNotesChange, tmpl.text)}
                  className="hma-snippet-btn"
                  style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                  title={`Inserir: "${tmpl.text}"`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            id="presc-orientations"
            className="form__textarea"
            rows={5}
            placeholder="Ex.: Retorno com USG transvaginal em 30 dias. Manter hidratação adequada e prática de atividades físicas..."
            value={generalOrientationNotes}
            disabled={disabled}
            onChange={(e) => onGeneralOrientationNotesChange(e.target.value)}
            style={{ width: '100%', fontSize: '0.875rem', lineHeight: 1.5, flex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}

