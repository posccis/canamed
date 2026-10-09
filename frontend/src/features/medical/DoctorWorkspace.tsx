import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getDoctorWorkspaceState,
  doctorCallPatient,
  doctorStartConsultation,
  doctorFinishConsultation,
  type DoctorWorkspaceStateResponse,
} from './doctorWorkspaceApi';
import {
  updateDraftMedicalRecord,
  getGynecologicalConsultationData,
  updateGynecologicalConsultationData,
  getGynecologicalProfile,
  type GynecologicalProfileDto,
} from './medicalRecordsApi';
import { GynecologicalExamSection, type GynecologicalExamState } from './GynecologicalExamSection';
import { DocumentModal } from './DocumentModal';
import { PatientHistoryModal } from './PatientHistoryModal';
import { PatientExamAttachmentsSection } from './PatientExamAttachmentsSection';
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

  // Gynecological Specialized State
  const [gynProfile, setGynProfile] = useState<GynecologicalProfileDto | null>(null);
  const [dum, setDum] = useState('');
  const [isDumUncertain, setIsDumUncertain] = useState(false);
  const [isMenopausal, setIsMenopausal] = useState(false);
  const [isSexuallyActive, setIsSexuallyActive] = useState<boolean | null>(null);
  const [dyspareunia, setDyspareunia] = useState('ausente');
  const [exam, setExam] = useState<GynecologicalExamState>({
    breastsIsNormal: true,
    breastsFindings: '',
    abdomenIsNormal: true,
    abdomenFindings: '',
    externalGenitaliaIsNormal: true,
    externalGenitaliaFindings: '',
    speculumExamIsNormal: true,
    speculumExamFindings: '',
    bimanualPalpationIsNormal: true,
    bimanualPalpationFindings: '',
  });
  const [procedurePerformed, setProcedurePerformed] = useState('');
  const [procedureBatch, setProcedureBatch] = useState('');
  const [procedureNotes, setProcedureNotes] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [generalOrientationNotes, setGeneralOrientationNotes] = useState('');

  // RN-005 (SPEC-0029): Controle de alterações clínicas pendentes e proteção contra fechamento acidental
  const isDirty = Boolean(
    state?.activeConsultation &&
      (subjective.trim() ||
        objective.trim() ||
        assessment.trim() ||
        plan.trim() ||
        dum.trim() ||
        procedurePerformed.trim() ||
        procedureNotes.trim() ||
        prescriptionNotes.trim() ||
        generalOrientationNotes.trim())
  );

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Existem anotações clínicas em andamento não finalizadas. Deseja realmente sair?';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Modais
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const data = await getDoctorWorkspaceState();
      setState(data);

      if (data.activeConsultation?.medicalRecord) {
        setSubjective(data.activeConsultation.medicalRecord.subjective || '');
        setObjective(data.activeConsultation.medicalRecord.objective || '');
        setAssessment(data.activeConsultation.medicalRecord.assessment || '');
        setPlan(data.activeConsultation.medicalRecord.plan || '');

        // Carrega dados ginecológicos da consulta e perfil longitudinal do paciente
        const recId = data.activeConsultation.medicalRecord.id;
        const patId = data.activeConsultation.patientId;

        getGynecologicalConsultationData(recId)
          .then((gyn) => {
            if (gyn) {
              setDum(gyn.dum ? gyn.dum.slice(0, 10) : '');
              setIsDumUncertain(gyn.isDumUncertain ?? false);
              setIsMenopausal(gyn.isMenopausal ?? false);
              setIsSexuallyActive(gyn.isSexuallyActive ?? null);
              setDyspareunia(gyn.dyspareunia || 'ausente');
              setExam({
                breastsIsNormal: gyn.breastsIsNormal ?? true,
                breastsFindings: gyn.breastsFindings || '',
                abdomenIsNormal: gyn.abdomenIsNormal ?? true,
                abdomenFindings: gyn.abdomenFindings || '',
                externalGenitaliaIsNormal: gyn.externalGenitaliaIsNormal ?? true,
                externalGenitaliaFindings: gyn.externalGenitaliaFindings || '',
                speculumExamIsNormal: gyn.speculumExamIsNormal ?? true,
                speculumExamFindings: gyn.speculumExamFindings || '',
                bimanualPalpationIsNormal: gyn.bimanualPalpationIsNormal ?? true,
                bimanualPalpationFindings: gyn.bimanualPalpationFindings || '',
              });
              setProcedurePerformed(gyn.procedurePerformed || '');
              setProcedureBatch(gyn.procedureBatch || '');
              setProcedureNotes(gyn.procedureNotes || '');
              setPrescriptionNotes(gyn.prescriptionNotes || '');
              setGeneralOrientationNotes(gyn.generalOrientationNotes || '');
            }
          })
          .catch(() => {
            // Em testes ou ambientes com fallback
          });

        getGynecologicalProfile(patId)
          .then((prof) => {
            if (prof) setGynProfile(prof);
          })
          .catch(() => {
            // Fallback seguro
          });
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
      const recordId = state.activeConsultation.medicalRecord.id;

      await Promise.all([
        updateDraftMedicalRecord(recordId, {
          subjective,
          objective,
          assessment,
          plan,
        }),
        updateGynecologicalConsultationData(recordId, {
          dum: dum || null,
          isDumUncertain,
          isMenopausal,
          chiefComplaint: subjective || null,
          hma: subjective || null,
          isSexuallyActive,
          dyspareunia: dyspareunia || null,
          breastsIsNormal: exam.breastsIsNormal,
          breastsFindings: exam.breastsFindings || null,
          abdomenIsNormal: exam.abdomenIsNormal,
          abdomenFindings: exam.abdomenFindings || null,
          externalGenitaliaIsNormal: exam.externalGenitaliaIsNormal,
          externalGenitaliaFindings: exam.externalGenitaliaFindings || null,
          speculumExamIsNormal: exam.speculumExamIsNormal,
          speculumExamFindings: exam.speculumExamFindings || null,
          bimanualPalpationIsNormal: exam.bimanualPalpationIsNormal,
          bimanualPalpationFindings: exam.bimanualPalpationFindings || null,
          procedurePerformed: procedurePerformed || null,
          procedureBatch: procedureBatch || null,
          procedureNotes: procedureNotes || null,
          prescriptionNotes: prescriptionNotes || null,
          generalOrientationNotes: generalOrientationNotes || null,
        }).catch(() => null),
      ]);

      setDraftStatus(`Rascunho salvo às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      addToast('Rascunho do prontuário salvo com sucesso.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar rascunho.';
      addToast(msg, 'error');
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleFinishConsultation() {
    if (!state?.activeConsultation?.medicalRecord) return;

    if (
      !subjective.trim() &&
      !objective.trim() &&
      !assessment.trim() &&
      !plan.trim() &&
      !procedurePerformed.trim() &&
      !prescriptionNotes.trim()
    ) {
      addToast('Preencha ao menos uma seção do prontuário antes de finalizar.', 'error');
      return;
    }

    if (!window.confirm('Tem certeza de que deseja finalizar o atendimento clínico deste paciente? O prontuário se tornará imutável conforme as diretrizes do CFM e Lei nº 13.787/2018.')) {
      return;
    }

    setFinishing(true);
    try {
      const recordId = state.activeConsultation.medicalRecord.id;

      // 1. Salva notas atuais e dados ginecológicos
      await Promise.all([
        updateDraftMedicalRecord(recordId, {
          subjective,
          objective,
          assessment,
          plan,
        }),
        updateGynecologicalConsultationData(recordId, {
          dum: dum || null,
          isDumUncertain,
          isMenopausal,
          chiefComplaint: subjective || null,
          hma: subjective || null,
          isSexuallyActive,
          dyspareunia: dyspareunia || null,
          breastsIsNormal: exam.breastsIsNormal,
          breastsFindings: exam.breastsFindings || null,
          abdomenIsNormal: exam.abdomenIsNormal,
          abdomenFindings: exam.abdomenFindings || null,
          externalGenitaliaIsNormal: exam.externalGenitaliaIsNormal,
          externalGenitaliaFindings: exam.externalGenitaliaFindings || null,
          speculumExamIsNormal: exam.speculumExamIsNormal,
          speculumExamFindings: exam.speculumExamFindings || null,
          bimanualPalpationIsNormal: exam.bimanualPalpationIsNormal,
          bimanualPalpationFindings: exam.bimanualPalpationFindings || null,
          procedurePerformed: procedurePerformed || null,
          procedureBatch: procedureBatch || null,
          procedureNotes: procedureNotes || null,
          prescriptionNotes: prescriptionNotes || null,
          generalOrientationNotes: generalOrientationNotes || null,
        }).catch(() => null),
      ]);

      // 2. Finaliza prontuário e fila
      await doctorFinishConsultation({
        medicalRecordId: recordId,
        queueEntryId: state.activeConsultation.queueEntryId || '00000000-0000-0000-0000-000000000000',
      });

      addToast('Atendimento finalizado com sucesso!', 'success');
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
      setDum('');
      setIsDumUncertain(false);
      setIsMenopausal(false);
      setIsSexuallyActive(null);
      setDyspareunia('ausente');
      setProcedurePerformed('');
      setProcedureBatch('');
      setProcedureNotes('');
      setPrescriptionNotes('');
      setGeneralOrientationNotes('');
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
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            type="button"
                            className="button button--secondary button--small"
                            onClick={() => handleCallNext(item.queueEntryId)}
                            title="Chamar paciente para a sala"
                          >
                            Chamar
                          </button>
                          <button
                            type="button"
                            className="button button--primary button--small"
                            onClick={() => handleStartConsultation(item.queueEntryId)}
                            title="Iniciar atendimento clínico imediatamente"
                          >
                            ▶️ Iniciar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Área Central: Consulta Ativa e Prontuário Especializado */}
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
                    onClick={() => setAttachmentsModalOpen(true)}
                    title="Anexar ou consultar exames anteriores (mamografia, USG, citopatológico)"
                  >
                    📁 Exames Anteriores
                  </button>
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

              {/* Banner Longitudinal Gineco-Obstétrico */}
              {gynProfile && (
                <div
                  style={{
                    background: '#f0fdfa',
                    border: '1px solid #99f6e4',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}>
                      🌸 Ficha Gineco-Obstétrica Longitudinal
                    </span>
                    <div style={{ fontSize: '0.875rem', color: '#134e4a', marginTop: '0.2rem' }}>
                      <strong>Obstétrico:</strong> G{gynProfile.gravida} P{gynProfile.para} (Cesáreas: {gynProfile.cesareans}, Abortos: {gynProfile.abortions}, Filhos: {gynProfile.livingChildren}) • <strong>Contracepção:</strong> {gynProfile.currentMethod || 'Nenhum'} • <strong>Ciclo:</strong> {gynProfile.cycleIntervalDays || 28}d ({gynProfile.isCycleRegular ? 'Regular' : 'Irregular'})
                    </div>
                  </div>
                  <Link
                    to={DOCTOR_PATHS.patientRecord(active.patientId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button--ghost button--small"
                    style={{ color: 'var(--color-primary-dark)', borderColor: '#5eead4', fontSize: '0.75rem' }}
                  >
                    Ver Ficha Completa ↗
                  </Link>
                </div>
              )}

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
                    <span className="form__hint" style={{ display: 'block', fontSize: '0.75rem' }}>Triagem</span>
                    <strong style={{ textTransform: 'capitalize' }}>{active.triage.riskClassification}</strong>
                  </div>
                </div>
              )}

              {/* Sub-Navegação Rápida do Prontuário */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--color-neutral-border)',
                  overflowX: 'auto',
                }}
              >
                <a href="#sec-gyn" className="button button--ghost button--small" style={{ fontSize: '0.8rem' }}>
                  🌸 DUM & Anamnese
                </a>
                <a href="#sec-exam" className="button button--ghost button--small" style={{ fontSize: '0.8rem' }}>
                  🩺 Exame Físico Ginecológico
                </a>
                <a href="#sec-proc" className="button button--ghost button--small" style={{ fontSize: '0.8rem' }}>
                  💉 Procedimentos (DIU/Biópsia)
                </a>
                <a href="#sec-soap" className="button button--ghost button--small" style={{ fontSize: '0.8rem' }}>
                  📝 SOAP & Diagnósticos
                </a>
                <a href="#sec-presc" className="button button--ghost button--small" style={{ fontSize: '0.8rem' }}>
                  💊 Prescrições & Orientações
                </a>
              </div>

              {/* Bloco 1: Anamnese Ginecológica & DUM */}
              <div
                id="sec-gyn"
                style={{
                  border: '1px solid var(--color-neutral-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                  background: '#fafafa',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', margin: '0 0 1rem 0' }}>
                  🌸 Anamnese Ginecológica Contextualizada & Ciclo
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form__label" htmlFor="gyn-dum">Data da Última Menstruação (DUM)</label>
                    <input
                      id="gyn-dum"
                      type="date"
                      className="form__input"
                      value={dum}
                      disabled={isMenopausal}
                      onChange={(e) => setDum(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.8rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isDumUncertain}
                          onChange={(e) => setIsDumUncertain(e.target.checked)}
                          disabled={isMenopausal}
                        />
                        DUM incerta / esquecida
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isMenopausal}
                          onChange={(e) => {
                            setIsMenopausal(e.target.checked);
                            if (e.target.checked) setDum('');
                          }}
                        />
                        Menopausa / Climatério
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="form__label" htmlFor="gyn-sexually-active">Vida Sexual Ativa?</label>
                    <select
                      id="gyn-sexually-active"
                      className="form__select"
                      value={isSexuallyActive === null ? '' : isSexuallyActive ? 'true' : 'false'}
                      onChange={(e) => {
                        if (e.target.value === '') setIsSexuallyActive(null);
                        else setIsSexuallyActive(e.target.value === 'true');
                      }}
                    >
                      <option value="">Não informado</option>
                      <option value="true">Sim, sexualmente ativa</option>
                      <option value="false">Não sexualmente ativa</option>
                    </select>
                  </div>

                  <div>
                    <label className="form__label" htmlFor="gyn-dyspareunia">Dispareunia (Dor na Relação)</label>
                    <select
                      id="gyn-dyspareunia"
                      className="form__select"
                      value={dyspareunia}
                      onChange={(e) => setDyspareunia(e.target.value)}
                    >
                      <option value="ausente">Ausente / Sem dor</option>
                      <option value="superficial">Superficial (introito)</option>
                      <option value="profunda">Profunda (pélvica)</option>
                      <option value="ambas">Mista / Ambas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Exame Físico Ginecológico Segmentado */}
              <div id="sec-exam" style={{ marginBottom: '1.25rem' }}>
                <GynecologicalExamSection exam={exam} onChange={setExam} />
              </div>

              {/* Bloco 3: Procedimentos Ginecológicos Ambulatoriais */}
              <div
                id="sec-proc"
                style={{
                  border: '1px solid var(--color-neutral-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.25rem',
                  background: '#fafafa',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', margin: '0 0 1rem 0' }}>
                  💉 Procedimentos Ambulatoriais (Opcional)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form__label" htmlFor="gyn-procedure">Procedimento Realizado</label>
                    <select
                      id="gyn-procedure"
                      className="form__select"
                      value={procedurePerformed}
                      onChange={(e) => setProcedurePerformed(e.target.value)}
                    >
                      <option value="">Nenhum procedimento realizado</option>
                      <option value="Inserção de DIU de Cobre">Inserção de DIU de Cobre</option>
                      <option value="Inserção de DIU Hormonal (Mirena/Kyleena)">Inserção de DIU Hormonal (Mirena/Kyleena)</option>
                      <option value="Retirada de DIU">Retirada de DIU</option>
                      <option value="Biópsia de Colo Uterino">Biópsia de Colo Uterino</option>
                      <option value="Biópsia de Endométrio (Pipelle)">Biópsia de Endométrio (Pipelle)</option>
                      <option value="Cauterização Química de Colo">Cauterização Química de Colo</option>
                      <option value="Polipectomia Cervical">Polipectomia Cervical</option>
                      <option value="Coleta de Citopatológico">Coleta de Citopatológico</option>
                    </select>
                  </div>

                  <div>
                    <label className="form__label" htmlFor="gyn-batch">Lote / Validade do Dispositivo / Amostra</label>
                    <input
                      id="gyn-batch"
                      type="text"
                      className="form__input"
                      placeholder="Ex.: Lote: DIU-9821, Val: 08/2028"
                      value={procedureBatch}
                      onChange={(e) => setProcedureBatch(e.target.value)}
                    />
                  </div>
                </div>

                {procedurePerformed && (
                  <div className="form__group">
                    <label className="form__label" htmlFor="gyn-proc-notes">Notas do Procedimento & Intercorrências</label>
                    <textarea
                      id="gyn-proc-notes"
                      className="form__textarea"
                      rows={2}
                      placeholder="Tolerância ao procedimento, posicionamento, histerometria (cm), fios cortados a quantos cm..."
                      value={procedureNotes}
                      onChange={(e) => setProcedureNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Bloco 4: Editor SOAP Tradicional & Diagnósticos */}
              <div id="sec-soap" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', margin: '0' }}>
                  📝 Evolução Clínica Estruturada (SOAP)
                </h3>

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
                    [O] Objetivo — Exame Físico Geral & Sistêmico
                  </label>
                  <textarea
                    id="soap-o"
                    className="form__textarea"
                    rows={2}
                    placeholder="Achados gerais (ectoscopia, aparelhos cardiovascular e respiratório, dados vitais complementares)..."
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="soap-a" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    [A] Avaliação — Hipóteses Diagnósticas & Diagnósticos Definitivos
                  </label>
                  <textarea
                    id="soap-a"
                    className="form__textarea"
                    rows={2}
                    placeholder="Hipóteses diagnósticas principais, diferenciais e CID-10 quando aplicável..."
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                  />
                </div>

                <div className="form__group">
                  <label htmlFor="soap-p" className="form__label" style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    [P] Plano — Conduta Clínica & Encaminhamentos
                  </label>
                  <textarea
                    id="soap-p"
                    className="form__textarea"
                    rows={2}
                    placeholder="Conduta clínica, solicitação de exames complementares, retornos programados..."
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                  />
                </div>
              </div>

              {/* Bloco 5: Prescrições Segregadas vs Orientações Gerais */}
              <div
                id="sec-presc"
                style={{
                  border: '1px solid var(--color-neutral-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  background: '#fafafa',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', margin: '0 0 1rem 0' }}>
                  💊 Prescrições & Recomendações Assistenciais
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  <div className="form__group">
                    <label className="form__label" htmlFor="presc-meds" style={{ fontWeight: 600 }}>
                      Prescrição Medicamentosa (Fármacos, Doses e Posologia)
                    </label>
                    <textarea
                      id="presc-meds"
                      className="form__textarea"
                      rows={3}
                      placeholder="Ex.: 1. Anticoncepcional oral combinado - 1 cp/dia por 21 dias..."
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                    />
                  </div>

                  <div className="form__group">
                    <label className="form__label" htmlFor="presc-orientations" style={{ fontWeight: 600 }}>
                      Orientações Gerais, Estilo de Vida & Retornos
                    </label>
                    <textarea
                      id="presc-orientations"
                      className="form__textarea"
                      rows={3}
                      placeholder="Ex.: Retorno com USG transvaginal em 30 dias. Manter hidratação adequada..."
                      value={generalOrientationNotes}
                      onChange={(e) => setGeneralOrientationNotes(e.target.value)}
                    />
                  </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {savingDraft ? (
                    <span className="form__hint" style={{ color: 'var(--color-primary)' }}>Salvando rascunho…</span>
                  ) : draftStatus ? (
                    <span className="form__hint" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>✓ {draftStatus}</span>
                  ) : isDirty ? (
                    <span className="form__hint" style={{ color: '#d97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                      Alterações pendentes de salvamento
                    </span>
                  ) : null}
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

      {/* Modais de Documentos, Histórico e Exames Anteriores */}
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

          {attachmentsModalOpen && (
            <div
              className="modal-backdrop"
              onClick={() => setAttachmentsModalOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1.5rem',
                backdropFilter: 'blur(3px)',
              }}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  width: '100%',
                  maxWidth: '960px',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--color-neutral-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-neutral-surface)',
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-primary-dark)' }}>
                    📁 Exames Anteriores da Paciente — {active.patientName}
                  </h3>
                  <button
                    type="button"
                    className="button button--secondary button--small"
                    onClick={() => setAttachmentsModalOpen(false)}
                  >
                    ✕ Fechar
                  </button>
                </div>
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                  <PatientExamAttachmentsSection
                    patientId={active.patientId}
                    medicalRecordId={active.medicalRecord?.id}
                    canEdit={true}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
