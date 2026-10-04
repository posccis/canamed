import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getDoctorWorkspaceState,
  doctorCallPatient,
  doctorStartConsultation,
  doctorFinishConsultation,
  type DoctorWorkspaceStateResponse,
} from './doctorWorkspaceApi';
import { updateDraftMedicalRecord } from './medicalRecordsApi';
import { DocumentModal } from './DocumentModal';
import { PatientHistoryModal } from './PatientHistoryModal';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS } from '../../navigation/routes';

export function DoctorWorkspace() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<DoctorWorkspaceStateResponse | null>(null);

  // SOAP State
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Modais
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const data = await getDoctorWorkspaceState();
      setState(data);

      if (data.activeConsultation?.medicalRecord) {
        setSubjective(data.activeConsultation.medicalRecord.subjective || '');
        setObjective(data.activeConsultation.medicalRecord.objective || '');
        setAssessment(data.activeConsultation.medicalRecord.assessment || '');
        setPlan(data.activeConsultation.medicalRecord.plan || '');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar consultório.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadWorkspace();
    const interval = setInterval(loadWorkspace, 10000); // polling adaptativo de fila a cada 10s
    return () => clearInterval(interval);
  }, [loadWorkspace]);

  async function handleCallNext(queueEntryId?: string) {
    try {
      await doctorCallPatient({ queueEntryId });
      addToast('Chamada de paciente acionada!', 'success');
      await loadWorkspace();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao chamar paciente.';
      addToast(msg, 'error');
    }
  }

  async function handleStartConsultation(queueEntryId: string) {
    try {
      const active = await doctorStartConsultation({ queueEntryId });
      addToast(`Atendimento iniciado: ${active.patientName}`, 'success');
      await loadWorkspace();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar consulta.';
      addToast(msg, 'error');
    }
  }

  async function handleSaveDraft() {
    if (!state?.activeConsultation?.medicalRecord) return;
    setSavingDraft(true);
    try {
      await updateDraftMedicalRecord(state.activeConsultation.medicalRecord.id, {
        subjective,
        objective,
        assessment,
        plan,
      });
      setDraftStatus(`Rascunho salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      addToast('Rascunho do prontuário salvo.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar rascunho.';
      addToast(msg, 'error');
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleFinishConsultation() {
    if (!state?.activeConsultation?.medicalRecord) return;

    if (!subjective.trim() && !objective.trim() && !assessment.trim() && !plan.trim()) {
      addToast('Preencha ao menos uma seção do prontuário antes de finalizar.', 'error');
      return;
    }

    if (!window.confirm('Tem certeza de que deseja finalizar o atendimento clínico deste paciente? O prontuário se tornará imutável.')) {
      return;
    }

    setFinishing(true);
    try {
      // 1. Salva notas atuais
      await updateDraftMedicalRecord(state.activeConsultation.medicalRecord.id, {
        subjective,
        objective,
        assessment,
        plan,
      });

      // 2. Finaliza prontuário e fila
      await doctorFinishConsultation({
        medicalRecordId: state.activeConsultation.medicalRecord.id,
        queueEntryId: state.activeConsultation.queueEntryId,
      });

      addToast('Atendimento finalizado com sucesso!', 'success');
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
      setDraftStatus('');
      await loadWorkspace();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao finalizar atendimento.';
      addToast(msg, 'error');
    } finally {
      setFinishing(false);
    }
  }

  if (loading) {
    return <div className="page"><p className="form__hint">Carregando consultório virtual…</p></div>;
  }

  const active = state?.activeConsultation;
  const waiting = state?.waitingQueue || [];

  return (
    <div className="page" style={{ maxWidth: '1600px' }}>
      <header className="page__header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page__title">Meu Consultório Virtual</h1>
          <p className="form__hint">
            Profissional: <strong>{state?.doctorName || 'Médico'}</strong>
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Painel da Fila de Espera do Médico */}
        <aside
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-neutral-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
              Fila de Espera ({waiting.length})
            </h3>
            <button
              type="button"
              className="button button--primary button--small"
              onClick={() => handleCallNext()}
              disabled={waiting.length === 0}
              title="Chamar o próximo da fila com prioridade adequada"
            >
              📢 Chamar Próximo
            </button>
          </div>

          {waiting.length === 0 ? (
            <p className="form__hint" style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              Nenhum paciente aguardando no momento.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {waiting.map((item) => (
                <div
                  key={item.queueEntryId}
                  style={{
                    background: 'var(--color-neutral-surface)',
                    border: '1px solid var(--color-neutral-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    transition: 'border-color var(--transition-speed) ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--color-neutral-dark)' }}>
                      {item.patientName}
                    </strong>
                    {item.riskClassification && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          textTransform: 'uppercase',
                          background:
                            item.riskClassification === 'vermelho' ? '#feb2b2' :
                            item.riskClassification === 'laranja' ? '#feebc8' :
                            item.riskClassification === 'amarelo' ? '#fefcbf' :
                            item.riskClassification === 'verde' ? '#c6f6d5' : '#bee3f8',
                          color: '#2d3748',
                        }}
                      >
                        {item.riskClassification}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-neutral-muted)' }}>
                    <span>
                      {item.priority === 'preferencial' ? '⭐ Preferencial' : 'Normal'} • Espera: {item.waitingTimeMinutes}m
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <Link
                        to={DOCTOR_PATHS.patientRecord(item.patientId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button--secondary button--small"
                        title="Abrir prontuário deste paciente em uma nova aba"
                        style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                      >
                        PEP ↗
                      </Link>
                      {item.status === 'chamado' ? (
                        <button
                          type="button"
                          className="button button--primary button--small"
                          onClick={() => handleStartConsultation(item.queueEntryId)}
                        >
                          ▶️ Iniciar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="button button--secondary button--small"
                          onClick={() => handleCallNext(item.queueEntryId)}
                        >
                          Chamar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Área Central: Consulta Ativa e Prontuário SOAP */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid var(--color-neutral-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {active ? (
            <div>
              {/* Cabeçalho do Paciente Ativo */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--color-neutral-surface)',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid var(--color-neutral-border)',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.3rem', color: 'var(--color-primary-dark)', marginBottom: '0.2rem' }}>
                    {active.patientName}
                  </h2>
                  <p className="form__hint" style={{ margin: 0 }}>
                    {active.patientBirthDate ? `Nascimento: ${new Date(active.patientBirthDate).toLocaleDateString('pt-BR')}` : ''}
                    {active.startedAt ? ` • Consulta iniciada às ${new Date(active.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Link
                    to={DOCTOR_PATHS.patientRecord(active.patientId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--secondary button--small"
                    title="Abrir o Prontuário Eletrônico deste paciente em uma nova aba"
                  >
                    🔗 Abrir PEP em Nova Aba ↗
                  </Link>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => setHistoryModalOpen(true)}
                  >
                    📋 Histórico do Paciente
                  </button>
                  <button
                    type="button"
                    className="button button--primary button--small"
                    onClick={() => setDocModalOpen(true)}
                  >
                    📄 + Receita / Documento
                  </button>
                </div>
              </div>

              {/* Alerta de Alergias Persistente (SPEC-0012 RN-004) */}
              {(active.allergies || active.triage?.allergies) && (
                <div
                  className="alert"
                  style={{
                    background: '#fff5f5',
                    border: '1px solid #feb2b2',
                    color: '#9b2c2c',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 600,
                  }}
                  role="alert"
                >
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <span>ALERTA DE ALERGIA DECLARADA: {active.allergies || active.triage?.allergies}</span>
                </div>
              )}

              {/* Sinais Vitais da Triagem (SPEC-0009 & SPEC-0012) */}
              {active.triage && (
                <div
                  style={{
                    background: 'var(--color-neutral-surface)',
                    border: '1px solid var(--color-neutral-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>PA (Pressão)</span>
                    <strong>{active.triage.bloodPressure || '-'}</strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Freq. Cardíaca</span>
                    <strong>{active.triage.heartRate ? `${active.triage.heartRate} bpm` : '-'}</strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Saturação O2</span>
                    <strong>{active.triage.oxygenSaturation ? `${active.triage.oxygenSaturation}%` : '-'}</strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Temperatura</span>
                    <strong>{active.triage.temperature ? `${active.triage.temperature}°C` : '-'}</strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Glicemia</span>
                    <strong>{active.triage.glucose ? `${active.triage.glucose} mg/dL` : '-'}</strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Peso / Altura</span>
                    <strong>
                      {active.triage.weightKg ? `${active.triage.weightKg}kg` : '-'} / {active.triage.heightCm ? `${active.triage.heightCm}cm` : '-'}
                    </strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>IMC</span>
                    <strong>{active.triage.calculatedBmi || '-'}</strong>
                  </div>
                  <div>
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Triagem Manchester</span>
                    <strong style={{ textTransform: 'capitalize' }}>{active.triage.riskClassification}</strong>
                  </div>
                </div>
              )}

              {/* Editor de Evolução Clínica SOAP (SPEC-0010) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form__group">
                  <label htmlFor="soap-s" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    [S] Subjetivo — Queixa Principal & Anamnese
                  </label>
                  <textarea
                    id="soap-s"
                    className="form__textarea"
                    rows={3}
                    placeholder="Relato dos sintomas pelo paciente, história da moléstia atual, tempo de início..."
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="soap-o" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    [O] Objetivo — Exame Físico & Achados Clínicos
                  </label>
                  <textarea
                    id="soap-o"
                    className="form__textarea"
                    rows={3}
                    placeholder="Inspeção, ausculta, palpação, achados de aparelhos e sistemas..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="soap-a" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    [A] Avaliação — Hipótese Diagnóstica & Impressão Clínica
                  </label>
                  <textarea
                    id="soap-a"
                    className="form__textarea"
                    rows={2}
                    placeholder="Hipóteses diagnósticas principais e diagnósticos diferenciais..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="soap-p" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    [P] Plano — Conduta Terapêutica & Recomendações
                  </label>
                  <textarea
                    id="soap-p"
                    className="form__textarea"
                    rows={3}
                    placeholder="Orientações ao paciente, medicamentos prescritos, solicitação de exames, data de retorno..."
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                  />
                </div>
              </div>

              {/* Barra de Ações do Atendimento */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--color-neutral-border)',
                  paddingTop: '1.25rem',
                }}
              >
                <div>
                  {draftStatus && <span className="form__hint" style={{ color: 'var(--color-primary)' }}>✓ {draftStatus}</span>}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                  >
                    {savingDraft ? 'Salvando…' : 'Salvar Rascunho'}
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleFinishConsultation}
                    disabled={finishing}
                    style={{ background: 'var(--color-primary-dark)' }}
                  >
                    {finishing ? 'Finalizando…' : '✓ Finalizar Atendimento Clínico'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-neutral-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🩺</div>
              <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                Nenhum paciente em atendimento no momento
              </h3>
              <p style={{ maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Selecione um paciente na lista da fila à esquerda para chamar para o consultório ou clique em <strong>Chamar Próximo</strong>.
              </p>
              {waiting.length > 0 && (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => handleCallNext()}
                >
                  📢 Chamar Próximo Paciente ({waiting[0].patientName})
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modais de Documentos e Histórico */}
      {active && (
        <>
          <DocumentModal
            isOpen={docModalOpen}
            patientId={active.patientId}
            patientName={active.patientName}
            medicalRecordId={active.medicalRecord?.id}
            onClose={() => setDocModalOpen(false)}
          />

          <PatientHistoryModal
            isOpen={historyModalOpen}
            patientId={active.patientId}
            patientName={active.patientName}
            onClose={() => setHistoryModalOpen(false)}
          />
        </>
      )}
    </div>
  );
}
