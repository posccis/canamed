import React, { useState, useMemo } from 'react';
import { Calculator, Calendar, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export interface ObstetricCalculatorWidgetProps {
  dum?: string | null;
  isDumUncertain?: boolean;
  firstUsgDate?: string | null;
  firstUsgWeeks?: number | null;
  firstUsgDays?: number | null;
  onApplyCalculatedValues?: (values: {
    effectiveGaWeeks: number;
    effectiveGaDays: number;
    effectiveEdd: string;
    preferredReference: 'dum' | 'ultrasound';
  }) => void;
  className?: string;
}

export const ObstetricCalculatorWidget: React.FC<ObstetricCalculatorWidgetProps> = ({
  dum,
  isDumUncertain = false,
  firstUsgDate: initialUsgDate,
  firstUsgWeeks: initialUsgWeeks,
  firstUsgDays: initialUsgDays,
  onApplyCalculatedValues,
  className = '',
}) => {
  // Estado local para inputs interativos de 1º USG (caso o médico queira informar no próprio widget)
  const [showUsgInputs, setShowUsgInputs] = useState(Boolean(initialUsgDate));
  const [usgDate, setUsgDate] = useState(initialUsgDate || '');
  const [usgWeeks, setUsgWeeks] = useState<number | ''>(
    initialUsgWeeks !== undefined && initialUsgWeeks !== null ? initialUsgWeeks : ''
  );
  const [usgDays, setUsgDays] = useState<number | ''>(
    initialUsgDays !== undefined && initialUsgDays !== null ? initialUsgDays : ''
  );

  const effectiveUsgDate = usgDate || initialUsgDate || null;
  const effectiveUsgWeeks = typeof usgWeeks === 'number' ? usgWeeks : (initialUsgWeeks ?? null);
  const effectiveUsgDays = typeof usgDays === 'number' ? usgDays : (initialUsgDays ?? null);

  const calculation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cálculo por DUM (Regra de Naegele)
    let naegeleEdd: Date | null = null;
    let gaDumWeeks: number | null = null;
    let gaDumDays: number | null = null;

    if (dum && !isDumUncertain) {
      const dumDate = new Date(dum + 'T00:00:00');
      if (!isNaN(dumDate.getTime())) {
        // Naegele: DUM + 7 dias - 3 meses + 1 ano
        const edd = new Date(dumDate);
        edd.setDate(edd.getDate() + 7);
        edd.setMonth(edd.getMonth() - 3);
        edd.setFullYear(edd.getFullYear() + 1);
        naegeleEdd = edd;

        const diffTime = today.getTime() - dumDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          gaDumWeeks = Math.floor(diffDays / 7);
          gaDumDays = diffDays % 7;
        }
      }
    }

    // 2. Cálculo por 1º USG Precoce
    let usgEdd: Date | null = null;
    let gaUsgWeeks: number | null = null;
    let gaUsgDays: number | null = null;

    if (effectiveUsgDate && effectiveUsgWeeks !== null) {
      const uDate = new Date(effectiveUsgDate + 'T00:00:00');
      if (!isNaN(uDate.getTime())) {
        const uDays = (effectiveUsgWeeks * 7) + (effectiveUsgDays || 0);
        const conceptionBasis = new Date(uDate);
        conceptionBasis.setDate(conceptionBasis.getDate() - uDays);

        const edd = new Date(conceptionBasis);
        edd.setDate(edd.getDate() + 280); // 40 semanas
        usgEdd = edd;

        const diffTime = today.getTime() - conceptionBasis.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0) {
          gaUsgWeeks = Math.floor(diffDays / 7);
          gaUsgDays = diffDays % 7;
        }
      }
    }

    // 3. Reconciliação FEBRASGO / ACOG
    let preferred: 'dum' | 'ultrasound' = 'dum';
    let explanation = '';
    let effectiveWeeks = 0;
    let effectiveDays = 0;
    let effectiveEdd: Date | null = null;

    if ((!dum || isDumUncertain) && gaUsgWeeks !== null) {
      preferred = 'ultrasound';
      explanation = 'Idade gestacional balizada exclusivamente pelo 1º USG (DUM desconhecida/incerta)';
      effectiveWeeks = gaUsgWeeks;
      effectiveDays = gaUsgDays || 0;
      effectiveEdd = usgEdd;
    } else if (gaDumWeeks !== null && gaUsgWeeks !== null) {
      const dumTotalDays = (gaDumWeeks * 7) + (gaDumDays || 0);
      const usgTotalDays = (gaUsgWeeks * 7) + (gaUsgDays || 0);
      const discrepancyDays = Math.abs(dumTotalDays - usgTotalDays);

      const measuredWeeksAtExam = effectiveUsgWeeks || 0;
      const isFirstTrimesterEarly = measuredWeeksAtExam <= 8;
      const threshold = isFirstTrimesterEarly ? 5 : 7;

      if (discrepancyDays > threshold) {
        preferred = 'ultrasound';
        explanation = `Discrepância de ${discrepancyDays} dias (> ${threshold}d) no 1º trimestre prioriza o 1º USG precoce`;
        effectiveWeeks = gaUsgWeeks;
        effectiveDays = gaUsgDays || 0;
        effectiveEdd = usgEdd;
      } else {
        preferred = 'dum';
        explanation = `Discrepância de ${discrepancyDays} dias está dentro do limite (${threshold}d). Mantida a DUM oficial`;
        effectiveWeeks = gaDumWeeks;
        effectiveDays = gaDumDays || 0;
        effectiveEdd = naegeleEdd;
      }
    } else if (gaDumWeeks !== null) {
      preferred = 'dum';
      explanation = 'Cálculo padrão baseado na Regra de Naegele (DUM confirmada)';
      effectiveWeeks = gaDumWeeks;
      effectiveDays = gaDumDays || 0;
      effectiveEdd = naegeleEdd;
    }

    return {
      naegeleEdd,
      gaDumWeeks,
      gaDumDays,
      usgEdd,
      gaUsgWeeks,
      gaUsgDays,
      preferred,
      explanation,
      effectiveWeeks,
      effectiveDays,
      effectiveEdd,
    };
  }, [dum, isDumUncertain, effectiveUsgDate, effectiveUsgWeeks, effectiveUsgDays]);

  const handleApply = () => {
    if (onApplyCalculatedValues && calculation.effectiveEdd) {
      onApplyCalculatedValues({
        effectiveGaWeeks: calculation.effectiveWeeks,
        effectiveGaDays: calculation.effectiveDays,
        effectiveEdd: calculation.effectiveEdd.toISOString().slice(0, 10),
        preferredReference: calculation.preferred,
      });
    }
  };

  return (
    <div
      data-testid="obstetric-calculator-widget"
      className={`obstetric-calculator-card ${className}`}
      style={{
        background: '#FAFDFD',
        border: '1px solid #B2DFDB',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '1rem',
        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
      }}
    >
      {/* Cabeçalho do Widget */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #E0F2F1',
          paddingBottom: '0.65rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: '8px',
              background: 'rgba(0, 128, 128, 0.1)',
              color: 'var(--color-primary-dark, #6F217B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calculator style={{ width: '1.15rem', height: '1.15rem' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-primary-dark, #6F217B)', margin: 0 }}>
              Calculadora Obstétrica & Reconciliação FEBRASGO
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-neutral-muted, #64748B)', margin: 0 }}>
              Reconciliação automática da idade gestacional (DUM vs 1º USG CCN)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUsgInputs(!showUsgInputs)}
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-sm, 4px)',
            background: showUsgInputs ? '#E0F2F1' : '#FFFFFF',
            border: '1px solid #B2DFDB',
            color: 'var(--color-primary-dark, #6F217B)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span>{showUsgInputs ? '▲ Ocultar 1º USG' : '▼ Informar 1º USG (CCN)'}</span>
          {showUsgInputs ? <ChevronUp style={{ width: '0.85rem', height: '0.85rem' }} /> : <ChevronDown style={{ width: '0.85rem', height: '0.85rem' }} />}
        </button>
      </div>

      {/* Grid de Estimativas: DUM vs USG */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.825rem',
        }}
      >
        {/* Bloco DUM */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--color-neutral-border, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--color-neutral-muted, #64748B)', fontWeight: 600, fontSize: '0.75rem' }}>
              Estimativa por DUM
            </span>
            <Calendar style={{ width: '0.9rem', height: '0.9rem', color: 'var(--color-neutral-muted, #64748B)' }} />
          </div>

          {isDumUncertain || !dum ? (
            <div
              style={{
                color: '#92400E',
                background: '#FEF3C7',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginTop: '0.25rem',
              }}
            >
              <AlertCircle style={{ width: '0.9rem', height: '0.9rem', flexShrink: 0 }} />
              <span>DUM incerta ou desconhecida</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark, #6F217B)' }}>
                {calculation.gaDumWeeks !== null
                  ? `${calculation.gaDumWeeks}s ${calculation.gaDumDays}d`
                  : 'Data futura'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-muted, #64748B)', marginTop: '0.2rem' }}>
                DPP (Naegele):{' '}
                <strong style={{ color: '#1E293B' }}>
                  {calculation.naegeleEdd?.toLocaleDateString('pt-BR') || '-'}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* Bloco 1º USG */}
        <div
          style={{
            background: '#FFFFFF',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--color-neutral-border, #E2E8F0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--color-neutral-muted, #64748B)', fontWeight: 600, fontSize: '0.75rem' }}>
              Estimativa por 1º USG Precoce
            </span>
            <CheckCircle2 style={{ width: '0.9rem', height: '0.9rem', color: 'var(--color-brand-primary, #852A91)' }} />
          </div>

          {calculation.gaUsgWeeks !== null ? (
            <>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary-dark, #6F217B)' }}>
                {calculation.gaUsgWeeks}s {calculation.gaUsgDays}d
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-muted, #64748B)', marginTop: '0.2rem' }}>
                DPP por USG:{' '}
                <strong style={{ color: '#1E293B' }}>
                  {calculation.usgEdd?.toLocaleDateString('pt-BR') || '-'}
                </strong>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--color-neutral-muted, #94A3B8)', fontSize: '0.75rem', padding: '0.5rem 0' }}>
              Nenhum USG inicial informado
            </div>
          )}
        </div>
      </div>

      {/* Painel de Entrada de Dados do 1º USG (Retrátil) */}
      {showUsgInputs && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed #B2DFDB',
            borderRadius: '8px',
            padding: '0.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.6rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label className="form__label" htmlFor="calc-usg-date" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Data do 1º Ultrassom
            </label>
            <input
              id="calc-usg-date"
              type="date"
              className="form__input"
              value={usgDate}
              onChange={(e) => setUsgDate(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', width: '100%' }}
            />
          </div>

          <div>
            <label className="form__label" htmlFor="calc-usg-weeks" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Semanas no Exame
            </label>
            <input
              id="calc-usg-weeks"
              type="number"
              min={4}
              max={42}
              placeholder="Ex.: 8"
              className="form__input"
              value={usgWeeks}
              onChange={(e) => setUsgWeeks(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', width: '100%' }}
            />
          </div>

          <div>
            <label className="form__label" htmlFor="calc-usg-days" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Dias no Exame
            </label>
            <input
              id="calc-usg-days"
              type="number"
              min={0}
              max={6}
              placeholder="Ex.: 4"
              className="form__input"
              value={usgDays}
              onChange={(e) => setUsgDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', width: '100%' }}
            />
          </div>
        </div>
      )}

      {/* Veredito de Reconciliação Oficial */}
      {calculation.explanation && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: '#FFFFFF',
            border: '1.5px solid var(--color-brand-primary, #852A91)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.65rem',
          }}
        >
          <div style={{ fontSize: '0.825rem' }}>
            <span style={{ color: 'var(--color-neutral-muted, #64748B)', fontWeight: 600 }}>
              Reconciliação Oficial Adotada:{' '}
            </span>
            <strong style={{ fontSize: '1rem', color: 'var(--color-primary-dark, #6F217B)', marginLeft: '0.25rem' }}>
              {calculation.effectiveWeeks}s {calculation.effectiveDays}d
            </strong>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-brand-primary, #852A91)',
                fontWeight: 600,
                display: 'block',
                marginTop: '0.15rem',
              }}
            >
              ({calculation.explanation})
            </span>
          </div>

          {onApplyCalculatedValues && (
            <button
              type="button"
              onClick={handleApply}
              className="button button--primary button--small"
              style={{
                fontSize: '0.8rem',
                padding: '0.35rem 0.8rem',
                marginLeft: 'auto',
                fontWeight: 700,
              }}
            >
              Aplicar ao Prontuário
            </button>
          )}
        </div>
      )}
    </div>
  );
};

