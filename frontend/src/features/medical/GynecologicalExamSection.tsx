import { useState } from 'react';
import { CervicalClockMap } from './CervicalClockMap';

export type PhysicalExamStatus = 'NotEvaluated' | 'Normal' | 'Abnormal';

export interface GynecologicalExamState {
  breastsStatus?: PhysicalExamStatus;
  breastsFindings: string;
  abdomenStatus?: PhysicalExamStatus;
  abdomenFindings: string;
  externalGenitaliaStatus?: PhysicalExamStatus;
  externalGenitaliaFindings: string;
  speculumExamStatus?: PhysicalExamStatus;
  speculumExamFindings: string;
  bimanualPalpationStatus?: PhysicalExamStatus;
  bimanualPalpationFindings: string;
  cervicalClockFindingsJson?: string;
  // Retrocompatibilidade
  breastsIsNormal?: boolean;
  abdomenIsNormal?: boolean;
  externalGenitaliaIsNormal?: boolean;
  speculumExamIsNormal?: boolean;
  bimanualPalpationIsNormal?: boolean;
}

interface Props {
  exam: GynecologicalExamState;
  onChange: (updated: GynecologicalExamState) => void;
  readOnly?: boolean;
}

interface ExamSegmentProps {
  title: string;
  status: PhysicalExamStatus;
  findings: string;
  abnormalPlaceholder?: string;
  onStatusChange: (status: PhysicalExamStatus) => void;
  onFindingsChange: (text: string) => void;
  readOnly?: boolean;
}

function resolveStatus(status?: PhysicalExamStatus, isNormal?: boolean): PhysicalExamStatus {
  if (status) return status;
  if (isNormal === true) return 'Normal';
  if (isNormal === false) return 'Abnormal';
  return 'NotEvaluated';
}

function ExamSegment({
  title,
  status,
  findings,
  abnormalPlaceholder = 'Descreva as alterações encontradas...',
  onStatusChange,
  onFindingsChange,
  readOnly,
}: ExamSegmentProps) {
  const isAbnormal = status === 'Abnormal';
  const isNormal = status === 'Normal';
  const isNotEvaluated = status === 'NotEvaluated';

  return (
    <div
      style={{
        border: '1px solid var(--color-neutral-border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        background: isAbnormal ? '#FFFDF5' : isNormal ? '#F0FDF9' : '#FFFFFF',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isAbnormal ? '0.5rem' : '0.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary-dark, #6F217B)' }}>
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
              onClick={() => onStatusChange('NotEvaluated')}
              style={{
                padding: '0.3rem 0.65rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isNotEvaluated ? 700 : 400,
                background: isNotEvaluated ? '#E2E8F0' : '#ffffff',
                color: isNotEvaluated ? '#1A202C' : 'var(--color-neutral-dark)',
                transition: 'background 0.15s ease',
              }}
            >
              ⚪ Não Avaliado
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('Normal')}
              style={{
                padding: '0.3rem 0.65rem',
                border: 'none',
                borderLeft: '1px solid var(--color-neutral-border)',
                cursor: 'pointer',
                fontWeight: isNormal ? 700 : 400,
                background: isNormal ? 'var(--color-brand-primary, #852A91)' : '#ffffff',
                color: isNormal ? '#ffffff' : 'var(--color-neutral-dark)',
                transition: 'background 0.15s ease',
              }}
            >
              🟢 Normal
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('Abnormal')}
              style={{
                padding: '0.3rem 0.65rem',
                border: 'none',
                borderLeft: '1px solid var(--color-neutral-border)',
                cursor: 'pointer',
                fontWeight: isAbnormal ? 700 : 400,
                background: isAbnormal ? '#B45309' : '#ffffff',
                color: isAbnormal ? '#ffffff' : 'var(--color-neutral-dark)',
                transition: 'background 0.15s ease',
              }}
            >
              🟠 Alterado
            </button>
          </div>
        )}

        {readOnly && (
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              background: isNormal ? '#C6F6D5' : isAbnormal ? '#FEEBC8' : '#EDF2F7',
              color: isNormal ? '#22543D' : isAbnormal ? '#744210' : '#4A5568',
            }}
          >
            {isNormal ? '🟢 Normal' : isAbnormal ? '🟠 Alterado' : '⚪ Não Avaliado'}
          </span>
        )}
      </div>

      {isAbnormal && (
        <div style={{ marginTop: '0.5rem' }}>
          {readOnly ? (
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2d3748', whiteSpace: 'pre-wrap' }}>
              {findings || '(Sem descrição detalhada)'}
            </p>
          ) : (
            <div>
              <textarea
                className="form__textarea"
                rows={2}
                placeholder={abnormalPlaceholder}
                value={findings}
                onChange={(e) => onFindingsChange(e.target.value)}
                style={{
                  width: '100%',
                  borderColor: !findings.trim() ? '#E53E3E' : '#B45309',
                  background: '#ffffff',
                  fontSize: '0.875rem',
                  marginTop: '0.25rem',
                }}
              />
              {!findings.trim() && (
                <span
                  style={{
                    color: '#C53030',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    display: 'block',
                    marginTop: '0.25rem',
                  }}
                >
                  ⚠️ Detalhamento obrigatório: descreva as alterações encontradas.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {isNormal && findings && (
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-neutral-muted)', fontStyle: 'italic' }}>
          Obs: {findings}
        </p>
      )}
    </div>
  );
}

export function GynecologicalExamSection({ exam, onChange, readOnly }: Props) {
  const [showCervicalMap, setShowCervicalMap] = useState(false);
  const [cervicalHours, setCervicalHours] = useState<number[]>([]);
  const [ztType, setZtType] = useState('1');

  const breastsStatus = resolveStatus(exam.breastsStatus, exam.breastsIsNormal);
  const abdomenStatus = resolveStatus(exam.abdomenStatus, exam.abdomenIsNormal);
  const externalGenitaliaStatus = resolveStatus(exam.externalGenitaliaStatus, exam.externalGenitaliaIsNormal);
  const speculumExamStatus = resolveStatus(exam.speculumExamStatus, exam.speculumExamIsNormal);
  const bimanualPalpationStatus = resolveStatus(exam.bimanualPalpationStatus, exam.bimanualPalpationIsNormal);
  const isCervicalMapExpanded = showCervicalMap || speculumExamStatus === 'Abnormal';

  const handleCervicalHoursChange = (hours: number[]) => {
    setCervicalHours(hours);
    const hoursSummary = hours.length > 0 ? ` [Mapa Cervical: lesão/achado em ${hours.map((h) => `${h}h`).join(', ')} - ZT tipo ${ztType}]` : '';
    const baseText = exam.speculumExamFindings.replace(/\s*\[Mapa Cervical:.*?\]/g, '');
    onChange({
      ...exam,
      speculumExamFindings: `${baseText}${hoursSummary}`.trim(),
    });
  };

  const handleZtChange = (newZt: string) => {
    setZtType(newZt);
    const hoursSummary = cervicalHours.length > 0 ? ` [Mapa Cervical: lesão/achado em ${cervicalHours.map((h) => `${h}h`).join(', ')} - ZT tipo ${newZt}]` : '';
    const baseText = exam.speculumExamFindings.replace(/\s*\[Mapa Cervical:.*?\]/g, '');
    onChange({
      ...exam,
      speculumExamFindings: `${baseText}${hoursSummary}`.trim(),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <ExamSegment
        title="1. Exame das Mamas (Inspeção estática/dinâmica e Palpação)"
        status={breastsStatus}
        findings={exam.breastsFindings}
        abnormalPlaceholder="Descreva nódulos, retrações, alterações de pele ou descarga papilar por quadrante..."
        onStatusChange={(status) =>
          onChange({
            ...exam,
            breastsStatus: status,
            breastsIsNormal: status === 'Normal',
            breastsFindings: status === 'Normal' ? '' : exam.breastsFindings,
          })
        }
        onFindingsChange={(text) => onChange({ ...exam, breastsFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="2. Abdome (Inspeção, Palpação superficial/profunda)"
        status={abdomenStatus}
        findings={exam.abdomenFindings}
        abnormalPlaceholder="Descreva dor à palpação em fossas ilíacas, hipogástrio ou massas palpáveis..."
        onStatusChange={(status) =>
          onChange({
            ...exam,
            abdomenStatus: status,
            abdomenIsNormal: status === 'Normal',
            abdomenFindings: status === 'Normal' ? '' : exam.abdomenFindings,
          })
        }
        onFindingsChange={(text) => onChange({ ...exam, abdomenFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="3. Genitália Externa / Vulva"
        status={externalGenitaliaStatus}
        findings={exam.externalGenitaliaFindings}
        abnormalPlaceholder="Descreva lesões tróficas, úlceras, fissuras, hiperemia, condilomas ou escoriações..."
        onStatusChange={(status) =>
          onChange({
            ...exam,
            externalGenitaliaStatus: status,
            externalGenitaliaIsNormal: status === 'Normal',
            externalGenitaliaFindings: status === 'Normal' ? '' : exam.externalGenitaliaFindings,
          })
        }
        onFindingsChange={(text) => onChange({ ...exam, externalGenitaliaFindings: text })}
        readOnly={readOnly}
      />

      <ExamSegment
        title="4. Exame Especular (Colo Uterino e Conteúdo Vaginal)"
        status={speculumExamStatus}
        findings={exam.speculumExamFindings}
        abnormalPlaceholder="Descreva aspecto do colo (ectopia, sangramento ao contato, pólipos) e secreção vaginal (cor, aspecto, odor)..."
        onStatusChange={(status) => {
          if (status === 'Abnormal') {
            setShowCervicalMap(true);
          }
          onChange({
            ...exam,
            speculumExamStatus: status,
            speculumExamIsNormal: status === 'Normal',
            speculumExamFindings: status === 'Normal' ? '' : exam.speculumExamFindings,
          });
        }}
        onFindingsChange={(text) => onChange({ ...exam, speculumExamFindings: text })}
        readOnly={readOnly}
      />

      {/* Botão e visualizador colposcópico interativo do Mapa Cervical 12h */}
      <div style={{ marginLeft: '1rem', marginTop: '-0.25rem' }}>
        <button
          type="button"
          className="button button--ghost button--small"
          style={{ fontSize: '0.8rem', color: 'var(--color-primary-dark, #6F217B)', fontWeight: 600 }}
          onClick={() => setShowCervicalMap(!isCervicalMapExpanded)}
        >
          {isCervicalMapExpanded ? '▲ Ocultar Mapa Cervical 12h' : '🎯 Abrir Mapa Cervical 12h (Odontograma Colposcópico)'}
        </button>
        {isCervicalMapExpanded && (
          <div style={{ marginTop: '0.5rem', maxWidth: '420px' }}>
            <CervicalClockMap
              selectedHours={cervicalHours}
              ztType={ztType}
              readOnly={readOnly}
              onChange={handleCervicalHoursChange}
              onZtChange={handleZtChange}
              onFindingsChange={(findings) => {
                onChange({
                  ...exam,
                  cervicalClockFindingsJson: JSON.stringify(findings),
                });
              }}
            />
          </div>
        )}
      </div>

      <ExamSegment
        title="5. Toque Bimanual (Útero e Anexos)"
        status={bimanualPalpationStatus}
        findings={exam.bimanualPalpationFindings}
        abnormalPlaceholder="Descreva volume uterino (habitual/aumentado), mobilidade, dor à mobilização de colo e massas anexiais..."
        onStatusChange={(status) =>
          onChange({
            ...exam,
            bimanualPalpationStatus: status,
            bimanualPalpationIsNormal: status === 'Normal',
            bimanualPalpationFindings: status === 'Normal' ? '' : exam.bimanualPalpationFindings,
          })
        }
        onFindingsChange={(text) => onChange({ ...exam, bimanualPalpationFindings: text })}
        readOnly={readOnly}
      />
    </div>
  );
}

