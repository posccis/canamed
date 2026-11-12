import React, { useMemo } from 'react';
import { Calculator, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

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
  firstUsgDate,
  firstUsgWeeks,
  firstUsgDays,
  onApplyCalculatedValues,
  className = '',
}) => {
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

    if (firstUsgDate && firstUsgWeeks !== undefined && firstUsgWeeks !== null) {
      const uDate = new Date(firstUsgDate + 'T00:00:00');
      if (!isNaN(uDate.getTime())) {
        const uDays = (firstUsgWeeks * 7) + (firstUsgDays || 0);
        // Data base concepção/início: uDate - uDays
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

      // Critério FEBRASGO: se USG até 8s 6d e discrepância > 5 dias -> USG
      // se USG entre 9s e 13s 6d e discrepância > 7 dias -> USG
      const measuredWeeksAtExam = firstUsgWeeks || 0;
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
  }, [dum, isDumUncertain, firstUsgDate, firstUsgWeeks, firstUsgDays]);

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
      className={`obs-calc-card ${className}`.trim()}
      style={{
        backgroundColor: '#F0FDF9',
        border: '1px solid #B2F5EA',
        borderRadius: '14px',
        padding: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #B2F5EA',
          paddingBottom: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              backgroundColor: '#E6FFFA',
              color: '#008080',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#005F6A' }}>
              Calculadora Obstétrica & Reconciliação FEBRASGO
            </h4>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#626B79' }}>
              Reconciliação automática da idade gestacional (DUM vs 1º USG CCN)
            </p>
          </div>
        </div>
      </div>

      <div className="obs-calc-grid">
        {/* Bloco DUM */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E6EC' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ color: '#858D99', fontWeight: 600 }}>Estimativa por DUM</span>
            <Calendar className="w-3.5 h-3.5 text-[#858D99]" />
          </div>
          {isDumUncertain || !dum ? (
            <div
              style={{
                color: '#A96512',
                backgroundColor: '#FDF0E1',
                padding: '0.45rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginTop: '0.25rem',
              }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              DUM incerta ou desconhecida
            </div>
          ) : (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#202631' }}>
                {calculation.gaDumWeeks !== null
                  ? `${calculation.gaDumWeeks}s ${calculation.gaDumDays}d`
                  : 'Data futura'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#626B79', marginTop: '0.15rem' }}>
                DPP (Naegele):{' '}
                <strong style={{ color: '#202631' }}>
                  {calculation.naegeleEdd?.toLocaleDateString('pt-BR') || '-'}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* Bloco 1º USG */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E6EC' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ color: '#858D99', fontWeight: 600 }}>Estimativa por 1º USG Precoce</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#858D99]" />
          </div>
          {calculation.gaUsgWeeks !== null ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#202631' }}>
                {calculation.gaUsgWeeks}s {calculation.gaUsgDays}d
              </div>
              <div style={{ fontSize: '0.72rem', color: '#626B79', marginTop: '0.15rem' }}>
                DPP por USG:{' '}
                <strong style={{ color: '#202631' }}>
                  {calculation.usgEdd?.toLocaleDateString('pt-BR') || '-'}
                </strong>
              </div>
            </>
          ) : (
            <div style={{ color: '#858D99', fontSize: '0.72rem', padding: '0.45rem 0' }}>
              Nenhum USG inicial informado
            </div>
          )}
        </div>
      </div>

      {/* Veredito de Reconciliação */}
      {calculation.explanation && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #B2F5EA',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.6rem',
          }}
        >
          <div style={{ fontSize: '0.78rem' }}>
            <span style={{ color: '#626B79', fontWeight: 500 }}>Reconciliação Oficial Adotada: </span>
            <strong style={{ fontSize: '0.88rem', fontWeight: 700, color: '#005F6A' }}>
              {calculation.effectiveWeeks}s {calculation.effectiveDays}d
            </strong>
            <span style={{ fontSize: '0.72rem', color: '#008080', marginLeft: '0.4rem' }}>
              ({calculation.explanation})
            </span>
          </div>

          {onApplyCalculatedValues && (
            <button
              type="button"
              onClick={handleApply}
              className="button button--primary button--small"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', marginLeft: 'auto' }}
            >
              Aplicar ao Prontuário
            </button>
          )}
        </div>
      )}
    </div>
  );
};
