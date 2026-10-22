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
      className={`bg-[#FAF7FB] border border-[#E8D4EC] rounded-xl p-4 shadow-sm space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#E8D4EC] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#852A91]/10 text-[#852A91]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#481361]">
              Calculadora Obstétrica & Reconciliação FEBRASGO
            </h4>
            <p className="text-[11px] text-[#626B79]">
              Reconciliação automática da idade gestacional (DUM vs 1º USG CCN)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Bloco DUM */}
        <div className="bg-white p-3 rounded-lg border border-[#E2E6EC]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#858D99] font-semibold">Estimativa por DUM</span>
            <Calendar className="w-3.5 h-3.5 text-[#858D99]" />
          </div>
          {isDumUncertain || !dum ? (
            <div className="text-amber-800 bg-amber-50 p-2 rounded text-[11px] font-medium flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              DUM incerta ou desconhecida
            </div>
          ) : (
            <>
              <div className="text-base font-bold text-[#202631]">
                {calculation.gaDumWeeks !== null
                  ? `${calculation.gaDumWeeks}s ${calculation.gaDumDays}d`
                  : 'Data futura'}
              </div>
              <div className="text-[11px] text-[#626B79] mt-0.5">
                DPP (Naegele):{' '}
                <strong className="text-[#202631]">
                  {calculation.naegeleEdd?.toLocaleDateString('pt-BR') || '-'}
                </strong>
              </div>
            </>
          )}
        </div>

        {/* Bloco 1º USG */}
        <div className="bg-white p-3 rounded-lg border border-[#E2E6EC]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#858D99] font-semibold">Estimativa por 1º USG Precoce</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#858D99]" />
          </div>
          {calculation.gaUsgWeeks !== null ? (
            <>
              <div className="text-base font-bold text-[#202631]">
                {calculation.gaUsgWeeks}s {calculation.gaUsgDays}d
              </div>
              <div className="text-[11px] text-[#626B79] mt-0.5">
                DPP por USG:{' '}
                <strong className="text-[#202631]">
                  {calculation.usgEdd?.toLocaleDateString('pt-BR') || '-'}
                </strong>
              </div>
            </>
          ) : (
            <div className="text-[#858D99] text-[11px] py-2">
              Nenhum USG inicial informado
            </div>
          )}
        </div>
      </div>

      {/* Veredito de Reconciliação */}
      {calculation.explanation && (
        <div className="p-3 rounded-lg bg-white border border-[#852A91]/25 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs">
            <span className="text-[#626B79] font-medium">Reconciliação Oficial Adotada: </span>
            <strong className="text-sm font-bold text-[#481361]">
              {calculation.effectiveWeeks}s {calculation.effectiveDays}d
            </strong>
            <span className="text-[11px] text-[#852A91] block sm:inline sm:ml-2">
              ({calculation.explanation})
            </span>
          </div>

          {onApplyCalculatedValues && (
            <button
              type="button"
              onClick={handleApply}
              className="button button--primary button--small text-xs py-1 px-3 ml-auto"
            >
              Aplicar ao Prontuário
            </button>
          )}
        </div>
      )}
    </div>
  );
};
