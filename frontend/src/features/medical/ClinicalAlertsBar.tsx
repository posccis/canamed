import React from 'react';
import { AlertTriangle, Droplets, HeartPulse } from 'lucide-react';

export interface ClinicalAlertsBarProps {
  rhFactor?: string | null;
  bloodType?: string | null;
  bloodPressure?: string | null;
  fastingBloodGlucose?: number | null;
  className?: string;
}

export const ClinicalAlertsBar: React.FC<ClinicalAlertsBarProps> = ({
  rhFactor,
  // bloodType,
  bloodPressure,
  fastingBloodGlucose,
  className = '',
}) => {
  const alerts: Array<{
    id: string;
    type: 'warning' | 'danger';
    title: string;
    detail: string;
    icon: React.ReactNode;
  }> = [];

  // Alerta 1: Risco de Aloimunização Rh (RN-008)
  if (rhFactor?.toLowerCase().includes('negativo') || rhFactor?.trim() === '-') {
    alerts.push({
      id: 'rh-negative',
      type: 'warning',
      title: 'Gestante Rh Negativo',
      detail: 'Checar Coombs Indireto / Profilaxia Anti-D',
      icon: <Droplets className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    });
  }

  // Alerta 2: Hipertensão Gestacional / Pré-eclâmpsia (RN-008)
  // PA normal <= 139/89 mmHg. Considerar risco se sistólica >= 140 ou diastólica >= 90.
  if (bloodPressure) {
    const parts = bloodPressure.split(/[/xX]/).map((p) => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [systolic, diastolic] = parts;
      if (systolic >= 140 || diastolic >= 90) {
        alerts.push({
          id: 'gestational-hypertension',
          type: 'danger',
          title: 'Alerta de Hipertensão Gestacional / Risco de Pré-Eclâmpsia',
          detail: `PA aferida: ${bloodPressure} mmHg — Iniciar protocolo de vigilância materna/fetal`,
          icon: <HeartPulse className="w-4 h-4 text-rose-600 animate-pulse flex-shrink-0" />,
        });
      }
    }
  }

  // Alerta 3: Rastreio de Diabetes Melito Gestacional (DMG) (RN-008)
  // Glicemia de jejum >= 92 mg/dL é indicativa de DMG segundo o Ministério da Saúde
  if (fastingBloodGlucose !== undefined && fastingBloodGlucose !== null && fastingBloodGlucose >= 92) {
    alerts.push({
      id: 'gestational-diabetes',
      type: 'danger',
      title: 'Suspeita de Diabetes Melito Gestacional (DMG)',
      detail: `Glicemia de jejum: ${fastingBloodGlucose} mg/dL (referência: < 92)`,
      icon: <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="clinical-alerts-bar"
      className={`space-y-2 mb-4 ${className}`}
      role="region"
      aria-label="Alertas Clínicos e Obstétricos"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
            alert.type === 'danger'
              ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {alert.icon}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold">{alert.title}</span>
            <span className="text-xs opacity-90">— {alert.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
