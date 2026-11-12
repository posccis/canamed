import { useState, useMemo } from 'react';
import { createLarcRecord, type LarcPlacementDto } from './larcApi';

export interface GynecologicalProceduresSectionProps {
  procedurePerformed: string;
  onProcedurePerformedChange: (val: string) => void;
  procedureBatch: string;
  onProcedureBatchChange: (val: string) => void;
  procedureNotes: string;
  onProcedureNotesChange: (val: string) => void;
  patientId?: string;
  medicalRecordId?: string;
  onLarcCreated?: (record: LarcPlacementDto) => void;
  disabled?: boolean;
}

export const COMMON_GYNECOLOGICAL_PROCEDURES = [
  { id: 'diu_cobre', label: 'Inserção de DIU de Cobre', category: 'larc' },
  { id: 'diu_hormonal', label: 'Inserção de DIU Hormonal (Mirena/Kyleena)', category: 'larc' },
  { id: 'implanon', label: 'Inserção de Implante (Implanon)', category: 'larc' },
  { id: 'retirada_diu', label: 'Retirada de DIU', category: 'larc' },
  { id: 'biopsia_colo', label: 'Biópsia de Colo Uterino', category: 'biopsia' },
  { id: 'biopsia_endometrio', label: 'Biópsia de Endométrio (Pipelle)', category: 'biopsia' },
  { id: 'cauterizacao', label: 'Cauterização Química de Colo', category: 'ambulatorial' },
  { id: 'citopatologico', label: 'Coleta de Citopatológico', category: 'preventivo' },
];

function getLarcValidityYears(type: string): number {
  switch (type.toLowerCase()) {
    case 'implanon':
      return 3;
    case 'diu_prata':
    case 'kyleena':
      return 5;
    case 'mirena':
      return 8;
    case 'diu_cobre':
      return 10;
    default:
      return 5;
  }
}

export function GynecologicalProceduresSection({
  procedurePerformed,
  onProcedurePerformedChange,
  procedureBatch,
  onProcedureBatchChange,
  procedureNotes,
  onProcedureNotesChange,
  patientId,
  medicalRecordId,
  onLarcCreated,
  disabled = false,
}: GynecologicalProceduresSectionProps) {
  const isLarc =
    procedurePerformed.toLowerCase().includes('diu') ||
    procedurePerformed.toLowerCase().includes('implante') ||
    procedurePerformed.toLowerCase().includes('implanon');

  const [larcDeviceType, setLarcDeviceType] = useState('mirena');
  const [hysterometryCm, setHysterometryCm] = useState('7.5');
  const [insertionDate, setInsertionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSavingLarc, setIsSavingLarc] = useState(false);
  const [larcSuccess, setLarcSuccess] = useState<string | null>(null);

  const larcDates = useMemo(() => {
    const base = insertionDate ? new Date(insertionDate) : new Date();
    const years = getLarcValidityYears(larcDeviceType);
    const exp = new Date(base);
    exp.setFullYear(exp.getFullYear() + years);

    const usg = new Date(base);
    usg.setDate(usg.getDate() + 30);

    return {
      expirationDate: exp.toISOString().split('T')[0],
      controlUsgDate: usg.toISOString().split('T')[0],
      validityYears: years,
    };
  }, [larcDeviceType, insertionDate]);

  const insertSnippetIntoNotes = (snippet: string) => {
    if (disabled) return;
    const prefix = procedureNotes && !procedureNotes.endsWith('\n') && !procedureNotes.endsWith(' ') ? ' ' : '';
    onProcedureNotesChange(`${procedureNotes}${prefix}${snippet}`);
  };

  const handleRegisterLarc = async () => {
    if (!patientId || disabled) return;
    try {
      setIsSavingLarc(true);
      setLarcSuccess(null);
      const res = await createLarcRecord(patientId, {
        medicalRecordId,
        deviceType: larcDeviceType,
        batchNumber: procedureBatch || 'LOTE-PADRAO',
        insertionDate,
        hysterometryCm: parseFloat(hysterometryCm) || 7.5,
        procedureNotes,
      });
      setLarcSuccess(`LARC registrado com sucesso! Validade até ${res.expirationDate} e USG de controle em ${res.controlUltrasoundDate}.`);
      if (onLarcCreated) onLarcCreated(res);
    } catch {
      setLarcSuccess('Erro ao registrar LARC na API. Tente novamente.');
    } finally {
      setIsSavingLarc(false);
    }
  };

  return (
    <div
      id="sec-proc"
      className="card gyn-procedures-card"
      style={{
        border: '1px solid var(--color-neutral-border, #CBD5E1)',
        borderRadius: 'var(--radius-lg, 12px)',
        background: '#ffffff',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>💉</span>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark, #6F217B)', margin: 0, fontWeight: 700 }}>
              Procedimentos Ambulatoriais Especializados
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-neutral-muted, #64748B)' }}>
              Registro de procedimentos clínicos, dispositivos intrauterinos (LARCs) e biópsias
            </span>
          </div>
        </div>

        {procedurePerformed && (
          <button
            type="button"
            className="button button--ghost button--small"
            onClick={() => {
              onProcedurePerformedChange('');
              onProcedureBatchChange('');
              onProcedureNotesChange('');
              setLarcSuccess(null);
            }}
            style={{ fontSize: '0.75rem', color: '#DC2626' }}
            disabled={disabled}
          >
            ✕ Limpar Procedimento
          </button>
        )}
      </div>

      {/* Chips Rápidos de Procedimentos Frequentes */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-muted, #64748B)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
          Selecione um procedimento para preenchimento rápido:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {COMMON_GYNECOLOGICAL_PROCEDURES.map((item) => {
            const isSelected = procedurePerformed === item.label;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (isSelected) {
                    onProcedurePerformedChange('');
                  } else {
                    onProcedurePerformedChange(item.label);
                    if (item.category === 'larc' && !procedureNotes) {
                      onProcedureNotesChange('Procedimento realizado sob técnica asséptica estrita. Boa tolerância da paciente, sem intercorrências vaso-vagais.');
                    } else if (item.category === 'biopsia' && !procedureNotes) {
                      onProcedureNotesChange('Biópsia orientada sem sangramento ativo pós-procedimento. Material enviado para anatomopatológico.');
                    }
                  }
                }}
                className={`complaint-chip ${isSelected ? 'complaint-chip--active' : ''}`}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  padding: '0.35rem 0.65rem',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid var(--color-brand-primary, #852A91)' : '1px solid #CBD5E1',
                  background: isSelected ? 'var(--color-brand-surface-accent, #F7ECF8)' : '#F8FAFC',
                  color: isSelected ? 'var(--color-primary-dark, #6F217B)' : '#334155',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                <span>{item.label}</span>
                {isSelected && <span style={{ marginLeft: '0.2rem' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos Principais do Procedimento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
        <div>
          <label className="form__label" htmlFor="gyn-procedure-select" style={{ fontWeight: 600 }}>
            Procedimento Realizado
          </label>
          <select
            id="gyn-procedure-select"
            className="form__select"
            value={procedurePerformed}
            disabled={disabled}
            onChange={(e) => onProcedurePerformedChange(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">Nenhum procedimento realizado</option>
            {COMMON_GYNECOLOGICAL_PROCEDURES.map((p) => (
              <option key={p.id} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form__label" htmlFor="gyn-procedure-batch" style={{ fontWeight: 600 }}>
            Lote / Validade do Dispositivo / Amostra
          </label>
          <input
            id="gyn-procedure-batch"
            type="text"
            className="form__input"
            placeholder="Ex.: Lote: DIU-9821, Val: 08/2030"
            value={procedureBatch}
            disabled={disabled}
            onChange={(e) => onProcedureBatchChange(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Bloco Estruturado Especializado de LARC (DIU / Implante) */}
      {isLarc && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            padding: '0.9rem',
            marginBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🌀</span>
            <strong style={{ fontSize: '0.9rem', color: '#166534' }}>
              Rastreabilidade e Controle de Dispositivo LARC (RN-013)
            </strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label htmlFor="larc-device-type" className="form__label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Dispositivo LARC
              </label>
              <select
                id="larc-device-type"
                className="form__select"
                value={larcDeviceType}
                disabled={disabled}
                onChange={(e) => setLarcDeviceType(e.target.value)}
                style={{ width: '100%', fontSize: '0.825rem' }}
              >
                <option value="mirena">DIU Hormonal Mirena (8 anos)</option>
                <option value="kyleena">DIU Hormonal Kyleena (5 anos)</option>
                <option value="diu_cobre">DIU de Cobre TCu 380A (10 anos)</option>
                <option value="diu_prata">DIU de Cobre com Prata (5 anos)</option>
                <option value="implanon">Implante Subdérmico Implanon (3 anos)</option>
              </select>
            </div>

            <div>
              <label htmlFor="larc-hysterometry" className="form__label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Histerometria (cm)
              </label>
              <input
                id="larc-hysterometry"
                type="number"
                step="0.1"
                min="5"
                max="12"
                className="form__input"
                value={hysterometryCm}
                disabled={disabled}
                onChange={(e) => setHysterometryCm(e.target.value)}
                style={{ width: '100%', fontSize: '0.825rem' }}
              />
            </div>

            <div>
              <label htmlFor="larc-insertion-date" className="form__label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Data da Inserção
              </label>
              <input
                id="larc-insertion-date"
                type="date"
                className="form__input"
                value={insertionDate}
                disabled={disabled}
                onChange={(e) => setInsertionDate(e.target.value)}
                style={{ width: '100%', fontSize: '0.825rem' }}
              />
            </div>
          </div>

          {/* Badges de Validade e USG de Controle */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: '#DCFCE7',
                border: '1px solid #22C55E',
                color: '#15803D',
              }}
            >
              📅 Validade Calculada: <strong>{larcDates.expirationDate}</strong> ({larcDates.validityYears} anos)
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: '#FEF3C7',
                border: '1px solid #F59E0B',
                color: '#B45309',
              }}
            >
              🔍 USG de Controle: <strong>{larcDates.controlUsgDate}</strong> (30 dias pós-inserção)
            </span>
          </div>

          {patientId && (
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={disabled || isSavingLarc}
                onClick={handleRegisterLarc}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-brand-primary, #852A91)',
                  color: '#ffffff',
                  cursor: disabled || isSavingLarc ? 'not-allowed' : 'pointer',
                }}
              >
                {isSavingLarc ? 'Registrando LARC...' : '💾 Salvar Registro de LARC'}
              </button>
              {larcSuccess && (
                <span style={{ marginLeft: '0.6rem', fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                  {larcSuccess}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detalhamento Clínico e Snippets Especializados */}
      {procedurePerformed && (
        <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '0.5rem' }}>
          {/* Pílulas de Apoio Específicas para DIU / LARCs */}
          {isLarc && (
            <div style={{ marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-primary-dark, #6F217B)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                Atalhos Rápidos de Parâmetros de Inserção:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="hma-snippet-btn"
                  onClick={() => insertSnippetIntoNotes('Histerometria: 7.0 cm.')}
                  style={{ fontSize: '0.73rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                >
                  + Histerometria 7.0 cm
                </button>
                <button
                  type="button"
                  className="hma-snippet-btn"
                  onClick={() => insertSnippetIntoNotes('Histerometria: 7.5 cm.')}
                  style={{ fontSize: '0.73rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                >
                  + Histerometria 7.5 cm
                </button>
                <button
                  type="button"
                  className="hma-snippet-btn"
                  onClick={() => insertSnippetIntoNotes('Fios visíveis cortados a 2.5 cm do orifício externo do colo.')}
                  style={{ fontSize: '0.73rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                >
                  + Fios cortados a 2.5 cm
                </button>
                <button
                  type="button"
                  className="hma-snippet-btn"
                  onClick={() => insertSnippetIntoNotes('Procedimento bem tolerado, sem queixas álgicas significativas.')}
                  style={{ fontSize: '0.73rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#FFFFFF', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                >
                  + Boa tolerância
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="form__label" htmlFor="gyn-proc-notes" style={{ fontWeight: 600, fontSize: '0.825rem' }}>
              Notas do Procedimento, Tolerância & Intercorrências
            </label>
            <textarea
              id="gyn-proc-notes"
              className="form__textarea"
              rows={3}
              placeholder="Descreva a tolerância da paciente, posicionamento do dispositivo, hemostasia, histerometria e orientações..."
              value={procedureNotes}
              disabled={disabled}
              onChange={(e) => onProcedureNotesChange(e.target.value)}
              style={{ width: '100%', fontSize: '0.875rem' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

