import {
  CheckCircle,
  Calendar,
  FileText,
  Activity,
  Baby,
  Printer,
  X,
  ShieldCheck,
} from 'lucide-react';

export interface ConsultationDiagnosisItem {
  code: string;
  description: string;
  category?: 'hypothesis' | 'confirmed' | string;
}

export interface GestationalProtocolInfo {
  weeks: number;
  days: number;
  trimester: string;
  nextRecommendedExams?: string[];
  nextRecommendedVaccines?: string[];
}

export interface ConsultationFinishSummaryModalProps {
  isOpen: boolean;
  patientName: string;
  diagnoses?: ConsultationDiagnosisItem[];
  prescriptionsCount?: number;
  documentsCount?: number;
  plannedReturnDays?: number;
  gestationalInfo?: GestationalProtocolInfo;
  onConfirmClose: () => void;
  onPrintSummary?: () => void;
  onClose: () => void;
}

export function ConsultationFinishSummaryModal({
  isOpen,
  patientName,
  diagnoses = [],
  prescriptionsCount = 0,
  documentsCount = 0,
  plannedReturnDays = 15,
  gestationalInfo,
  onConfirmClose,
  onPrintSummary,
  onClose,
}: ConsultationFinishSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-summary-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Header Institucional */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #6F217B 0%, #852A91 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle size={22} color="#FFFFFF" />
            </div>
            <div>
              <h2
                id="finish-summary-title"
                style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}
              >
                Resumo de Alta & Fechamento
              </h2>
              <span style={{ fontSize: '0.82rem', color: '#F7ECF8' }}>
                Atendimento concluído para <strong>{patientName}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Resumo */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* 1. Diagnósticos Registrados */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <Activity size={18} color="#852A91" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                Diagnósticos & Avaliação SOAP [A]
              </span>
            </div>

            {diagnoses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {diagnoses.map((diag, idx) => {
                  const isHypothesis = diag.category === 'hypothesis';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        background: '#FFFFFF',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: '#6F217B' }}>{diag.code}</span>
                        <span style={{ color: '#334155' }}>{diag.description}</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: isHypothesis ? '#FEF3C7' : '#F0FDF9',
                          color: isHypothesis ? '#92400E' : '#6F217B',
                          border: `1px solid ${isHypothesis ? '#FDE68A' : '#B77AD8'}`,
                        }}
                      >
                        {isHypothesis ? 'Hipótese' : 'Confirmado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                Nenhum código CID-10 associado. Consulta finalizada com notas descritivas.
              </p>
            )}
          </div>

          {/* 2. Prescrições e Documentos Emitidos */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                background: '#F0FDF9',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <FileText size={20} color="#059669" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065F46' }}>
                  {prescriptionsCount > 0
                    ? `${prescriptionsCount} prescrições emitidas`
                    : 'Nenhuma receita emitida'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                  Vias salvas e prontas para entrega
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#EFF6FF',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <ShieldCheck size={20} color="#2563EB" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E40AF' }}>
                  {documentsCount > 0 ? `${documentsCount} docs/laudos emitidos` : 'Prontuário Imutável'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#1D4ED8' }}>
                  {documentsCount > 0 ? 'Documentos salvos e assinados' : 'Assinatura e data/hora protegidas'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Retorno Programado CFM 1.958/2010 */}
          {plannedReturnDays > 0 && (
            <div
              style={{
                background: '#F7ECF8',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #B77AD8',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <Calendar size={22} color="#852A91" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6F217B' }}>
                  Retorno programado em {plannedReturnDays} dias
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0F766E', marginTop: '3px', lineHeight: 1.4 }}>
                  Em conformidade com a <strong>Resolução CFM nº 1.958/2010</strong>, a reavaliação clínica e verificação de exames complementares solicitados nesta consulta está isenta de nova cobrança de honorários médicos.
                </div>
              </div>
            </div>
          )}

          {/* 4. Esteira Trimestral Obstétrica (se gestante) */}
          {gestationalInfo && (
            <div
              style={{
                background: '#FEF9C3',
                borderRadius: '12px',
                padding: '1rem',
                border: '1px solid #FDE047',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Baby size={20} color="#854D0E" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#854D0E' }}>
                  Esteira Trimestral Obstétrica ({gestationalInfo.weeks} semanas e {gestationalInfo.days} dias · {gestationalInfo.trimester})
                </span>
              </div>

              {gestationalInfo.nextRecommendedExams && gestationalInfo.nextRecommendedExams.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#713F12' }}>
                    Exames recomendados para esta fase:
                  </span>
                  <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.78rem', color: '#854D0E' }}>
                    {gestationalInfo.nextRecommendedExams.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {gestationalInfo.nextRecommendedVaccines && gestationalInfo.nextRecommendedVaccines.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#713F12' }}>
                    Vacinação indicada:
                  </span>
                  <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1.25rem', fontSize: '0.78rem', color: '#854D0E' }}>
                    {gestationalInfo.nextRecommendedVaccines.map((vac, i) => (
                      <li key={i}>{vac}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          {onPrintSummary && (
            <button
              type="button"
              onClick={onPrintSummary}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Printer size={16} />
              Imprimir Resumo
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Rever Dados
            </button>
            <button
              type="button"
              onClick={onConfirmClose}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: '#852A91',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 128, 128, 0.25)',
              }}
            >
              <CheckCircle size={16} />
              Concluir e Liberar Consultório
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

