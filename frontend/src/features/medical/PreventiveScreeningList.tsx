import { useState, useMemo } from 'react';
import {
  type PreventiveScreeningDto,
  type CreatePreventiveScreeningRequest,
  addPatientScreening,
} from './medicalRecordsApi';
import {
  BETHESDA_OPTIONS,
  BIRADS_OPTIONS,
  getRecommendedCervicalConduct,
  getRecommendedBiRadsConduct,
} from './screeningGuidelines';
import { useToast } from '../layout/Toast';

interface Props {
  patientId: string;
  patientBirthDate?: string | null;
  screenings: PreventiveScreeningDto[];
  onScreeningAdded: (screening: PreventiveScreeningDto) => void;
  readOnly?: boolean;
}

export function PreventiveScreeningList({
  patientId,
  patientBirthDate,
  screenings,
  onScreeningAdded,
  readOnly,
}: Props) {
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Calcula idade do paciente a partir da data de nascimento (se disponível)
  const patientAge = useMemo(() => {
    if (!patientBirthDate) return 30; // fallback padrão
    const birth = new Date(patientBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : 30;
  }, [patientBirthDate]);

  // Form State
  const [examType, setExamType] = useState('citopatologico');
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [resultSummary, setResultSummary] = useState('');
  const [classification, setClassification] = useState('');
  const [bethesdaClassification, setBethesdaClassification] = useState('');
  const [hpvDnaResult, setHpvDnaResult] = useState('');
  const [biRadsCategory, setBiRadsCategory] = useState('');
  const [clinicalConductNotes, setClinicalConductNotes] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  // Utilitário para adicionar meses à data de realização
  const handleAddMonthsToDueDate = (months: number) => {
    const base = performedAt ? new Date(performedAt) : new Date();
    if (isNaN(base.getTime())) return;
    const target = new Date(base.getFullYear(), base.getMonth() + months, base.getDate());
    setNextDueDate(target.toISOString().slice(0, 10));
  };

  // Sincronização dinâmica de condutas clínicas recomendadas
  const handleBethesdaChange = (code: string) => {
    setBethesdaClassification(code);
    setClassification(code);
    if (code) {
      const isHpvPos = hpvDnaResult === 'positivo_16_18' || hpvDnaResult === 'positivo_outros';
      const conduct = getRecommendedCervicalConduct(code, isHpvPos, patientAge);
      setClinicalConductNotes(conduct);
    }
  };

  const handleHpvChange = (hpvVal: string) => {
    setHpvDnaResult(hpvVal);
    if (bethesdaClassification) {
      const isHpvPos = hpvVal === 'positivo_16_18' || hpvVal === 'positivo_outros';
      const conduct = getRecommendedCervicalConduct(bethesdaClassification, isHpvPos, patientAge);
      setClinicalConductNotes(conduct);
    }
  };

  const handleBiRadsChange = (code: string) => {
    setBiRadsCategory(code);
    setClassification(`BI-RADS ${code}`);
    if (code) {
      const conduct = getRecommendedBiRadsConduct(code);
      setClinicalConductNotes(conduct);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultSummary.trim()) {
      addToast('O laudo/resultado do exame é obrigatório.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: CreatePreventiveScreeningRequest = {
        examType,
        performedAt,
        resultSummary: resultSummary.trim(),
        classification: classification.trim() || undefined,
        bethesdaClassification: bethesdaClassification || undefined,
        hpvDnaResult: hpvDnaResult || undefined,
        biRadsCategory: biRadsCategory || undefined,
        clinicalConductNotes: clinicalConductNotes.trim() || undefined,
        nextDueDate: nextDueDate ? nextDueDate : undefined,
      };

      const added = await addPatientScreening(patientId, payload);
      onScreeningAdded(added);
      addToast('Exame preventivo registrado com sucesso!', 'success');

      // Limpar formulário
      setResultSummary('');
      setClassification('');
      setBethesdaClassification('');
      setHpvDnaResult('');
      setBiRadsCategory('');
      setClinicalConductNotes('');
      setNextDueDate('');
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar exame preventivo.';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getExamLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'citopatologico': return '🔬 Citopatológico (Papanicolau / Bethesda)';
      case 'pesquisa_hpv': return '🧬 Pesquisa de HPV (DNA-HPV / Co-teste)';
      case 'mamografia': return '🎀 Mamografia Bilateral (BI-RADS)';
      case 'ultrassom_mamas': return '🎀 Ultrassonografia Mamária Bilateral (BI-RADS)';
      case 'ultrassom_transvaginal': return '📷 Ultrassonografia Transvaginal';
      case 'colposcopia': return '🔍 Colposcopia';
      default: return type.toUpperCase();
    }
  };

  const isPapOrHpv = examType === 'citopatologico' || examType === 'pesquisa_hpv';
  const isBreastImaging = examType === 'mamografia' || examType === 'ultrassom_mamas';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--color-neutral-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--color-neutral-border)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.3rem' }} aria-hidden="true">🛡️</span>
          <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#481361' }}>
            Rastreamento Preventivo Oncológico & Linha do Tempo ({screenings.length})
          </h3>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="button button--primary button--small"
            style={{ background: '#852A91', borderColor: '#852A91' }}
            onClick={() => setModalOpen(true)}
          >
            ➕ Registrar Exame Preventivo
          </button>
        )}
      </div>

      {screenings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#626B79' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }} aria-hidden="true">📋</span>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#202631' }}>
            Nenhum exame preventivo registrado ainda.
          </p>
          <p className="form__hint" style={{ margin: 0 }}>
            Registre os resultados de Citopatológico (Bethesda), DNA-HPV, Mamografia (BI-RADS) ou USG para manter a vigilância preventiva ativa.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {screenings.map((s) => {
            const isDue = s.nextDueDate && new Date(s.nextDueDate) < new Date();

            // Semáforo tri-nível:
            // Nível 3 - Crítico (vermelho)
            const isHighRisk =
              (s.bethesdaClassification && ['ASC-H', 'HSIL', 'AGC'].includes(s.bethesdaClassification.toUpperCase())) ||
              (s.biRadsCategory && ['4A', '4B', '4C', '5', '6'].includes(s.biRadsCategory.toUpperCase())) ||
              (s.hpvDnaResult && s.hpvDnaResult.includes('16_18'));

            // Nível 2 - Atenção (âmbar)
            const isWarningRisk =
              !isHighRisk &&
              ((s.bethesdaClassification && ['ASC-US', 'LSIL'].includes(s.bethesdaClassification.toUpperCase())) ||
               (s.biRadsCategory && ['0', '3'].includes(s.biRadsCategory.toUpperCase())) ||
               (s.hpvDnaResult && s.hpvDnaResult.includes('outros')));

            return (
              <div
                key={s.id}
                style={{
                  border: isHighRisk ? '1px solid #F5B5BC' : isWarningRisk ? '1px solid #F8D3A6' : '1px solid var(--color-neutral-border)',
                  borderLeft: isHighRisk ? '4px solid #C33D49' : isWarningRisk ? '4px solid #A96512' : '4px solid #852A91',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  background: isHighRisk ? '#FFF8F8' : isWarningRisk ? '#FFFAF5' : 'var(--color-neutral-surface)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ flex: '1 1 65%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#481361', fontSize: '0.95rem' }}>
                      {getExamLabel(s.examType)}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#626B79' }}>
                      • Realizado em: {new Date(s.performedAt).toLocaleDateString('pt-BR')}
                    </span>

                    {/* Bethesda Badge (Semáforo Tri-Nível) */}
                    {s.bethesdaClassification && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: s.bethesdaClassification === 'NILM' ? '#E9F5EC' : ['ASC-US', 'LSIL'].includes(s.bethesdaClassification.toUpperCase()) ? '#FDF0E1' : '#FCECEE',
                          color: s.bethesdaClassification === 'NILM' ? '#237A52' : ['ASC-US', 'LSIL'].includes(s.bethesdaClassification.toUpperCase()) ? '#A96512' : '#C33D49',
                          border: `1px solid ${s.bethesdaClassification === 'NILM' ? '#BDE5C8' : ['ASC-US', 'LSIL'].includes(s.bethesdaClassification.toUpperCase()) ? '#F8D3A6' : '#F5B5BC'}`,
                        }}
                      >
                        Bethesda: {s.bethesdaClassification}
                      </span>
                    )}

                    {/* BI-RADS Badge (Semáforo Tri-Nível) */}
                    {s.biRadsCategory && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: ['0', '3'].includes(s.biRadsCategory) ? '#FDF0E1' : ['1', '2'].includes(s.biRadsCategory) ? '#E9F5EC' : '#FCECEE',
                          color: ['0', '3'].includes(s.biRadsCategory) ? '#A96512' : ['1', '2'].includes(s.biRadsCategory) ? '#237A52' : '#C33D49',
                          border: `1px solid ${['0', '3'].includes(s.biRadsCategory) ? '#F8D3A6' : ['1', '2'].includes(s.biRadsCategory) ? '#BDE5C8' : '#F5B5BC'}`,
                        }}
                      >
                        BI-RADS {s.biRadsCategory}
                      </span>
                    )}

                    {/* Legacy ou Custom Classification Badge */}
                    {s.classification && !s.bethesdaClassification && !s.biRadsCategory && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: s.classification.toLowerCase().includes('negativo') ? '#E9F5EC' : '#FDF0E1',
                          color: s.classification.toLowerCase().includes('negativo') ? '#237A52' : '#A96512',
                          border: `1px solid ${s.classification.toLowerCase().includes('negativo') ? '#BDE5C8' : '#F8D3A6'}`,
                        }}
                      >
                        {s.classification}
                      </span>
                    )}

                    {/* HPV DNA Badge */}
                    {s.hpvDnaResult && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          background: s.hpvDnaResult === 'negativo' ? '#E9F5EC' : s.hpvDnaResult.includes('16_18') ? '#FCECEE' : '#FFF0F6',
                          color: s.hpvDnaResult === 'negativo' ? '#237A52' : s.hpvDnaResult.includes('16_18') ? '#C33D49' : '#D83C91',
                          border: `1px solid ${s.hpvDnaResult === 'negativo' ? '#BDE5C8' : s.hpvDnaResult.includes('16_18') ? '#F5B5BC' : '#FCC2D7'}`,
                        }}
                      >
                        <span aria-hidden="true">🧬</span> DNA-HPV: {s.hpvDnaResult.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#202631' }}>
                    {s.resultSummary}
                  </p>

                  {/* Conduta Clínica Documentada / INCA */}
                  {s.clinicalConductNotes && (
                    <div
                      style={{
                        marginTop: '0.4rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#FAF5FF',
                        borderLeft: '3px solid #852A91',
                        fontSize: '0.84rem',
                        color: '#481361',
                      }}
                    >
                      <strong>Conduta Recomendada (Diretrizes Oficiais INCA/MS / CBR):</strong> {s.clinicalConductNotes}
                    </div>
                  )}
                </div>

                {s.nextDueDate && (
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <span style={{ color: '#626B79', display: 'block' }}>Próximo Controle:</span>
                    <strong style={{ color: isDue ? '#C33D49' : '#852A91' }}>
                      {isDue ? '⚠️ Vigilância Atrasada: ' : '✅ Próximo: '}
                      {new Date(s.nextDueDate).toLocaleDateString('pt-BR')}
                    </strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Registro de Novo Preventivo */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#481361' }}>Novo Exame Preventivo Oncológico</h3>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                <label className="field">
                  <span className="field__label">Tipo de Exame</span>
                  <select
                    className="form__select"
                    value={examType}
                    onChange={(e) => {
                      setExamType(e.target.value);
                      setBethesdaClassification('');
                      setBiRadsCategory('');
                      setClinicalConductNotes('');
                    }}
                  >
                    <option value="citopatologico">Citopatológico de Colo (Papanicolau)</option>
                    <option value="pesquisa_hpv">Pesquisa de HPV (DNA-HPV / Co-teste)</option>
                    <option value="mamografia">Mamografia Bilateral (Rastreamento Mamário)</option>
                    <option value="ultrassom_mamas">Ultrassonografia Mamária Bilateral (BI-RADS)</option>
                    <option value="ultrassom_transvaginal">Ultrassonografia Transvaginal</option>
                    <option value="colposcopia">Colposcopia / Vulvoscopia</option>
                  </select>
                </label>

                <label className="field">
                  <span className="field__label">Data de Realização</span>
                  <input
                    type="date"
                    className="form__input"
                    value={performedAt}
                    onChange={(e) => setPerformedAt(e.target.value)}
                    required
                  />
                </label>
              </div>

              {/* Seletor Estruturado Bethesda (Colo do Útero) */}
              {isPapOrHpv && (
                <div style={{ background: '#F7FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                  <label className="field" style={{ marginBottom: '0.5rem' }}>
                    <span className="field__label" style={{ color: '#481361', fontWeight: 600 }}>
                      Nomenclatura Bethesda (Sistema Internacional de Citopatologia)
                    </span>
                    <select
                      className="form__select"
                      value={bethesdaClassification}
                      onChange={(e) => handleBethesdaChange(e.target.value)}
                    >
                      <option value="">Selecione a classificação citológica...</option>
                      {BETHESDA_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span className="field__label" style={{ color: '#481361' }}>
                      Co-teste / Pesquisa Molecular de DNA-HPV
                    </span>
                    <select
                      className="form__select"
                      value={hpvDnaResult}
                      onChange={(e) => handleHpvChange(e.target.value)}
                    >
                      <option value="">Não realizado / Sem teste de HPV associado</option>
                      <option value="negativo">Negativo para HPV de Alto Risco</option>
                      <option value="positivo_16_18">Positivo para HPV Oncogênico 16 ou 18 (Alto Risco)</option>
                      <option value="positivo_outros">Positivo para outros genótipos de Alto Risco (Pool não-16/18)</option>
                    </select>
                  </label>
                </div>
              )}

              {/* Seletor Estruturado BI-RADS (Mamas) */}
              {isBreastImaging && (
                <div style={{ background: '#F7FAFC', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                  <label className="field">
                    <span className="field__label" style={{ color: '#481361', fontWeight: 600 }}>
                      Classificação BI-RADS® (American College of Radiology / CBR)
                    </span>
                    <select
                      className="form__select"
                      value={biRadsCategory}
                      onChange={(e) => handleBiRadsChange(e.target.value)}
                    >
                      <option value="">Selecione a categoria BI-RADS...</option>
                      {BIRADS_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label} ({opt.riskDescription})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <label className="field">
                <span className="field__label">Resumo do Laudo / Conclusão Diagnóstica</span>
                <textarea
                  className="form__textarea"
                  rows={3}
                  placeholder="Descreva detalhadamente a conclusão do exame preventivo..."
                  value={resultSummary}
                  onChange={(e) => setResultSummary(e.target.value)}
                  required
                />
              </label>

              {/* Conduta Clínica Automatizada / Sugerida pelas Diretrizes Oficiais */}
              <label className="field">
                <span className="field__label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Conduta Clínica e Seguimento (Diretrizes INCA / MS / FEBRASGO)</span>
                  <span style={{ fontSize: '0.75rem', color: '#852A91', fontWeight: 600 }}>Sugestão Baseada em Evidência</span>
                </span>
                <textarea
                  className="form__textarea"
                  rows={2}
                  style={{ background: '#FAF5FF', borderColor: '#E9D8FD' }}
                  placeholder="A conduta recomendada será calculada automaticamente ou insira orientações clínicas personalizadas..."
                  value={clinicalConductNotes}
                  onChange={(e) => setClinicalConductNotes(e.target.value)}
                />
              </label>

              <div>
                <label className="field">
                  <span className="field__label">Data Sugerida para Próximo Controle Preventivo (opcional)</span>
                  <input
                    type="date"
                    className="form__input"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                  />
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => handleAddMonthsToDueDate(6)}
                  >
                    + 6 Meses
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => handleAddMonthsToDueDate(12)}
                  >
                    + 1 Ano
                  </button>
                  <button
                    type="button"
                    className="button button--ghost button--small"
                    style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => handleAddMonthsToDueDate(36)}
                  >
                    + 3 Anos (INCA)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  style={{ background: '#852A91', borderColor: '#852A91' }}
                  disabled={saving}
                >
                  {saving ? 'Registrando…' : 'Salvar Exame'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
