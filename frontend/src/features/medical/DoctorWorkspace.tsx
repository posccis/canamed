import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  getDoctorWorkspaceState,
  doctorCallPatient,
  doctorStartConsultation,
  doctorFinishConsultation,
  type DoctorWorkspaceStateResponse,
  type ActiveConsultationDto,
} from './doctorWorkspaceApi';
import {
  startOrGetMedicalRecord,
  updateDraftMedicalRecord,
  getGynecologicalConsultationData,
  updateGynecologicalConsultationData,
  getGynecologicalProfile,
  type GynecologicalProfileDto,
  listPatientPrenatalVisits,
  addPrenatalVisit,
  getPatientScreenings,
  type PreventiveScreeningDto,
} from './medicalRecordsApi';
import { PrenatalCardSection, type PrenatalVisitItem } from './PrenatalCardSection';
import { PreventiveScreeningList } from './PreventiveScreeningList';
import { GynecologicalExamSection, type GynecologicalExamState } from './GynecologicalExamSection';
import { GynecologicalAnamnesisSection } from './GynecologicalAnamnesisSection';
import { GynecologicalProceduresSection } from './GynecologicalProceduresSection';
import { SoapEvolutionSection } from './SoapEvolutionSection';
import { PrescriptionsAndOrientationsSection } from './PrescriptionsAndOrientationsSection';
import { DocumentModal } from './DocumentModal';
import type { MedicalDocumentType } from './medicalDocumentsApi';
import { PatientHistoryModal } from './PatientHistoryModal';
import { PatientExamAttachmentsSection } from './PatientExamAttachmentsSection';
import { ClinicalAlertsBar } from './ClinicalAlertsBar';
import { useAutoSave } from './useAutoSave';
import { useToast } from '../layout/Toast';
import { DOCTOR_PATHS } from '../../navigation/routes';
import { ConsultationFinishSummaryModal } from './components/ConsultationFinishSummaryModal';


function reconcileSubjective(
  currentSubjective: string,
  newQp: string,
  newHma: string,
  prevQp: string,
  prevHma: string
): string {
  let freeText = currentSubjective;
  if (prevQp) {
    freeText = freeText.replace(`Queixa Principal: ${prevQp}`, '').trim();
  }
  if (prevHma) {
    freeText = freeText.replace(`HMA: ${prevHma}`, '').trim();
  }
  freeText = freeText.replace(/^[\r\n]+|[\r\n]+$/g, '').trim();

  const blocks: string[] = [];
  if (newQp) blocks.push(`Queixa Principal: ${newQp}`);
  if (newHma) blocks.push(`HMA: ${newHma}`);
  if (freeText) blocks.push(freeText);

  return blocks.join('\n\n');
}

export function DoctorWorkspace() {
  const { addToast } = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramRecordId = searchParams.get('recordId') || undefined;
  const paramPatientId = searchParams.get('patientId') || undefined;
  const paramAppointmentId = searchParams.get('appointmentId') || undefined;
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const navState = location.state as {
    activeConsultation?: ActiveConsultationDto;
    resumeRecord?: any;
    patient?: { id: string; name: string; birthDate?: string };
  } | undefined;

  const initialActive: ActiveConsultationDto | null = navState?.activeConsultation || (
    navState?.resumeRecord && navState?.patient
      ? {
          queueEntryId: '',
          patientId: navState.patient.id,
          patientName: navState.patient.name,
          patientBirthDate: navState.patient.birthDate,
          medicalRecord: navState.resumeRecord,
          startedAt: navState.resumeRecord.createdAt,
        }
      : null
  );

  const [loading, setLoading] = useState(() => !initialActive);
  const [state, setState] = useState<DoctorWorkspaceStateResponse | null>(() => {
    if (initialActive) {
      return {
        doctorId: '',
        doctorName: '',
        clinicId: '',
        activeConsultation: initialActive,
        waitingQueue: [],
      };
    }
    return null;
  });

  // SOAP State
  const [subjective, setSubjective] = useState(() => initialActive?.medicalRecord?.subjective || '');
  const [objective, setObjective] = useState(() => initialActive?.medicalRecord?.objective || '');
  const [assessment, setAssessment] = useState(() => initialActive?.medicalRecord?.assessment || '');
  const [plan, setPlan] = useState(() => initialActive?.medicalRecord?.plan || '');
  const [draftStatus, setDraftStatus] = useState<string>('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [hasFinishedCurrent, setHasFinishedCurrent] = useState(false);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const [showFinishSummaryModal, setShowFinishSummaryModal] = useState(false);
  const [selectedReturnDays, setSelectedReturnDays] = useState<number>(15);
  const [finishedSummaryData, setFinishedSummaryData] = useState<{
    patientName: string;
    diagnoses: Array<{ code: string; description: string; category?: string }>;
    prescriptionsCount: number;
    plannedReturnDays: number;
  } | null>(null);

  const loadedRecordIdRef = useRef<string | null>(null);

  // Prenatal & Preventive Screening State (SPEC-0035 / RN-002, RN-012)
  const [gestationalAge, setGestationalAge] = useState<{ weeks: number; days: number } | null>(null);
  const [prenatalVisits, setPrenatalVisits] = useState<PrenatalVisitItem[]>([]);
  const [screenings, setScreenings] = useState<PreventiveScreeningDto[]>([]);
  const [loadingPrenatal, setLoadingPrenatal] = useState(false);

  // Gynecological Specialized State
  const [gynProfile, setGynProfile] = useState<GynecologicalProfileDto | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hma, setHma] = useState('');

  const handleAddPrenatalVisit = async (visit: Omit<PrenatalVisitItem, 'id'>) => {
    const activeRec = state?.activeConsultation?.medicalRecord;
    if (!activeRec?.id) return;
    const created = await addPrenatalVisit(activeRec.id, {
      visitDate: visit.visitDate,
      gestationalAgeWeeks: visit.gestationalAgeWeeks,
      gestationalAgeDays: visit.gestationalAgeDays,
      weightKg: visit.weightKg,
      bmi: visit.bmi ?? undefined,
      bloodPressure: visit.bloodPressure,
      uterineHeightCm: visit.uterineHeightCm ?? undefined,
      fetalHeartRateBpm: visit.fetalHeartRateBpm ?? undefined,
      fetalMovementPresent: visit.fetalMovementPresent ?? undefined,
      edemaClassification: visit.edemaClassification ?? undefined,
      fetalPresentation: visit.fetalPresentation ?? undefined,
      clinicalNotes: visit.clinicalNotes ?? undefined,
    });
    setPrenatalVisits((prev) => [
      {
        id: created.id,
        visitDate: created.visitDate,
        gestationalAgeWeeks: created.gestationalAgeWeeks,
        gestationalAgeDays: created.gestationalAgeDays,
        weightKg: created.weightKg,
        bmi: created.bmi,
        bloodPressure: created.bloodPressure,
        uterineHeightCm: created.uterineHeightCm,
        fetalHeartRateBpm: created.fetalHeartRateBpm,
        fetalMovementPresent: created.fetalMovementPresent,
        edemaClassification: created.edemaClassification,
        fetalPresentation: created.fetalPresentation,
        clinicalNotes: created.clinicalNotes,
      },
      ...prev,
    ]);
  };

  const handleChiefComplaintChange = (val: string) => {
    const nextSubjective = reconcileSubjective(subjective, val, hma, chiefComplaint, hma);
    setChiefComplaint(val);
    setSubjective(nextSubjective);
  };

  const handleHmaChange = (val: string) => {
    const nextSubjective = reconcileSubjective(subjective, chiefComplaint, val, chiefComplaint, hma);
    setHma(val);
    setSubjective(nextSubjective);
  };
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
  const [diagnosesJson, setDiagnosesJson] = useState('[]');

  // Auto-Save Resiliente em Segundo Plano (SPEC-0035 / RN-009)
  const activeRecordId = state?.activeConsultation?.medicalRecord?.id;
  const autoSaveData = useMemo(() => ({
    subjective,
    objective,
    assessment,
    plan,
    chiefComplaint,
    hma,
    dum,
    isDumUncertain,
    isMenopausal,
    isSexuallyActive,
    dyspareunia,
    exam,
    procedurePerformed,
    procedureBatch,
    procedureNotes,
    prescriptionNotes,
    generalOrientationNotes,
    diagnosesJson,
  }), [
    subjective, objective, assessment, plan, chiefComplaint, hma, dum, isDumUncertain, isMenopausal,
    isSexuallyActive, dyspareunia, exam, procedurePerformed, procedureBatch,
    procedureNotes, prescriptionNotes, generalOrientationNotes, diagnosesJson,
  ]);

  const { status: autoSaveStatus, lastSavedAt } = useAutoSave({
    key: activeRecordId || 'draft',
    data: autoSaveData,
    enabled: Boolean(activeRecordId),
    onSave: async (d) => {
      if (!activeRecordId) return;
      await Promise.all([
        updateDraftMedicalRecord(activeRecordId, {
          subjective: d.subjective,
          objective: d.objective,
          assessment: d.assessment,
          plan: d.plan,
        }),
        updateGynecologicalConsultationData(activeRecordId, {
          dum: d.dum || null,
          isDumUncertain: d.isDumUncertain,
          isMenopausal: d.isMenopausal,
          chiefComplaint: d.chiefComplaint || d.subjective || null,
          hma: d.hma || d.subjective || null,
          isSexuallyActive: d.isSexuallyActive,
          dyspareunia: d.dyspareunia || null,
          breastsIsNormal: d.exam.breastsIsNormal ?? null,
          breastsStatus: d.exam.breastsStatus ?? null,
          breastsFindings: d.exam.breastsFindings || null,
          abdomenIsNormal: d.exam.abdomenIsNormal ?? null,
          abdomenStatus: d.exam.abdomenStatus ?? null,
          abdomenFindings: d.exam.abdomenFindings || null,
          externalGenitaliaIsNormal: d.exam.externalGenitaliaIsNormal ?? null,
          externalGenitaliaStatus: d.exam.externalGenitaliaStatus ?? null,
          externalGenitaliaFindings: d.exam.externalGenitaliaFindings || null,
          speculumExamIsNormal: d.exam.speculumExamIsNormal ?? null,
          speculumExamStatus: d.exam.speculumExamStatus ?? null,
          speculumExamFindings: d.exam.speculumExamFindings || null,
          bimanualPalpationIsNormal: d.exam.bimanualPalpationIsNormal ?? null,
          bimanualPalpationStatus: d.exam.bimanualPalpationStatus ?? null,
          bimanualPalpationFindings: d.exam.bimanualPalpationFindings || null,
          cervicalClockFindingsJson: d.exam.cervicalClockFindingsJson || null,
          procedurePerformed: d.procedurePerformed || null,
          procedureBatch: d.procedureBatch || null,
          procedureNotes: d.procedureNotes || null,
          prescriptionNotes: d.prescriptionNotes || null,
          generalOrientationNotes: d.generalOrientationNotes || null,
          diagnosesJson: d.diagnosesJson || null,
        }).catch(() => null),
      ]);
    },
    delayMs: 5000,
  });

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
  const [docModalType, setDocModalType] = useState<MedicalDocumentType>('receita_simples');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);

  // Persistência do appointmentId na URL query para suporte a recarregamento F5 (SPEC-0035 / RN-010)
  useEffect(() => {
    const activeApptId = state?.activeConsultation?.appointmentId || state?.activeConsultation?.queueEntryId;
    if (activeApptId && searchParams.get('appointmentId') !== activeApptId) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('appointmentId', activeApptId);
          return next;
        },
        { replace: true }
      );
    }
  }, [state?.activeConsultation, searchParams, setSearchParams]);

  const loadWorkspace = useCallback(async (forceReload = false) => {
    try {
      const data = await getDoctorWorkspaceState({
        recordId: paramRecordId,
        patientId: paramPatientId,
        appointmentId: paramAppointmentId,
      });
      if (!data.activeConsultation && initialActive && !hasFinishedCurrent) {
        data.activeConsultation = initialActive;
      }
      setState(data);

      const activeRecord = data.activeConsultation?.medicalRecord || initialActive?.medicalRecord;
      if (activeRecord) {
        // PREVENÇÃO CRÍTICA: Se o mesmo prontuário já foi carregado para a sessão de atendimento atual,
        // NUNCA sobrescreve os campos locais que a médica está digitando!
        const isSameRecord = loadedRecordIdRef.current === activeRecord.id;
        if (isSameRecord && !forceReload) {
          return;
        }

        loadedRecordIdRef.current = activeRecord.id;
        setSubjective(activeRecord.subjective || '');
        setObjective(activeRecord.objective || '');
        setAssessment(activeRecord.assessment || '');
        setPlan(activeRecord.plan || '');

        // Carrega dados ginecológicos da consulta e perfil longitudinal do paciente
        const recId = activeRecord.id;
        const patId = data.activeConsultation?.patientId || initialActive?.patientId;

        getGynecologicalConsultationData(recId)
          .then((gyn) => {
            if (gyn) {
              setChiefComplaint(gyn.chiefComplaint || '');
              setHma(gyn.hma || '');
              if (!gyn.chiefComplaint && !gyn.hma && activeRecord.subjective) {
                setHma(activeRecord.subjective);
              }
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
                cervicalClockFindingsJson: gyn.cervicalClockFindingsJson || '',
              });
              setProcedurePerformed(gyn.procedurePerformed || '');
              setProcedureBatch(gyn.procedureBatch || '');
              setProcedureNotes(gyn.procedureNotes || '');
              setPrescriptionNotes(gyn.prescriptionNotes || '');
              setGeneralOrientationNotes(gyn.generalOrientationNotes || '');
              if (gyn.diagnosesJson) setDiagnosesJson(gyn.diagnosesJson);
            }
          })
          .catch(() => {
            // Em testes ou ambientes com fallback
          });

        if (patId) {
          getGynecologicalProfile(patId)
            .then((prof) => {
              if (prof) setGynProfile(prof);
            })
            .catch(() => {
              // Fallback seguro
            });

          setLoadingPrenatal(true);
          listPatientPrenatalVisits(patId)
            .then((list) => {
              if (Array.isArray(list)) {
                setPrenatalVisits(
                  list.map((v) => ({
                    id: v.id,
                    visitDate: v.visitDate,
                    gestationalAgeWeeks: v.gestationalAgeWeeks,
                    gestationalAgeDays: v.gestationalAgeDays,
                    weightKg: v.weightKg,
                    bmi: v.bmi,
                    bloodPressure: v.bloodPressure,
                    uterineHeightCm: v.uterineHeightCm,
                    fetalHeartRateBpm: v.fetalHeartRateBpm,
                    fetalMovementPresent: v.fetalMovementPresent,
                    edemaClassification: v.edemaClassification,
                    fetalPresentation: v.fetalPresentation,
                    clinicalNotes: v.clinicalNotes,
                  }))
                );
              }
            })
            .catch(() => {})
            .finally(() => setLoadingPrenatal(false));

          getPatientScreenings(patId)
            .then((sList) => {
              if (Array.isArray(sList)) setScreenings(sList);
            })
            .catch(() => {});
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar consultório.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, initialActive, paramRecordId, paramPatientId]);

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
      loadedRecordIdRef.current = null;
      await loadWorkspace(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar consulta.';
      addToast(msg, 'error');
    }
  }

  async function handleSaveDraft() {
    if (!state?.activeConsultation) return;
    setSavingDraft(true);
    try {
      let recordId = state.activeConsultation.medicalRecord?.id;
      if (!recordId && state.activeConsultation.patientId) {
        const record = await startOrGetMedicalRecord({
          patientId: state.activeConsultation.patientId,
        });
        recordId = record.id;
        setState((prev) =>
          prev && prev.activeConsultation
            ? {
                ...prev,
                activeConsultation: {
                  ...prev.activeConsultation,
                  medicalRecord: record,
                },
              }
            : prev
        );
      }

      if (!recordId) {
        addToast('Identificador do prontuário não encontrado.', 'error');
        return;
      }

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
          chiefComplaint: chiefComplaint || subjective || null,
          hma: hma || subjective || null,
          isSexuallyActive,
          dyspareunia: dyspareunia || null,
          breastsIsNormal: exam.breastsIsNormal ?? null,
          breastsStatus: exam.breastsStatus ?? null,
          breastsFindings: exam.breastsFindings || null,
          abdomenIsNormal: exam.abdomenIsNormal ?? null,
          abdomenStatus: exam.abdomenStatus ?? null,
          abdomenFindings: exam.abdomenFindings || null,
          externalGenitaliaIsNormal: exam.externalGenitaliaIsNormal ?? null,
          externalGenitaliaStatus: exam.externalGenitaliaStatus ?? null,
          externalGenitaliaFindings: exam.externalGenitaliaFindings || null,
          speculumExamIsNormal: exam.speculumExamIsNormal ?? null,
          speculumExamStatus: exam.speculumExamStatus ?? null,
          speculumExamFindings: exam.speculumExamFindings || null,
          bimanualPalpationIsNormal: exam.bimanualPalpationIsNormal ?? null,
          bimanualPalpationStatus: exam.bimanualPalpationStatus ?? null,
          bimanualPalpationFindings: exam.bimanualPalpationFindings || null,
          cervicalClockFindingsJson: exam.cervicalClockFindingsJson || null,
          diagnosesJson: diagnosesJson || null,
          procedurePerformed: procedurePerformed || null,
          procedureBatch: procedureBatch || null,
          procedureNotes: procedureNotes || null,
          prescriptionNotes: prescriptionNotes || null,
          generalOrientationNotes: generalOrientationNotes || null,
        }).catch(() => null),
      ]);

      const now = new Date();
      setDraftStatus(`Salvo às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
      addToast('Rascunho clínico e dados ginecológicos salvos!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar rascunho.';
      addToast(msg, 'error');
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleFinishConsultation() {
    if (!state?.activeConsultation) {
      addToast('Nenhum atendimento clínico ativo encontrado para finalizar.', 'error');
      return;
    }

    const hasClinicalContent = Boolean(
      subjective.trim() ||
      objective.trim() ||
      assessment.trim() ||
      plan.trim() ||
      chiefComplaint.trim() ||
      hma.trim() ||
      procedurePerformed.trim() ||
      procedureNotes.trim() ||
      prescriptionNotes.trim() ||
      generalOrientationNotes.trim() ||
      dum.trim() ||
      !exam.breastsIsNormal ||
      !exam.abdomenIsNormal ||
      !exam.externalGenitaliaIsNormal ||
      !exam.speculumExamIsNormal ||
      !exam.bimanualPalpationIsNormal
    );

    if (!hasClinicalContent) {
      addToast('Preencha ao menos uma seção do prontuário ou exame antes de finalizar.', 'error');
      return;
    }

    // Se o medicalRecord ainda não estiver associado no estado local, vincula agora
    if (!state.activeConsultation.medicalRecord?.id && state.activeConsultation.patientId) {
      try {
        setFinishing(true);
        const record = await startOrGetMedicalRecord({
          patientId: state.activeConsultation.patientId,
        });
        setState((prev) =>
          prev && prev.activeConsultation
            ? {
                ...prev,
                activeConsultation: {
                  ...prev.activeConsultation,
                  medicalRecord: record,
                },
              }
            : prev
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao vincular prontuário clínico.';
        addToast(msg, 'error');
        return;
      } finally {
        setFinishing(false);
      }
    }

    setShowFinishConfirmModal(true);
  }

  async function executeFinishConsultation() {
    if (!state?.activeConsultation) return;

    setFinishing(true);
    try {
      let recordId = state.activeConsultation.medicalRecord?.id;
      if (!recordId && state.activeConsultation.patientId) {
        const record = await startOrGetMedicalRecord({
          patientId: state.activeConsultation.patientId,
        });
        recordId = record.id;
      }

      if (!recordId) {
        addToast('Identificador do prontuário clínico não encontrado.', 'error');
        return;
      }

      // Consolida campos clínicos para garantir persistência íntegra no prontuário
      const finalSubjective = subjective.trim() || [
        chiefComplaint.trim() ? `Queixa Principal: ${chiefComplaint.trim()}` : '',
        hma.trim() ? `HMA: ${hma.trim()}` : ''
      ].filter(Boolean).join('\n\n') || 'Atendimento ginecológico registrado.';

      const finalPlan = plan.trim() || [
        prescriptionNotes.trim() ? `Prescrições:\n${prescriptionNotes.trim()}` : '',
        generalOrientationNotes.trim() ? `Orientações:\n${generalOrientationNotes.trim()}` : ''
      ].filter(Boolean).join('\n\n');

      const finalObjective = objective.trim() || (
        procedurePerformed.trim() ? `Procedimento Realizado: ${procedurePerformed.trim()}` : ''
      );

      // 1. Salva notas consolidadas e dados ginecológicos especializados
      await Promise.all([
        updateDraftMedicalRecord(recordId, {
          subjective: finalSubjective,
          objective: finalObjective,
          assessment: assessment.trim(),
          plan: finalPlan,
        }),
        updateGynecologicalConsultationData(recordId, {
          dum: dum || null,
          isDumUncertain,
          isMenopausal,
          chiefComplaint: chiefComplaint || finalSubjective || null,
          hma: hma || finalSubjective || null,
          isSexuallyActive,
          dyspareunia: dyspareunia || null,
          breastsIsNormal: exam.breastsIsNormal ?? null,
          breastsStatus: exam.breastsStatus ?? null,
          breastsFindings: exam.breastsFindings || null,
          abdomenIsNormal: exam.abdomenIsNormal ?? null,
          abdomenStatus: exam.abdomenStatus ?? null,
          abdomenFindings: exam.abdomenFindings || null,
          externalGenitaliaIsNormal: exam.externalGenitaliaIsNormal ?? null,
          externalGenitaliaStatus: exam.externalGenitaliaStatus ?? null,
          externalGenitaliaFindings: exam.externalGenitaliaFindings || null,
          speculumExamIsNormal: exam.speculumExamIsNormal ?? null,
          speculumExamStatus: exam.speculumExamStatus ?? null,
          speculumExamFindings: exam.speculumExamFindings || null,
          bimanualPalpationIsNormal: exam.bimanualPalpationIsNormal ?? null,
          bimanualPalpationStatus: exam.bimanualPalpationStatus ?? null,
          bimanualPalpationFindings: exam.bimanualPalpationFindings || null,
          procedurePerformed: procedurePerformed || null,
          procedureBatch: procedureBatch || null,
          procedureNotes: procedureNotes || null,
          prescriptionNotes: prescriptionNotes || null,
          generalOrientationNotes: generalOrientationNotes || null,
        }).catch(() => null),
      ]);

      // 2. Valida UUID da fila
      const isGuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      const safeQueueId = isGuidRegex.test(state.activeConsultation.queueEntryId || '')
        ? state.activeConsultation.queueEntryId
        : '00000000-0000-0000-0000-000000000000';

      // 3. Finaliza prontuário e fila com Retorno Programado CFM 1.958/2010 (RN-015)
      await doctorFinishConsultation({
        medicalRecordId: recordId,
        queueEntryId: safeQueueId,
        plannedReturnDays: selectedReturnDays,
      });

      const summary = {
        patientName: state.activeConsultation.patientName,
        diagnoses: assessment.trim()
          ? [{ code: 'N86', description: assessment.trim().slice(0, 60), category: 'confirmed' }]
          : [],
        prescriptionsCount: prescriptionNotes.trim() ? prescriptionNotes.trim().split('\n').filter(Boolean).length : 0,
        plannedReturnDays: selectedReturnDays,
      };
      setFinishedSummaryData(summary);

      addToast('Atendimento finalizado com sucesso!', 'success');
      setShowFinishConfirmModal(false);
      setShowFinishSummaryModal(true);
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
                    className={`button button--small ${isPrivacyMode ? 'button--warning' : 'button--secondary'}`}
                    onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                    aria-pressed={isPrivacyMode}
                    title="Modo Privacidade (Oculta temporariamente queixas íntimas e exame físico da visão direta de acompanhantes)"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: 600,
                      borderRadius: 'var(--radius-full, 999px)',
                    }}
                  >
                    <span>{isPrivacyMode ? '🕶️ Modo Privacidade Ativo' : '🕶️ Modo Privacidade'}</span>
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
                    onClick={() => {
                    setDocModalType('receita_simples');
                    setDocModalOpen(true);
                  }}
                  >
                    📄 + Receita / Documento
                  </button>
                </div>
              </div>

              {/* Barramento Semântico de Alertas Críticos (SPEC-0035 / RN-008) */}
              <ClinicalAlertsBar
                bloodPressure={active.triage?.bloodPressure}
                fastingBloodGlucose={active.triage?.glucose}
                rhFactor={active.patientRhFactor}
                bloodType={active.patientBloodType}
              />

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

              {/* Dock Sticky de Navegação Rápida com Badges Dinâmicos (Task 8 / RN-009) */}
              {(() => {
                const isAnamnesisFilled = Boolean(chiefComplaint.trim() || hma.trim() || dum.trim() || isMenopausal || isSexuallyActive !== null || gynProfile);
                const isExamFilled = Boolean(!exam.breastsIsNormal || exam.breastsFindings || !exam.abdomenIsNormal || exam.abdomenFindings || !exam.externalGenitaliaIsNormal || exam.externalGenitaliaFindings || !exam.speculumExamIsNormal || exam.speculumExamFindings || !exam.bimanualPalpationIsNormal || exam.bimanualPalpationFindings);
                const isProcFilled = Boolean(procedurePerformed.trim() || procedureBatch.trim() || procedureNotes.trim());
                const isSoapFilled = Boolean(subjective.trim() || objective.trim() || assessment.trim() || plan.trim());
                const isPrescFilled = Boolean(prescriptionNotes.trim() || generalOrientationNotes.trim());

                return (
                  <nav
                    data-testid="consultation-dock"
                    className="consultation-dock--sticky"
                    aria-label="Atalhos de Seções do Consultório"
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      overflowX: 'auto',
                      borderRadius: 'var(--radius-md, 8px)',
                    }}
                  >
                    <a href="#sec-gyn-anamnesis" className="button button--ghost button--small" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>🌸 Anamnese & Ciclo</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isAnamnesisFilled ? '#059669' : '#94A3B8' }}>
                        {isAnamnesisFilled ? '✓' : '○'}
                      </span>
                    </a>
                    <a href="#sec-prenatal-screening" className="button button--ghost button--small" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>🤰 Pré-Natal & Rastreamento</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: prenatalVisits.length > 0 || screenings.length > 0 ? '#059669' : '#94A3B8' }}>
                        {prenatalVisits.length > 0 || screenings.length > 0 ? '✓' : '○'}
                      </span>
                    </a>
                    <a href="#sec-exam" className="button button--ghost button--small" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>🩺 Exame Físico Ginecológico</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isExamFilled ? '#059669' : '#94A3B8' }}>
                        {isExamFilled ? '✓' : '○'}
                      </span>
                    </a>
                    <a href="#sec-proc" className="button button--ghost button--small" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>💉 Procedimentos (DIU/Biópsia)</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isProcFilled ? '#059669' : '#94A3B8' }}>
                        {isProcFilled ? '✓' : '○'}
                      </span>
                    </a>
                    <a href="#sec-soap" className="button button--ghost button--small" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>📝 SOAP & Diagnósticos</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSoapFilled ? '#059669' : '#94A3B8' }}>
                        {isSoapFilled ? '✓' : '○'}
                      </span>
                    </a>
                    <a href="#sec-presc" className="button button--ghost button--small" style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>💊 Prescrições & Orientações</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isPrescFilled ? '#059669' : '#94A3B8' }}>
                        {isPrescFilled ? '✓' : '○'}
                      </span>
                    </a>
                  </nav>
                );
              })()}

              <div data-testid="consultation-sensitive-area" className={isPrivacyMode ? 'privacy-blur' : ''}>
                {/* Central de Anamnese Ginecológica Integrada */}
                <GynecologicalAnamnesisSection
                  chiefComplaint={chiefComplaint}
                  onChiefComplaintChange={handleChiefComplaintChange}
                  hma={hma}
                  onHmaChange={handleHmaChange}
                  dum={dum}
                  onDumChange={setDum}
                  isDumUncertain={isDumUncertain}
                  onIsDumUncertainChange={setIsDumUncertain}
                  isMenopausal={isMenopausal}
                  onIsMenopausalChange={setIsMenopausal}
                  isSexuallyActive={isSexuallyActive}
                  onIsSexuallyActiveChange={setIsSexuallyActive}
                  dyspareunia={dyspareunia}
                  onDyspareuniaChange={setDyspareunia}
                  privacyMode={isPrivacyMode}
                  onPrivacyModeToggle={() => setIsPrivacyMode(!isPrivacyMode)}
                  profile={gynProfile}
                  onProfileUpdated={setGynProfile}
                  onApplyObstetricValues={(val) => {
                    setGestationalAge({ weeks: val.effectiveGaWeeks, days: val.effectiveGaDays });
                    addToast(
                      `Reconciliação aplicada: ${val.effectiveGaWeeks}s ${val.effectiveGaDays}d (DPP: ${new Date(val.effectiveEdd + 'T00:00:00').toLocaleDateString('pt-BR')})`,
                      'success'
                    );
                  }}
                />

                {/* Bloco: Acompanhamento Obstétrico / Pré-Natal e Rastreamento Preventivo */}
                <div id="sec-prenatal-screening" style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <PrenatalCardSection
                      patientId={state?.activeConsultation?.patientId || ''}
                      patientName={state?.activeConsultation?.patientName || 'Paciente'}
                      patientBirthDate={state?.activeConsultation?.patientBirthDate}
                      visits={prenatalVisits}
                      initialGestationalAgeWeeks={gestationalAge?.weeks}
                      initialGestationalAgeDays={gestationalAge?.days}
                      onAddVisit={handleAddPrenatalVisit}
                      loading={loadingPrenatal}
                      dum={dum || (gynProfile as any)?.lastMenstrualPeriod || undefined}
                      bloodType={active?.patientBloodType ?? undefined}
                      rhFactor={active?.patientRhFactor ?? undefined}
                      gynProfile={gynProfile}
                      heightCm={active?.triage?.heightCm ?? undefined}
                    />
                    <PreventiveScreeningList
                      patientId={state?.activeConsultation?.patientId || ''}
                      patientBirthDate={state?.activeConsultation?.patientBirthDate}
                      screenings={screenings}
                      onScreeningAdded={(newScr) => setScreenings((prev) => [newScr, ...prev])}
                    />
                  </div>
                </div>

                {/* Bloco 2: Exame Físico Ginecológico Segmentado */}
                <div id="sec-exam" style={{ marginBottom: '1.25rem' }}>
                  <GynecologicalExamSection exam={exam} onChange={setExam} />
                </div>

                {/* Bloco 3: Procedimentos Ginecológicos Ambulatoriais */}
                <div id="sec-proc" style={{ marginBottom: '1.25rem' }}>
                  <GynecologicalProceduresSection
                    procedurePerformed={procedurePerformed}
                    onProcedurePerformedChange={setProcedurePerformed}
                    procedureBatch={procedureBatch}
                    onProcedureBatchChange={setProcedureBatch}
                    procedureNotes={procedureNotes}
                    onProcedureNotesChange={setProcedureNotes}
                  />
                </div>
              </div>

              {/* Bloco 4: Editor SOAP Tradicional & Diagnósticos */}
              <div id="sec-soap" style={{ marginBottom: '1.25rem' }}>
                <SoapEvolutionSection
                  subjective={subjective}
                  onSubjectiveChange={setSubjective}
                  objective={objective}
                  onObjectiveChange={setObjective}
                  assessment={assessment}
                  onAssessmentChange={setAssessment}
                  plan={plan}
                  onPlanChange={setPlan}
                  diagnosesJson={diagnosesJson}
                  onDiagnosesJsonChange={setDiagnosesJson}
                />
              </div>

              {/* Bloco 5: Prescrições Segregadas vs Orientações Gerais */}
              <div id="sec-presc" style={{ marginBottom: '1.5rem' }}>
                <PrescriptionsAndOrientationsSection
                  prescriptionNotes={prescriptionNotes}
                  onPrescriptionNotesChange={setPrescriptionNotes}
                  generalOrientationNotes={generalOrientationNotes}
                  onGeneralOrientationNotesChange={setGeneralOrientationNotes}
                  onEmitPrescription={(type) => {
                    setDocModalType(type);
                    setDocModalOpen(true);
                  }}
                />
              </div>

              {/* Sticky Footer Consolidando Autosave e Ações (Task 8 / RN-009) */}
              <div
                data-testid="consultation-sticky-footer"
                className="consultation-footer--sticky"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {autoSaveStatus === 'saving' || savingDraft ? (
                    <span className="form__hint" style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className="animate-spin" style={{ display: 'inline-block' }}>⏳</span>
                      Sincronizando com nuvem e backup local…
                    </span>
                  ) : autoSaveStatus === 'saved' || draftStatus ? (
                    <span className="form__hint" style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      ✓ Salvo automaticamente {lastSavedAt ? `às ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                  ) : autoSaveStatus === 'error' ? (
                    <span className="form__hint" style={{ color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ Falha na sincronização. Salvo em backup local.
                    </span>
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

            {/* Modal Acessível de Confirmação de Finalização do Atendimento */}
      {showFinishConfirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
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
              borderRadius: 'var(--radius-lg, 12px)',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--color-neutral-border, #CBD5E1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: '#E0F2F1',
                  color: 'var(--color-primary-dark, #6F217B)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                }}
              >
                ✓
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark, #6F217B)', fontSize: '1.15rem', fontWeight: 700 }}>
                  Finalizar Atendimento Clínico
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Encerramento oficial da consulta e guarda legal do prontuário
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              Tem certeza de que deseja finalizar o atendimento clínico de{' '}
              <strong style={{ color: 'var(--color-primary-dark, #6F217B)' }}>
                {state?.activeConsultation?.patientName || 'Paciente'}
              </strong>
              ? O prontuário se tornará imutável conforme as diretrizes do CFM e da Lei nº 13.787/2018. Qualquer retificação futura deverá ser realizada exclusivamente via adendo clínico justificado.
            </p>

            
            {/* Seletor de Prazo de Retorno CFM 1.958/2010 */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label htmlFor="finish-return-days" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #6F217B)', marginBottom: '0.35rem' }}>
                Prazo Sugerido para Retorno (CFM nº 1.958/2010):
              </label>
              <select
                id="finish-return-days"
                value={selectedReturnDays}
                onChange={(e) => setSelectedReturnDays(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  background: '#FFFFFF',
                  color: '#1E293B',
                }}
              >
                <option value={15}>15 dias — Reavaliação de Exames Complementares (Isento de novos honorários)</option>
                <option value={30}>30 a 45 dias — Controle Pós-Inserção de DIU / Procedimento</option>
                <option value={28}>4 semanas (28 dias) — Consulta de Pré-Natal</option>
                <option value={365}>1 ano (365 dias) — Rotina Ginecológica Preventiva Anual</option>
                <option value={0}>Sem retorno programado</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setShowFinishConfirmModal(false)}
                disabled={finishing}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={executeFinishConsultation}
                disabled={finishing}
                style={{ background: 'var(--color-primary-dark, #6F217B)' }}
              >
                {finishing ? 'Finalizando…' : '✓ Sim, Finalizar Prontuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Modal de Resumo de Alta & Fechamento da Consulta (Task 16 / RN-015) */}
      <ConsultationFinishSummaryModal
        isOpen={showFinishSummaryModal}
        patientName={finishedSummaryData?.patientName || state?.activeConsultation?.patientName || 'Paciente'}
        diagnoses={finishedSummaryData?.diagnoses}
        prescriptionsCount={finishedSummaryData?.prescriptionsCount}
        plannedReturnDays={finishedSummaryData?.plannedReturnDays ?? selectedReturnDays}
        onConfirmClose={() => {
          setShowFinishSummaryModal(false);
          setHasFinishedCurrent(true);
          setSearchParams({});
          if (typeof window !== 'undefined' && window.history?.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setSubjective('');
          setObjective('');
          setAssessment('');
          setPlan('');
          setChiefComplaint('');
          setHma('');
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
          loadedRecordIdRef.current = null;
          setState((prev) => (prev ? { ...prev, activeConsultation: undefined } : null));
          loadWorkspace();
        }}
        onClose={() => {
          setShowFinishSummaryModal(false);
          loadWorkspace();
        }}
      />

      {/* Modais de Documentos, Histórico e Exames Anteriores */}
      {active && (
        <>
          <DocumentModal
            isOpen={docModalOpen}
            patientId={active.patientId}
            patientName={active.patientName}
            medicalRecordId={active.medicalRecord?.id}
            initialDocType={docModalType}
            initialMedications={prescriptionNotes}
            initialGeneralInstructions={generalOrientationNotes}
            initialDiagnoses={diagnosesJson}
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

