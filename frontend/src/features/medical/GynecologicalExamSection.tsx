export interface GynecologicalExamState {
  breastsIsNormal: boolean;
  breastsFindings: string;
  abdomenIsNormal: boolean;
  abdomenFindings: string;
  externalGenitaliaIsNormal: boolean;
  externalGenitaliaFindings: string;
  speculumExamIsNormal: boolean;
  speculumExamFindings: string;
  bimanualPalpationIsNormal: boolean;
  bimanualPalpationFindings: string;
}

interface Props {
  exam: GynecologicalExamState;
  onChange: (updated: GynecologicalExamState) => void;
  readOnly?: boolean;
}

interface ExamSegmentProps {
  title: string;
  isNormal: boolean;
  findings: string;
  abnormalPlaceholder?: string;
  onToggle: (normal: boolean) => void;
  onFindingsChange: (text: string) => void;
  readOnly?: boolean;
}

function ExamSegment({
  title,
  isNormal,
  findings,
  abnormalPlaceholder = 'Descreva os achados clínicos detalhados...',
  onToggle,
  onFindingsChange,
  readOnly,
}: ExamSegmentProps) {
  return (
    <div
      style={{
        border: '1px solid var(--color-neutral-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        background: isNormal ? '#ffffff' : '#fffaf0',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isNormal && !findings ? 0 : '0.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>
          {title}
        </strong>

        {!readOnly && (
          <div
            style={{
              display: 'inline-flex',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-neutral-border)',
              overflow: 'hidden',
              fontSize: '0.8rem',
            }}
          >
            <button
              type="button"
              onClick={() => onToggle(true)}
              style={{
                padding: '0.25rem 0.65rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isNormal ? 700 : 400,
                background: isNormal ? 'var(--color-primary)' : '#ffffff',
                color: isNormal ? '#ffffff' : 'var(--color-neutral-dark)',
                transition: 'background 0.15s ease',
              }}
            >
              ✅ Normal / Sem alterações
            </button>
            <button
              type="button"
              onClick={() => onToggle(false)}
              style={{
                padding: '0.25rem 0.65rem',
                border: 'none',
                borderLeft: '1px solid var(--color-neutral-border)',
                cursor: 'pointer',
                fontWeight: !isNormal ? 700 : 400,
                background: !isNormal ? '#dd6b20' : '#ffffff',
                color: !isNormal ? '#ffffff' : 'var(--color-neutral-dark)',
                transition: 'background 0.15s ease',
              }}
            >
              ⚠️ Detalhar achado
            </button>
          </div>
        )}

        {readOnly && (
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: isNormal ? '#c6f6d5' : '#feebc8',
              color: isNormal ? '#22543d' : '#744210',
            }}
          >
            {isNormal ? '✅ Normal' : '⚠️ Alterado'}
          </span>
        )}
      </div>

      {!isNormal && (
        <div style={{ marginTop: '0.5rem' }}>
          {readOnly ? (
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2d3748', whiteSpace: 'pre-wrap' }}>
              {findings || '(Sem descrição detalhada)'}
            </p>
          ) : (
            <textarea
              className="form__textarea"
              rows={2}
              placeholder={abnormalPlaceholder}
              value={findings}
              onChange={(e) => onFindingsChange(e.target.value)}
              style={{
                borderColor: '#dd6b20',
                background: '#ffffff',
                fontSize: '0.875rem',
                marginTop: '0.25rem',
              }}
            />
          )}
        </div>
      )}

      {isNormal && findings && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-neutral-muted)', fontStyle: 'italic' }}>
          Obs: {findings}
        </p>
      )}
    </div>
  );
}

export function GynecologicalExamSection({ exam, onChange, readOnly }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <ExamSegment
        title="1. Exame das Mamas (Inspeção estática/dinâmica e Palpação)"
        isNormal={exam.breastsIsNormal}
        findings={exam.breastsFindings}
        abnormalPlaceholder="Descreva nódulos, retrações, alterações de pele ou descarga papilar por quadrante..."
        onToggle={(normal) => onChange({ ...exam, breastsIsNormal: normal })}
        onFindingsChange={(text) => onChange({ ...exam, breastsFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="2. Abdome (Inspeção, Palpação superficial/profunda)"
        isNormal={exam.abdomenIsNormal}
        findings={exam.abdomenFindings}
        abnormalPlaceholder="Descreva dor à palpação em fossas ilíacas, hipogástrio ou massas palpáveis..."
        onToggle={(normal) => onChange({ ...exam, abdomenIsNormal: normal })}
        onFindingsChange={(text) => onChange({ ...exam, abdomenFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="3. Genitália Externa / Vulva"
        isNormal={exam.externalGenitaliaIsNormal}
        findings={exam.externalGenitaliaFindings}
        abnormalPlaceholder="Descreva lesões tróficas, úlceras, fissuras, hiperemia, condilomas ou escoriações..."
        onToggle={(normal) => onChange({ ...exam, externalGenitaliaIsNormal: normal })}
        onFindingsChange={(text) => onChange({ ...exam, externalGenitaliaFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="4. Exame Especular (Colo Uterino e Conteúdo Vaginal)"
        isNormal={exam.speculumExamIsNormal}
        findings={exam.speculumExamFindings}
        abnormalPlaceholder="Descreva aspecto do colo (ectopia, sangramento ao contato, pólipos) e secreção vaginal (cor, aspecto, odor)..."
        onToggle={(normal) => onChange({ ...exam, speculumExamIsNormal: normal })}
        onFindingsChange={(text) => onChange({ ...exam, speculumExamFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="5. Toque Bimanual (Útero e Anexos)"
        isNormal={exam.bimanualPalpationIsNormal}
        findings={exam.bimanualPalpationFindings}
        abnormalPlaceholder="Descreva volume uterino (habitual/aumentado), mobilidade, dor à mobilização de colo e massas anexiais..."
        onToggle={(normal) => onChange({ ...exam, bimanualPalpationIsNormal: normal })}
        onFindingsChange={(text) => onChange({ ...exam, bimanualPalpationFindings: text })}
        readOnly={readOnly}
      />
    </div>
  );
}
