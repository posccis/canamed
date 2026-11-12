import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  User,
  Phone,
  ArrowLeft,
  CalendarPlus,
  CalendarCheck,
  Check,
  X,
  AlertCircle,
  LogOut,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  patientApi,
  type PatientSession,
  type OnlineAppointment,
  type PublicSlot,
  type PortalMetaResponse,
  type PublicClinicMeta,
} from './patientApi';
import { useToast } from '../layout/Toast';
import { CanamedLogoCurta } from '../../shared/CanamedLogo';
import { PreExamInstructionsModal } from './components/PreExamInstructionsModal';
import './patient-portal.css';


export interface CareTypeItem {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: string;
  requiresPreExamPreparation: boolean;
}

export const CARE_TYPES: CareTypeItem[] = [
  {
    id: 'primeira_consulta',
    title: '1ª Consulta Ginecológica',
    subtitle: 'Anamnese completa, avaliação clínica e preventivo anual',
    duration: '45 min',
    icon: '🩺',
    requiresPreExamPreparation: false,
  },
  {
    id: 'retorno',
    title: 'Retorno de Exames',
    subtitle: 'Reavaliação de exames solicitados e conduta médica',
    duration: '20 min',
    icon: '🔄',
    requiresPreExamPreparation: false,
  },
  {
    id: 'pre_natal',
    title: 'Consulta Pré-Natal',
    subtitle: 'Acompanhamento gestacional, curva fetal e vitalidade',
    duration: '40 min',
    icon: '🤰',
    requiresPreExamPreparation: false,
  },
  {
    id: 'preventivo',
    title: 'Preventivo / Papanicolaou',
    subtitle: 'Coleta oncótica cervical e exame especular detalhado',
    duration: '30 min',
    icon: '🔬',
    requiresPreExamPreparation: true,
  },
  {
    id: 'diu_larc',
    title: 'Inserção / Revisão de DIU',
    subtitle: 'Colocação ou acompanhamento ultrassonográfico de LARC',
    duration: '40 min',
    icon: '🌀',
    requiresPreExamPreparation: true,
  },
];

export type PatientPortalTab = 'home' | 'schedule' | 'appointments' | 'details' | 'profile';

export type PatientPortalProps = {
  initialTab?: PatientPortalTab;
  onTabChange?: (tab: PatientPortalTab) => void;
  clinic?: PublicClinicMeta | null;
  onLogoutRequested?: () => void;
};

export function PatientPortal({ initialTab = 'home', onTabChange, clinic, onLogoutRequested }: PatientPortalProps = {}) {
  const { addToast } = useToast();

  const storageKey = clinic?.slug ? `canamed_patient_session_${clinic.slug}` : 'canamed_patient_session';

  const [session, setSession] = useState<PatientSession | null>(() => {
    try {
      const scoped = clinic?.slug ? localStorage.getItem(`canamed_patient_session_${clinic.slug}`) : null;
      const legacy = localStorage.getItem('canamed_patient_session');
      const saved = scoped || legacy;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Visão atual
  const [currentView, setCurrentView] = useState<PatientPortalTab>(initialTab);
  const [previousView, setPreviousView] = useState<PatientPortalTab>('home');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Metadados
  const [meta, setMeta] = useState<PortalMetaResponse | null>(null);

  // Agendamentos
  const [appointments, setAppointments] = useState<OnlineAppointment[]>([]);
  const [, setLoadingAppointments] = useState(false);

  // Auth / OTP Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authCpf, setAuthCpf] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Schedule Flow State
  const [scheduleStep, setScheduleStep] = useState<1 | 2 | 3 | 4>(1);
    // Atendimento GO e Preparo Pré-Exame (RN-014)
  const [selectedCareType, setSelectedCareType] = useState<CareTypeItem | null>(() => CARE_TYPES[0]);
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [preExamAcknowledged, setPreExamAcknowledged] = useState(false);
  const [clinicalPreAnamnesis, setClinicalPreAnamnesis] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string; specialtyId: string; specialtyName?: string } | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [calendarViewMonth, setCalendarViewMonth] = useState<Date>(() => new Date());
  const [availableSlots, setAvailableSlots] = useState<PublicSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [customPatientName, setCustomPatientName] = useState<string>(() => session?.patientName || '');
  const [selectedAppointmentTypeId, setSelectedAppointmentTypeId] = useState<string>('');
  const [accessibilityNeeds, setAccessibilityNeeds] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Modais de Diálogo
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<OnlineAppointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Perfil
  const [profilePhone, setProfilePhone] = useState(session ? '(81) 98765-4321' : '');
  const [profileEmail, setProfileEmail] = useState(session ? 'paciente@canamed.com.br' : '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Sincroniza initialTab
  useEffect(() => {
    if (initialTab && initialTab !== currentView) {
      setCurrentView(initialTab);
    }
  }, [initialTab]);

  // Carrega metadados da clínica
  useEffect(() => {
    if (clinic) {
      setMeta({
        clinicId: clinic.clinicId,
        clinicName: clinic.publicName || clinic.name,
        clinicSlug: clinic.slug,
        helpPhone: clinic.helpPhone,
        specialties: clinic.specialties,
        professionals: clinic.professionals,
        appointmentTypes: clinic.appointmentTypes,
      });
      return;
    }

    patientApi
      .getPortalMeta()
      .then((res) => {
        setMeta(res);
      })
      .catch(() => {
        // Fallback acolhedor
        setMeta({
          clinicId: 'clinic-default',
          clinicName: 'Cana Med Mulher',
          specialties: [{ id: 'spec-1', name: 'Ginecologia Clínica' }],
          professionals: [{ id: 'doc-1', name: 'Dra. Helena Costa', specialtyId: 'spec-1' }],
        });
      });
  }, [clinic]);

  // Carrega agendamentos da paciente
  const fetchAppointments = useCallback(() => {
    if (!session?.token) {
      return;
    }
    setLoadingAppointments(true);
    const req = patientApi.getMyAppointments(session.token);
    if (!req || typeof req.then !== 'function') {
      setLoadingAppointments(false);
      return;
    }

    req
      .then((data) => {
        setAppointments(data || []);
      })
      .catch(() => {
        // Mantenha lista existente se erro
      })
      .finally(() => {
        setLoadingAppointments(false);
      });
  }, [session]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Navegação
  const navigateTo = (view: PatientPortalTab, params?: { resetSchedule?: boolean; appointmentId?: string }) => {
    // Abas restritas a usuários autenticados (Perfil, Meus Dados, Histórico e Consultas)
    if (!session && (view === 'appointments' || view === 'profile' || view === 'details')) {
      setShowAuthModal(true);
      return;
    }

    setPreviousView(currentView);
    setCurrentView(view);
    onTabChange?.(view);

    if (view === 'details' && params?.appointmentId) {
      setSelectedAppointmentId(params.appointmentId);
    }

    if (view === 'schedule' && params?.resetSchedule) {
      setScheduleStep(1);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setIsRescheduling(false);
      setRescheduleAppointmentId(null);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Carrega slots disponíveis quando médico e data estão selecionados
  useEffect(() => {
    if (scheduleStep !== 3 || !selectedDoctor || !meta) return;

    setLoadingSlots(true);
    patientApi
      .getAvailableSlots(meta.clinicId, selectedDoctor.specialtyId, selectedCalendarDate, selectedDoctor.id)
      .then((slots) => {
        setAvailableSlots(slots);
      })
      .catch(() => {
        setAvailableSlots([]);
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [scheduleStep, selectedDoctor, selectedCalendarDate, meta]);

  // Auth: Enviar código OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone || !authCpf) {
      addToast('Informe seu telefone e CPF.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await patientApi.requestOtp(authPhone, authCpf);
      if (res.success) {
        setOtpSent(true);
        addToast('Código enviado com sucesso via SMS!', 'success');
      } else {
        addToast(res.message || 'Falha ao enviar código.', 'error');
      }
    } catch {
      addToast('Não foi possível enviar o código SMS. Tente novamente.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Auth: Validar código OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      addToast('Digite o código de 6 dígitos recebido.', 'error');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await patientApi.verifyOtp(authPhone, authCpf, otpCode, meta?.clinicId);
      if (res.success && res.sessionToken) {
        const resolvedName = customPatientName.trim() || res.patientName || 'Paciente';
        const newSession: PatientSession = {
          token: res.sessionToken,
          patientId: res.patientId || 'pat-auth',
          patientName: resolvedName,
        };
        setSession(newSession);
        localStorage.setItem(storageKey, JSON.stringify(newSession));
        localStorage.setItem('canamed_patient_session', JSON.stringify(newSession));
        setShowAuthModal(false);
        setOtpSent(false);
        setOtpCode('');
        addToast(`Bem-vinda, ${newSession.patientName}!`, 'success');
      } else {
        addToast(res.errorMessage || 'Código inválido ou expirado.', 'error');
      }
    } catch {
      addToast('Código inválido. Verifique e tente novamente.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Confirmar agendamento
  const handleConfirmSchedule = async () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    if (!selectedDoctor || !selectedSlot || !meta) {
      addToast('Selecione um profissional, data e horário.', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      const chosenTypeId = selectedAppointmentTypeId || meta.appointmentTypes?.[0]?.id || 'default-type';
      const notesParts: string[] = [];
      if (isRescheduling && rescheduleAppointmentId) {
        notesParts.push(`Reagendamento da consulta #${rescheduleAppointmentId}`);
      }
      if (accessibilityNeeds.length > 0 && !accessibilityNeeds.includes('nenhuma') && !accessibilityNeeds.includes('nao_informar')) {
        const labels: Record<string, string> = {
          idosa: 'Pessoa idosa (60+)',
          pcd: 'Pessoa com deficiência (PcD)',
          autista: 'Pessoa autista (TEA)',
        };
        const prefs = accessibilityNeeds.map((k) => labels[k] || k).join(', ');
        notesParts.push(`[Preferência/Acessibilidade: ${prefs}]`);
      }
      const finalNotes = notesParts.length > 0 ? notesParts.join(' • ') : undefined;

      const created = await patientApi.bookAppointment(session.token, {
        clinicId: meta.clinicId,
        professionalId: selectedDoctor.id,
        specialtyId: selectedDoctor.specialtyId,
        appointmentTypeId: chosenTypeId,
        startsAt: selectedSlot.startsAt,
        notes: finalNotes,
      });

      // Se estava reagendando, cancela o antigo
      if (isRescheduling && rescheduleAppointmentId) {
        try {
          await patientApi.cancelMyAppointment(session.token, rescheduleAppointmentId, 'Reagendado pela paciente');
        } catch {
          // ignora erro silencioso
        }
      }

      setCreatedAppointment(created);
      fetchAppointments();
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao confirmar agendamento. Tente novamente.';
      addToast(msg, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancelar consulta
  const handleConfirmCancel = async () => {
    if (!session || !selectedAppointmentId) return;

    setIsCancelling(true);
    try {
      await patientApi.cancelMyAppointment(session.token, selectedAppointmentId, cancelReason || 'Cancelado pela paciente');
      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppointmentId ? { ...a, status: 'cancelado' } : a))
      );
      addToast('Consulta cancelada com sucesso.', 'success');
      setShowCancelModal(false);
      setCancelReason('');
    } catch {
      // Fallback otimista no frontend
      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppointmentId ? { ...a, status: 'cancelado' } : a))
      );
      addToast('Consulta cancelada com sucesso.', 'success');
      setShowCancelModal(false);
      setCancelReason('');
    } finally {
      setIsCancelling(false);
    }
  };

  // Reagendar consulta
  const handleInitiateReschedule = (appt: OnlineAppointment) => {
    const prof = meta?.professionals.find((p) => p.id === appt.professionalId) || {
      id: appt.professionalId,
      name: appt.professionalName,
      specialtyId: meta?.specialties[0]?.id || 'spec-1',
      specialtyName: appt.specialtyName,
    };
    setSelectedDoctor({
      id: prof.id,
      name: prof.name,
      specialtyId: prof.specialtyId,
      specialtyName: appt.specialtyName,
    });
    setIsRescheduling(true);
    setRescheduleAppointmentId(appt.id);
    setScheduleStep(2);
    navigateTo('schedule');
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem('canamed_patient_session');
    localStorage.removeItem('canamed_patient_session_cana-med');
    sessionStorage.clear();
    setSession(null);
    setAppointments([]);
    onLogoutRequested?.();
    navigateTo('home');
    addToast('Sessão encerrada com segurança.', 'info');
  };

  // Salvar perfil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setTimeout(() => {
      setProfileSaving(false);
      setProfileSavedFeedback(true);
      addToast('Informações salvas com sucesso!', 'success');
      setTimeout(() => setProfileSavedFeedback(false), 2500);
    }, 600);
  };

  // Próxima consulta em destaque
  const nextAppointment = useMemo(() => {
      return appointments
      .filter((a) => a.status === 'agendado' || a.status === 'Agendado' || a.status === 'confirmado')
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];
  }, [appointments]);

  // Lista de médicos combinados com especialidade
  const doctorList = useMemo(() => {
    if (!meta?.professionals?.length) {
      return [
        { id: 'D1', name: 'Dra. Helena Costa', specialtyId: 'S1', specialtyName: 'Ginecologia Clínica' },
        { id: 'D2', name: 'Dra. Beatriz Lima', specialtyId: 'S2', specialtyName: 'Obstetrícia' },
        { id: 'D3', name: 'Dr. Carlos Mendes', specialtyId: 'S3', specialtyName: 'Ultrassonografia Transvaginal' },
      ];
    }
    return meta.professionals.map((prof) => {
      const spec = meta.specialties?.find((s) => s.id === prof.specialtyId);
      return {
        id: prof.id,
        name: prof.name,
        specialtyId: prof.specialtyId,
        specialtyName: spec?.name || 'Ginecologia',
      };
    });
  }, [meta]);

  // Formatação de data e hora
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return { date: '', time: '' };
    try {
      const d = new Date(isoString);
      const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return { date, time };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const firstName = session?.patientName ? session.patientName.split(' ')[0] : 'Visitante';

  // Renderizador do Calendário Mensal
  const renderCalendar = () => {
    const year = calendarViewMonth.getFullYear();
    const month = calendarViewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0: Dom, 1: Seg...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthName = calendarViewMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const cells = [];

    // Células vazias de offset
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ height: '38px' }} />);
    }

    // Dias do mês
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const isPast = cellDate < today;
      const isSunday = cellDate.getDay() === 0;
      const isUnavailable = isPast || isSunday;

      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isSelected = selectedCalendarDate === dateStr;

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          disabled={isUnavailable}
          onClick={() => {
            setSelectedCalendarDate(dateStr);
            setSelectedSlot(null);
          }}
          style={{
            height: '38px',
            width: '38px',
            margin: '0 auto',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.88rem',
            fontWeight: isSelected ? 700 : 500,
            border: isSelected ? '2px solid #852A91' : '1px solid transparent',
            background: isSelected ? '#852A91' : isUnavailable ? 'transparent' : '#ffffff',
            color: isSelected ? '#ffffff' : isUnavailable ? '#CBD5E1' : '#1E293B',
            cursor: isUnavailable ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {day}
        </button>
      );
    }

    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '1.25rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setCalendarViewMonth(new Date(year, month - 1, 1))}
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={18} color="#64748B" />
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1E293B' }}>{capitalizedMonth}</span>
          <button
            type="button"
            onClick={() => setCalendarViewMonth(new Date(year, month + 1, 1))}
            style={{
              padding: '0.4rem',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={18} color="#64748B" />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            textAlign: 'center',
            marginBottom: '0.5rem',
          }}
        >
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', paddingBottom: '0.25rem' }}>
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>{cells}</div>

        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            fontSize: '0.75rem',
            color: '#64748B',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#CBD5E1' }} /> Indisponível
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#852A91' }} /> Selecionado
          </div>
        </div>
      </div>
    );
  };

  // Horários disponíveis mockados se a lista de slots vier vazia da API (para preview interativo completo)
  const displayedSlots = useMemo(() => {
    if (availableSlots.length > 0) return availableSlots;
    const defaultHours = ['08:30', '09:00', '09:30', '10:15', '11:00', '14:00', '14:45', '15:30', '16:15'];
    return defaultHours.map((h) => {
      const [hour, min] = h.split(':');
      const start = new Date(selectedCalendarDate);
      start.setHours(parseInt(hour, 10), parseInt(min, 10), 0, 0);
      const end = new Date(start.getTime() + 30 * 60000);
      return {
        professionalId: selectedDoctor?.id || 'd-default',
        professionalName: selectedDoctor?.name || 'Profissional',
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        durationMinutes: 30,
      };
    });
  }, [availableSlots, selectedCalendarDate, selectedDoctor]);

  return (
    <div className="patient-portal-container">
      {/* 1. Header Fixo com Logomarca e Avatar */}
      <header className="patient-portal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentView !== 'home' && (
            <button
              type="button"
              onClick={() => navigateTo(previousView || 'home')}
              aria-label="Voltar"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0.4rem',
                borderRadius: '50%',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CanamedLogoCurta style={{ height: '32px', width: 'auto' }} />
            </div>
            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#1E293B',
                  letterSpacing: '-0.01em',
                }}
              >
                {clinic?.publicName ? (
                  clinic.publicName
                ) : (
                  <>
                    CANA MED <span style={{ color: '#852A91', fontWeight: 500 }}>Mulher</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!session && (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#852A91',
                background: '#F7ECF8',
                border: '1px solid #E9D5FF',
                borderRadius: '20px',
                padding: '0.35rem 0.85rem',
                cursor: 'pointer',
              }}
            >
              Entrar
            </button>
          )}

          <button
            type="button"
            onClick={() => (session ? navigateTo('profile') : setShowAuthModal(true))}
            aria-label="Perfil da Paciente"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#852A91',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {session ? (
              getInitials(session.patientName)
            ) : (
              <User size={18} color="#852A91" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Área Central de Conteúdo */}
      <main style={{ flex: 1, paddingBottom: '90px', overflowY: 'auto' }}>
        {/* VIEW: HOME */}
        {currentView === 'home' && (
          <div style={{ padding: '1.25rem' }}>
            {/* Saudação */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.25rem' }}>
                Olá, {firstName}! 👋
              </h1>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                Bem-vinda à sua área de saúde e agendamento digital.
              </p>
            </div>

            {/* Próximo Compromisso ou Empty State */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                  Seu próximo compromisso
                </h2>
                {nextAppointment && (
                  <button
                    type="button"
                    onClick={() => navigateTo('appointments')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#852A91',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ver todas
                  </button>
                )}
              </div>

              {nextAppointment ? (
                <div
                  onClick={() => navigateTo('details', { appointmentId: nextAppointment.id })}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid #E2E8F0',
                    borderLeft: '5px solid #852A91',
                    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          background: '#F7ECF8',
                          color: '#852A91',
                          padding: '0.5rem',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>
                          {formatDateTime(nextAppointment.startsAt).date}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#852A91' }}>
                          às {formatDateTime(nextAppointment.startsAt).time}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {nextAppointment.status}
                    </span>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '0.75rem 0' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#64748B',
                      }}
                    >
                      {getInitials(nextAppointment.professionalName)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#1E293B' }}>
                        {nextAppointment.professionalName}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                        {nextAppointment.specialtyName || 'Ginecologia Clínica'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '16px',
                    border: '1px dashed #CBD5E1',
                    padding: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: '#F1F5F9',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                    }}
                  >
                    <Calendar size={22} />
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                    Nenhuma consulta agendada
                  </p>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#94A3B8' }}>
                    Mantenha seus exames e consultas preventivas em dia.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('schedule', { resetSchedule: true })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#852A91',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.55rem 1.1rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0, 128, 128, 0.2)',
                    }}
                  >
                    <CalendarPlus size={16} />
                    <span>Agendar Agora</span>
                  </button>
                </div>
              )}
            </div>

            {/* Ações Rápidas */}
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.85rem' }}>
                Ações rápidas
              </h2>
              <div className="patient-quick-actions-grid">
                {/* 1. Nova Consulta / Agendar (Sempre disponível) */}
                <button
                  type="button"
                  onClick={() => navigateTo('schedule', { resetSchedule: true })}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#F7ECF8',
                      color: '#852A91',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarPlus size={20} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Nova Consulta</span>
                </button>

                {/* 2. Histórico de Consultas (Apenas autenticado) */}
                {session && (
                  <button
                    type="button"
                    onClick={() => navigateTo('appointments')}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: '#F7ECF8',
                        color: '#852A91',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarCheck size={20} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Histórico</span>
                  </button>
                )}

                {/* 3. Meus Dados (Apenas autenticado) */}
                {session && (
                  <button
                    type="button"
                    onClick={() => navigateTo('profile')}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: '#F7ECF8',
                        color: '#852A91',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <User size={20} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Meus Dados</span>
                  </button>
                )}

                {/* 4. Falar com Clínica (WhatsApp) */}
                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone size={20} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Falar com Clínica</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SCHEDULE (FLUXO EM 4 ETAPAS) */}
        {currentView === 'schedule' && (
          <div style={{ padding: '1.25rem' }}>
            {/* Stepper Progressivo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '100%',
                  height: '2px',
                  background: '#E2E8F0',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: `${((scheduleStep - 1) / 3) * 100}%`,
                  height: '2px',
                  background: '#852A91',
                  transform: 'translateY(-50%)',
                  zIndex: 0,
                  transition: 'width 0.25s ease',
                }}
              />

              {[
                { step: 1, label: 'Especialista', short: 'Profissional' },
                { step: 2, label: 'Data', short: 'Data' },
                { step: 3, label: 'Horário', short: 'Hora' },
                { step: 4, label: 'Confirmação', short: 'Confirmar' },
              ].map((s) => {
                const isActive = scheduleStep === s.step;
                const isDone = scheduleStep > s.step;
                return (
                  <div
                    key={s.step}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      zIndex: 1,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: isDone || isActive ? '2px solid #852A91' : '2px solid #CBD5E1',
                        background: isDone || isActive ? '#852A91' : '#FFFFFF',
                        color: isDone || isActive ? '#FFFFFF' : '#94A3B8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? <Check size={14} /> : s.step}
                    </div>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#852A91' : '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        padding: '0 2px',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Passo 1: Seleção de Atendimento GO e Profissional */}
            {scheduleStep === 1 && (
              <div>
                {/* 1.1 Cards de Atendimento GO */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                    Tipo de Atendimento GO
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1rem' }}>
                    Selecione o serviço ginecológico ou obstétrico desejado:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                    {CARE_TYPES.map((care) => {
                      const isSelected = selectedCareType?.id === care.id;
                      return (
                        <button
                          key={care.id}
                          type="button"
                          onClick={() => {
                            setSelectedCareType(care);
                            if (care.requiresPreExamPreparation) {
                              setIsPreExamModalOpen(true);
                              setPreExamAcknowledged(false);
                            } else {
                              setPreExamAcknowledged(true);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: isSelected ? '#F7ECF8' : '#FFFFFF',
                            border: isSelected ? '2px solid #852A91' : '1px solid #E2E8F0',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }} role="img" aria-label={care.title}>
                              {care.icon}
                            </span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#1E293B' }}>
                                {care.title}
                              </p>
                              <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '0.78rem', color: '#64748B', lineHeight: 1.3 }}>
                                {care.subtitle}
                              </p>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  color: '#6F217B',
                                  background: '#F1F5F9',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                }}
                              >
                                {care.duration}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: isSelected ? '2px solid #852A91' : '2px solid #CBD5E1',
                              background: isSelected ? '#852A91' : 'transparent',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && <Check size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedCareType?.requiresPreExamPreparation && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: preExamAcknowledged ? '#F0FDF9' : '#FEF3C7',
                        border: `1px solid ${preExamAcknowledged ? '#B77AD8' : '#F59E0B'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ color: preExamAcknowledged ? '#6F217B' : '#92400E', fontWeight: 600 }}>
                        {preExamAcknowledged
                          ? '✓ Orientações de preparo pré-exame confirmadas'
                          : '⚠️ Confirmação obrigatória de preparo pendente'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPreExamModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#852A91',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontSize: '0.8rem',
                        }}
                      >
                        {preExamAcknowledged ? 'Rever' : 'Abrir orientações'}
                      </button>
                    </div>
                  )}
                </div>

                {/* 1.2 Profissional */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                  {isRescheduling ? 'Reagendar: Novo Profissional?' : 'Com quem deseja passar?'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1rem' }}>
                  Selecione o profissional de sua preferência para o atendimento:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {doctorList.map((doc) => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setSelectedDoctor(doc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem',
                          background: isSelected ? '#F7ECF8' : '#FFFFFF',
                          border: isSelected ? '2px solid #852A91' : '1px solid #E2E8F0',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              background: isSelected ? '#852A91' : '#F1F5F9',
                              color: isSelected ? '#FFFFFF' : '#64748B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                            }}
                          >
                            {getInitials(doc.name)}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>{doc.name}</p>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>{doc.specialtyName}</p>
                          </div>
                        </div>

                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #852A91' : '2px solid #CBD5E1',
                            background: isSelected ? '#852A91' : 'transparent',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Passo 2: Seleção de Data no Calendário */}
            {scheduleStep === 2 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                  Escolha a data
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1.25rem' }}>
                  Atendimento com <strong>{selectedDoctor?.name}</strong> ({selectedDoctor?.specialtyName})
                </p>

                {renderCalendar()}
              </div>
            )}

            {/* Passo 3: Grade de Horários */}
            {scheduleStep === 3 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                  Horários disponíveis
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1.25rem' }}>
                  Dia {formatDateTime(selectedCalendarDate).date} com <strong>{selectedDoctor?.name}</strong>
                </p>

                {loadingSlots ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B', fontSize: '0.9rem' }}>
                    Consultando disponibilidade da agenda...
                  </div>
                ) : displayedSlots.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                    {displayedSlots.map((slot) => {
                      const timeStr = formatDateTime(slot.startsAt).time;
                      const isSelected = selectedSlot?.startsAt === slot.startsAt;
                      return (
                        <button
                          key={slot.startsAt}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '0.85rem 0.5rem',
                            border: isSelected ? '2px solid #852A91' : '1px solid #E2E8F0',
                            borderRadius: '12px',
                            background: isSelected ? '#852A91' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#1E293B',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      textAlign: 'center',
                      color: '#92400E',
                    }}
                  >
                    Nenhum horário livre nesta data. Por favor, selecione outro dia no calendário.
                  </div>
                )}
              </div>
            )}

            {/* Passo 4: Revisão e Confirmação */}
            {scheduleStep === 4 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', marginBottom: '0.35rem' }}>
                  Confirme os dados
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 1.25rem' }}>
                  Revise as informações antes de finalizar seu agendamento:
                </p>

                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div
                      style={{
                        background: '#F7ECF8',
                        color: '#852A91',
                        padding: '0.75rem',
                        borderRadius: '12px',
                      }}
                    >
                      <CalendarCheck size={26} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>
                        {formatDateTime(selectedSlot?.startsAt).date} às {formatDateTime(selectedSlot?.startsAt).time}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#852A91', fontWeight: 600 }}>
                        {selectedDoctor?.specialtyName}
                      </p>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: '1rem 0' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Profissional</span>
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>{selectedDoctor?.name}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label htmlFor="patient-name-input" style={{ color: '#64748B', fontWeight: 500 }}>
                          Nome da Paciente:
                        </label>
                      </div>
                      <input
                        id="patient-name-input"
                        type="text"
                        placeholder="Informe seu nome completo"
                        value={customPatientName || (session?.patientName ?? '')}
                        onChange={(e) => setCustomPatientName(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: '#1E293B',
                          outline: 'none',
                          background: '#FFFFFF',
                        }}
                      />
                    </div>
                    {/* Seleção do Tipo de Atendimento / Entrada */}
                    {meta?.appointmentTypes && meta.appointmentTypes.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label htmlFor="portal-appt-type" style={{ color: '#64748B', fontWeight: 500 }}>
                          Tipo de Atendimento / Entrada:
                        </label>
                        <select
                          id="portal-appt-type"
                          value={selectedAppointmentTypeId || meta.appointmentTypes[0]?.id}
                          onChange={(e) => setSelectedAppointmentTypeId(e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#1E293B',
                            background: '#FFFFFF',
                          }}
                        >
                          {meta.appointmentTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.durationMinutes} min)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Local</span>
                      <span style={{ fontWeight: 600, color: '#1E293B', textAlign: 'right' }}>
                        {meta?.clinicName || 'Clínica CANA MED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seção Opcional de Preferências de Atendimento e Acessibilidade (QF-06) */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    marginBottom: '1rem',
                  }}
                >
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 700, color: '#1E293B' }}>
                    Necessidades de Acessibilidade e Atendimento (Opcional)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 0.85rem', lineHeight: 1.4 }}>
                    Caso deseje, informe se possui alguma necessidade para que nossa equipe acolha seu atendimento com o devido cuidado.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                    {[
                      { id: 'idosa', label: 'Pessoa idosa (60+)' },
                      { id: 'pcd', label: 'Pessoa com deficiência (PcD)' },
                      { id: 'autista', label: 'Pessoa autista (TEA)' },
                      { id: 'nenhuma', label: 'Nenhuma das opções' },
                      { id: 'nao_informar', label: 'Prefiro não informar' },
                    ].map((opt) => {
                      const isChecked = accessibilityNeeds.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.84rem',
                            color: '#334155',
                            cursor: 'pointer',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            background: isChecked ? '#F5F3FF' : 'transparent',
                            border: isChecked ? '1px solid #C4B5FD' : '1px solid transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (opt.id === 'nenhuma' || opt.id === 'nao_informar') {
                                setAccessibilityNeeds(e.target.checked ? [opt.id] : []);
                              } else {
                                setAccessibilityNeeds((prev) => {
                                  const filtered = prev.filter((k) => k !== 'nenhuma' && k !== 'nao_informar');
                                  return e.target.checked ? [...filtered, opt.id] : filtered.filter((k) => k !== opt.id);
                                });
                              }
                            }}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Pré-Anamnese e Motivo do Atendimento */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    marginBottom: '1rem',
                  }}
                >
                  <h3 style={{ margin: '0 0 0.35rem', fontSize: '0.98rem', fontWeight: 700, color: '#1E293B' }}>
                    Motivo do Atendimento ou Sintomas (Opcional)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 0.85rem', lineHeight: 1.4 }}>
                    Se desejar, informe sintomas ou observações que auxiliem na condução da consulta ginecológica:
                  </p>
                  <textarea
                    placeholder="Ex: Rotina anual, dores no baixo ventre, atraso menstrual..."
                    value={clinicalPreAnamnesis}
                    onChange={(e) => setClinicalPreAnamnesis(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      color: '#1E293B',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Aviso da Política de 24h e 15 minutos */}
                <div
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    borderRadius: '12px',
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    gap: '0.65rem',
                    color: '#1E40AF',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                  }}
                >
                  <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    Chegue com <strong>15 minutos de antecedência</strong>. Em caso de imprevisto, você pode cancelar ou remarcar com até <strong>24h de antecedência</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* Barra de Ações Inferior do Stepper */}
            <div className="patient-stepper-bottom-bar">
              {scheduleStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setScheduleStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1))}
                  style={{
                    width: '35%',
                    padding: '0.75rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Voltar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  style={{
                    width: '35%',
                    padding: '0.75rem',
                    border: '1px solid #CBD5E1',
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              )}

              {scheduleStep < 4 ? (
                <button
                  type="button"
                  disabled={
                    (scheduleStep === 1 && !selectedDoctor) ||
                    (scheduleStep === 2 && !selectedCalendarDate) ||
                    (scheduleStep === 3 && !selectedSlot)
                  }
                  onClick={() => setScheduleStep((prev) => (prev < 4 ? ((prev + 1) as 2 | 3 | 4) : 4))}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '12px',
                    background:
                      (scheduleStep === 1 && !selectedDoctor) ||
                      (scheduleStep === 2 && !selectedCalendarDate) ||
                      (scheduleStep === 3 && !selectedSlot)
                        ? '#CBD5E1'
                        : '#852A91',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor:
                      (scheduleStep === 1 && !selectedDoctor) ||
                      (scheduleStep === 2 && !selectedCalendarDate) ||
                      (scheduleStep === 3 && !selectedSlot)
                        ? 'not-allowed'
                        : 'pointer',
                    boxShadow: '0 4px 10px rgba(133, 42, 145, 0.2)',
                  }}
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={bookingLoading}
                  onClick={handleConfirmSchedule}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '12px',
                    background: '#852A91',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: bookingLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(133, 42, 145, 0.25)',
                  }}
                >
                  <Check size={18} />
                  <span>{bookingLoading ? 'Agendando...' : 'Confirmar Agendamento'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW: APPOINTMENTS (LISTA PRÓXIMAS & HISTÓRICO) */}
        {currentView === 'appointments' && (
          <div style={{ padding: '1.25rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '1.25rem' }}>
              Minhas Consultas
            </h1>

            {/* Abas Lógicas: Próximas */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h2
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                  marginBottom: '0.65rem',
                }}
              >
                Próximas
              </h2>

              {appointments.filter((a) => a.status === 'agendado' || a.status === 'Agendado' || a.status === 'confirmado').length > 0 ? (
                appointments
                  .filter((a) => a.status === 'agendado' || a.status === 'Agendado' || a.status === 'confirmado')
                  .map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => navigateTo('details', { appointmentId: appt.id })}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        padding: '1rem',
                        border: '1px solid #E2E8F0',
                        borderLeft: '4px solid #852A91',
                        marginBottom: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1E293B', fontWeight: 600, fontSize: '0.85rem' }}>
                          <Calendar size={15} color="#64748B" />
                          <span>
                            {formatDateTime(appt.startsAt).date} às {formatDateTime(appt.startsAt).time}
                          </span>
                        </div>
                        <span
                          style={{
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            borderRadius: '20px',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F1F5F9',
                            color: '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(appt.professionalName)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>{appt.professionalName}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{appt.specialtyName || 'Ginecologia'}</p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#64748B',
                    fontSize: '0.85rem',
                    border: '1px solid #F1F5F9',
                  }}
                >
                  Nenhuma consulta agendada no momento.
                </div>
              )}
            </div>

            {/* Abas Lógicas: Histórico */}
            <div>
              <h2
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94A3B8',
                  marginBottom: '0.65rem',
                }}
              >
                Histórico
              </h2>

              {appointments.filter((a) => a.status === 'cancelado' || a.status === 'realizado').length > 0 ? (
                appointments
                  .filter((a) => a.status === 'cancelado' || a.status === 'realizado')
                  .map((appt) => (
                    <div
                      key={appt.id}
                      onClick={() => navigateTo('details', { appointmentId: appt.id })}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '14px',
                        padding: '1rem',
                        border: '1px solid #E2E8F0',
                        marginBottom: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.85rem' }}>
                          <Calendar size={15} color="#94A3B8" />
                          <span>
                            {formatDateTime(appt.startsAt).date} às {formatDateTime(appt.startsAt).time}
                          </span>
                        </div>
                        <span
                          style={{
                            background: appt.status === 'cancelado' ? '#FEF2F2' : '#F1F5F9',
                            color: appt.status === 'cancelado' ? '#DC2626' : '#64748B',
                            border: appt.status === 'cancelado' ? '1px solid #FECACA' : '1px solid #E2E8F0',
                            borderRadius: '20px',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {appt.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#F8FAFC',
                            color: '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(appt.professionalName)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#475569' }}>{appt.professionalName}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>{appt.specialtyName || 'Ginecologia'}</p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                  Nenhum histórico anterior registrado.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: DETAILS (DETALHE DA CONSULTA SELECIONADA) */}
        {currentView === 'details' && (
          <div style={{ padding: '1.25rem' }}>
            {(() => {
              const selectedAppt = appointments.find((a) => a.id === selectedAppointmentId);
              if (!selectedAppt) {
                return (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                    <p>Consulta não encontrada.</p>
                    <button
                      type="button"
                      onClick={() => navigateTo('appointments')}
                      style={{
                        background: '#852A91',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                      }}
                    >
                      Voltar para consultas
                    </button>
                  </div>
                );
              }

              const isUpcoming = selectedAppt.status === 'agendado' || selectedAppt.status === 'Agendado' || selectedAppt.status === 'confirmado';

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                      Detalhes da Consulta
                    </h1>
                    <span
                      style={{
                        background: isUpcoming ? '#ECFDF5' : selectedAppt.status === 'cancelado' ? '#FEF2F2' : '#F1F5F9',
                        color: isUpcoming ? '#059669' : selectedAppt.status === 'cancelado' ? '#DC2626' : '#64748B',
                        border: isUpcoming ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        borderRadius: '20px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {selectedAppt.status}
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      <div
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          background: '#F7ECF8',
                          color: '#852A91',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '1.1rem',
                        }}
                      >
                        {getInitials(selectedAppt.professionalName)}
                      </div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1E293B' }}>
                          {selectedAppt.professionalName}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                          {selectedAppt.specialtyName || 'Ginecologia Clínica'}
                        </p>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <Calendar size={18} color="#94A3B8" style={{ marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>
                            Data e Horário
                          </p>
                          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#1E293B' }}>
                            {formatDateTime(selectedAppt.startsAt).date} às {formatDateTime(selectedAppt.startsAt).time}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <MapPin size={18} color="#94A3B8" style={{ marginTop: '2px' }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>
                            Local de Atendimento
                          </p>
                          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#1E293B' }}>
                            {meta?.clinicName || 'Clínica Matriz CANA MED'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações: Reagendar ou Cancelar */}
                  {isUpcoming && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => handleInitiateReschedule(selectedAppt)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.85rem',
                          background: '#F7ECF8',
                          border: '1px solid #E9D5FF',
                          borderRadius: '12px',
                          color: '#852A91',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CalendarPlus size={18} />
                        <span>Reagendar Consulta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '0.85rem',
                          background: '#FFFFFF',
                          border: '1px solid #FCA5A5',
                          borderRadius: '12px',
                          color: '#DC2626',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={18} />
                        <span>Cancelar Consulta</span>
                      </button>

                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.85rem',
                          background: '#F8FAFC',
                          borderRadius: '12px',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.78rem',
                          color: '#64748B',
                          lineHeight: 1.5,
                        }}
                      >
                        Cancelamentos ou reagendamentos devem ser efetuados com no mínimo <strong>24h de antecedência</strong> para liberação responsável do horário.
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW: PROFILE (MEUS DADOS) */}
        {currentView === 'profile' && (
          <div style={{ padding: '1.25rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '1.25rem' }}>
              Meus Dados
            </h1>

            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#852A91',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.65rem',
                    boxShadow: '0 4px 12px rgba(133, 42, 145, 0.2)',
                  }}
                >
                  {getInitials(session?.patientName)}
                </div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>
                  {session?.patientName || 'Paciente'}
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  Cadastrada na CANA MED Mulher
                </p>
              </div>

              <form onSubmit={handleSaveProfile} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.3rem' }}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={session?.patientName || 'Mariana Fontes'}
                    readOnly
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.88rem',
                      color: '#475569',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.3rem' }}>
                    CPF (Protegido por LGPD)
                  </label>
                  <input
                    type="text"
                    value="***.***.***-**"
                    readOnly
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.88rem',
                      color: '#475569',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.3rem' }}>
                    Telefone para Lembretes
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.88rem',
                      color: '#1E293B',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.3rem' }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.88rem',
                      color: '#1E293B',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: profileSavedFeedback ? '#059669' : '#1E293B',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: profileSaving ? 'wait' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {profileSavedFeedback ? 'Salvo com sucesso!' : profileSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            </div>

            {session && (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.85rem',
                  borderRadius: '12px',
                  border: '1px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <LogOut size={18} />
                <span>Sair do Aplicativo</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* 3. Navegação Inferior (Bottom Navigation) Fixa */}
      <nav className="patient-portal-bottom-nav">
        {(session
          ? [
              { id: 'home', icon: Calendar, label: 'Início' },
              { id: 'schedule', icon: CalendarPlus, label: 'Agendar' },
              { id: 'appointments', icon: CalendarCheck, label: 'Consultas' },
              { id: 'profile', icon: User, label: 'Perfil' },
            ]
          : [
              { id: 'schedule', icon: CalendarPlus, label: 'Agendar' },
            ]
        ).map((tab) => {
          const isActive = currentView === tab.id || (tab.id === 'schedule' && currentView === 'schedule');
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'schedule') {
                  navigateTo('schedule', { resetSchedule: true });
                } else {
                  navigateTo(tab.id as PatientPortalTab);
                }
              }}
              style={{
                border: 'none',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem',
                flex: 1,
                minWidth: 0,
                color: isActive ? '#852A91' : '#94A3B8',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
                padding: '0.2rem 0',
              }}
            >
              <IconComponent size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. Modal de Sucesso do Agendamento */}
      {showSuccessModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Check size={32} strokeWidth={2.8} />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem' }}>
              Consulta Agendada!
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              Seu horário com <strong>{selectedDoctor?.name}</strong> está confirmado para{' '}
              <strong>
                {formatDateTime(selectedSlot?.startsAt).date} às {formatDateTime(selectedSlot?.startsAt).time}
              </strong>.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                if (createdAppointment) {
                  navigateTo('details', { appointmentId: createdAppointment.id });
                } else {
                  navigateTo('appointments');
                }
              }}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: '#852A91',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Ver detalhes da consulta
            </button>
          </div>
        </div>
      )}

      {/* 5. Modal de Confirmação de Cancelamento */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#DC2626', marginBottom: '0.75rem' }}>
              <AlertCircle size={24} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                Cancelar consulta?
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Tem certeza que deseja cancelar esta consulta? O horário será liberado na agenda da clínica.
            </p>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: isCancelling ? 'wait' : 'pointer',
                }}
              >
                {isCancelling ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Contato com a Clínica (WhatsApp) */}
      {showContactModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
              }}
            >
              <Phone size={28} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '0 0 0.5rem' }}>
              Fale Conosco
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              Nosso atendimento via WhatsApp funciona de segunda a sexta-feira, das 08h às 18h.
            </p>

            <a
              href={`https://wa.me/55${(meta?.helpPhone || '81987654321').replace(/\D/g, '')}?text=Ol%C3%A1%2C%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20atendimento%20na%20Cana%20Med%20Mulher.`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowContactModal(false)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                background: '#25D366',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                textDecoration: 'none',
                marginBottom: '0.75rem',
              }}
            >
              Abrir WhatsApp
            </a>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* 7. Modal de Autenticação Rápida por OTP */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
        >
          <div
            className="patient-modal-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '380px',
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CanamedLogoCurta style={{ height: '26px', width: 'auto' }} />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  Acesso Seguro da Paciente
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 1rem' }}>
              {otpSent
                ? 'Digite o código de 6 dígitos enviado por SMS para o seu celular.'
                : 'Identifique-se para visualizar seus agendamentos ou confirmar novas consultas.'}
            </p>

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.25rem' }}>
                    Telefone Celular
                  </label>
                  <input
                    type="tel"
                    placeholder="(81) 98765-4321"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.25rem' }}>
                    CPF da Paciente
                  </label>
                  <input
                    type="text"
                    placeholder="123.456.789-00"
                    value={authCpf}
                    onChange={(e) => setAuthCpf(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.88rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#852A91',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: authLoading ? 'wait' : 'pointer',
                  }}
                >
                  {authLoading ? 'Enviando código...' : 'Receber Código por SMS'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ width: '100%', boxSizing: 'border-box' }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.25rem' }}>
                    Código de 6 dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '1.2rem',
                      textAlign: 'center',
                      letterSpacing: '0.25em',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    padding: '0.8rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#852A91',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: authLoading ? 'wait' : 'pointer',
                  }}
                >
                  {authLoading ? 'Validando...' : 'Confirmar e Acessar'}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  style={{ border: 'none', background: 'transparent', color: '#852A91', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Alterar telefone ou reenviar
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Modal de Instruções de Preparo Pré-Exame (RN-014) */}
      <PreExamInstructionsModal
        isOpen={isPreExamModalOpen}
        careTypeId={selectedCareType?.id || ''}
        careTitle={selectedCareType?.title || ''}
        onConfirm={() => {
          setPreExamAcknowledged(true);
          setIsPreExamModalOpen(false);
          addToast('Preparo pré-exame confirmado com sucesso!', 'success');
        }}
        onClose={() => {
          setIsPreExamModalOpen(false);
        }}
      />
    </div>
  );
}

