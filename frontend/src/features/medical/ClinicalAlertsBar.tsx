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
  bloodType,
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
      title: `Gestante Rh Negativo${bloodType ? ` (${bloodType})` : ''}`,
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
      className={`clinical-alerts-bar ${className}`.trim()}
      role="region"
      aria-label="Alertas Clínicos e Obstétricos"
    >
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`clinical-alert ${
            alert.type === 'danger' ? 'clinical-alert--danger' : 'clinical-alert--warning'
          }`}
        >
          {alert.icon}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem 0.5rem' }}>
            <span style={{ fontWeight: 700 }}>{alert.title}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.92 }}>— {alert.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
