import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, X } from 'lucide-react';

export interface PreExamInstructionsModalProps {
  isOpen: boolean;
  careTypeId: string;
  careTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function PreExamInstructionsModal({
  isOpen,
  careTypeId,
  careTitle,
  onConfirm,
  onClose,
}: PreExamInstructionsModalProps) {
  const [checkedItems, setCheckedItems] = useState<{
    sexAbstinence: boolean;
    noCreams: boolean;
    outOfPeriod: boolean;
    bringPriorExams: boolean;
  }>({
    sexAbstinence: false,
    noCreams: false,
    outOfPeriod: false,
    bringPriorExams: false,
  });

  useEffect(() => {
    if (isOpen) {
      setCheckedItems({
        sexAbstinence: false,
        noCreams: false,
        outOfPeriod: false,
        bringPriorExams: false,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isDiu = careTypeId === 'diu_larc';
  const allRequiredChecked =
    checkedItems.sexAbstinence &&
    checkedItems.noCreams &&
    checkedItems.outOfPeriod &&
    checkedItems.bringPriorExams;

  const handleToggle = (key: keyof typeof checkedItems) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pre-exam-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
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
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={20} color="#FFFFFF" />
            </div>
            <div>
              <h2
                id="pre-exam-modal-title"
                style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}
              >
                Orientações de Preparo Pré-Exame
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#F7ECF8' }}>
                {careTitle}
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

        {/* Content */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              background: '#F7ECF8',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              borderLeft: '4px solid #852A91',
            }}
          >
            <AlertCircle size={20} color="#6F217B" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: '#6F217B', lineHeight: 1.5 }}>
              Para garantir a confiabilidade diagnóstica da amostra e sua segurança assistencial, é indispensável cumprir as orientações pré-exame abaixo antes de prosseguir com o agendamento.
            </div>
          </div>

          {isDiu && (
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '0.75rem 0.9rem',
                fontSize: '0.8rem',
                color: '#92400E',
                lineHeight: 1.4,
              }}
            >
              <strong>Atenção para Inserção de DIU/LARC:</strong> Recomenda-se realizar o procedimento durante a menstruação ou apresentar teste beta-hCG recente negativo, descartando gestação em curso.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
              Checklist Obrigatório de Confirmação:
            </span>

            {[
              {
                id: 'sexAbstinence',
                text: 'Não tive relações sexuais nas últimas 48 horas.',
                subtext: 'Evita a presença de espermatozoides e artefatos na lâmina citopatológica.',
              },
              {
                id: 'noCreams',
                text: 'Não fiz uso de pomadas, cremes ou duchas vaginais nos últimos 2 dias.',
                subtext: 'Pomadas mascaram células cervicais e alteram o pH e a flora bacteriana.',
              },
              {
                id: 'outOfPeriod',
                text: 'Estou fora do período de sangramento menstrual.',
                subtext: 'A presença de hemácias impede a visualização celular adequada.',
              },
              {
                id: 'bringPriorExams',
                text: 'Trago exames anteriores ou teste de gravidez recente (quando aplicável).',
                subtext: 'Permite comparação longitudinal de laudos anteriores pela médica.',
              },
            ].map((item) => {
              const key = item.id as keyof typeof checkedItems;
              const isChecked = checkedItems[key];
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 0.85rem',
                    borderRadius: '10px',
                    border: isChecked ? '1px solid #852A91' : '1px solid #E2E8F0',
                    background: isChecked ? '#F0FDF9' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(key)}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginTop: '2px',
                      accentColor: '#852A91',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? '#6F217B' : '#1E293B' }}>
                      {item.text}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                      {item.subtext}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
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
            Cancelar
          </button>
          <button
            type="button"
            disabled={!allRequiredChecked}
            onClick={onConfirm}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: allRequiredChecked ? '#852A91' : '#CBD5E1',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: allRequiredChecked ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.15s ease',
            }}
          >
            <CheckCircle2 size={16} />
            Confirmar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

