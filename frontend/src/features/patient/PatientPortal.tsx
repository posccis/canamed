import { useState, useEffect, useCallback } from 'react';
import {
  patientApi,
  type PatientSession,
  type OnlineAppointment,
  type PublicSlot,
  type MedicalDocumentItem,
  type PortalMetaResponse,
  type PublicClinicMeta,
} from './patientApi';
import { useToast } from '../layout/Toast';

export type PatientPortalTab = 'schedule' | 'appointments' | 'documents';

type PatientPortalProps = {
  /** Aba inicial, definida pela rota atual (`/agendar`, `/consultas` ou `/documentos`). */
  initialTab?: PatientPortalTab;
  /** Notifica a troca de aba para que a URL acompanhe a funcionalidade visível. */
  onTabChange?: (tab: PatientPortalTab) => void;
  /** Clínica resolvida pelo slug do link público (superfície `/p/:slug`). */
  clinic?: PublicClinicMeta | null;
};

export function PatientPortal({ initialTab = 'schedule', onTabChange, clinic }: PatientPortalProps = {}) {
  const { addToast } = useToast();
  const storageKey = clinic?.slug ? `canamed_patient_session_${clinic.slug}` : 'canamed_patient_session';
  const [session, setSession] = useState<PatientSession | null>(() => {
    const scoped = clinic?.slug ? localStorage.getItem(`canamed_patient_session_${clinic.slug}`) : null;
    const legacy = localStorage.getItem('canamed_patient_session');
    const saved = scoped || legacy;
    return saved ? JSON.parse(saved) : null;
  });

  // Auth state
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<PatientPortalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const selectTab = (tab: PatientPortalTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Metadata
  const [meta, setMeta] = useState<PortalMetaResponse | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<PublicSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Appointments
  const [myAppointments, setMyAppointments] = useState<OnlineAppointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Documents
  const [myDocuments, setMyDocuments] = useState<MedicalDocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocumentItem | null>(null);

  // Metadados: usa a clínica do slug quando disponível; caso contrário, o fallback de clínica única.
  useEffect(() => {
    if (clinic) {
      const mapped: PortalMetaResponse = {
        clinicId: clinic.clinicId,
        clinicName: clinic.publicName,
        clinicSlug: clinic.slug,
        specialties: clinic.specialties,
        professionals: clinic.professionals,
        appointmentTypes: clinic.appointmentTypes,
      };
      setMeta(mapped);
      setSelectedSpecialty((current) => current || clinic.specialties[0]?.id || '');
      setSelectedAppointmentType((current) => current || clinic.appointmentTypes[0]?.id || '');
      return;
    }

    patientApi.getPortalMeta()
      .then((m) => {
        setMeta(m);
        if (m.specialties.length > 0) {
          setSelectedSpecialty(m.specialties[0].id);
        }
        setSelectedAppointmentType(m.appointmentTypes?.[0]?.id ?? '');
      })
      .catch(() => addToast('Erro ao carregar especialidades', 'error'));
  }, [addToast, clinic]);

  // Handle countdown
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Request OTP
  const handleRequestOtp = async () => {
    if (!phone || !cpf) {
      addToast('Informe o seu telefone e CPF para receber o código.', 'info');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await patientApi.requestOtp(phone, cpf);
      setOtpSent(true);
      setOtpCooldown(res.retryAfterSeconds || 60);
      addToast(res.message, 'success');
    } catch {
      addToast('Não foi possível enviar o código. Verifique os dados.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      addToast('Digite o código de 6 dígitos recebido por SMS/WhatsApp.', 'info');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await patientApi.verifyOtp(phone, cpf, otpCode, meta?.clinicId);
      if (res.success && res.sessionToken && res.patientId) {
        const s: PatientSession = {
          token: res.sessionToken,
          patientId: res.patientId,
          patientName: res.patientName || 'Paciente',
        };
        setSession(s);
        localStorage.setItem(storageKey, JSON.stringify(s));
        addToast(`Bem-vindo ao portal, ${s.patientName}!`, 'success');
      } else {
        addToast(res.errorMessage || 'Código inválido ou expirado.', 'error');
      }
    } catch {
      addToast('Erro na validação do código. Tente novamente.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem(storageKey);
    localStorage.removeItem('canamed_patient_session');
    setOtpSent(false);
    setOtpCode('');
  };

  // Fetch slots
  const fetchSlots = useCallback(async () => {
    if (!meta?.clinicId || !selectedSpecialty || !selectedDate) return;
    setLoadingSlots(true);
    try {
      const slots = await patientApi.getAvailableSlots(
        meta.clinicId,
        selectedSpecialty,
        selectedDate,
        selectedProfessional || undefined,
      );
      setAvailableSlots(slots);
      setSelectedSlot(null);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [meta, selectedSpecialty, selectedDate, selectedProfessional]);

  useEffect(() => {
    if (activeTab === 'schedule') {
      fetchSlots();
    }
  }, [activeTab, fetchSlots]);

  // Book appointment
  const handleBook = async () => {
    if (!session) {
      addToast('Faça login com seu celular para concluir o agendamento.', 'info');
      return;
    }
    if (!selectedSlot || !meta?.clinicId || !selectedSpecialty || !selectedAppointmentType) {
      addToast('Selecione um horário disponível.', 'info');
      return;
    }
    setBookingLoading(true);
    try {
      await patientApi.bookAppointment(session.token, {
        clinicId: meta.clinicId,
        professionalId: selectedSlot.professionalId,
        specialtyId: selectedSpecialty,
        appointmentTypeId: selectedAppointmentType,
        startsAt: selectedSlot.startsAt,
      });
      addToast('Consulta agendada com sucesso! Lembretes ativos configurados.', 'success');
      setSelectedSlot(null);
      fetchSlots();
      selectTab('appointments');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Não foi possível confirmar o agendamento.';
      addToast(errorMsg, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    if (!session) return;
    setLoadingAppointments(true);
    try {
      const list = await patientApi.getMyAppointments(session.token);
      setMyAppointments(list);
    } catch {
      addToast('Erro ao carregar consultas.', 'error');
    } finally {
      setLoadingAppointments(false);
    }
  }, [session, addToast]);

  useEffect(() => {
    if (activeTab === 'appointments' && session) {
      fetchAppointments();
    }
  }, [activeTab, session, fetchAppointments]);

  // Cancel appointment
  const handleConfirmCancel = async () => {
    if (!session || !cancellingAptId) return;
    try {
      await patientApi.cancelMyAppointment(session.token, cancellingAptId, cancelReason || 'Cancelado pelo paciente');
      addToast('Consulta cancelada com sucesso.', 'success');
      setCancelModalOpen(false);
      setCancellingAptId(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cancelar consulta.';
      addToast(msg, 'error');
    }
  };

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!session) return;
    setLoadingDocuments(true);
    try {
      const docs = await patientApi.getMyDocuments(session.token);
      setMyDocuments(docs);
    } catch {
      addToast('Erro ao carregar documentos clínicos.', 'error');
    } finally {
      setLoadingDocuments(false);
    }
  }, [session, addToast]);

  useEffect(() => {
    if (activeTab === 'documents' && session) {
      fetchDocuments();
    }
  }, [activeTab, session, fetchDocuments]);

  // Render Login Card if not authenticated
  if (!session) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Portal do Paciente CANAMED</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Acesse suas consultas, documentos e faça agendamentos sem senhas com segurança.
          </p>
        </div>

        {!otpSent ? (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Número de Celular (WhatsApp)</label>
              <input
                type="tel"
                placeholder="(81) 98765-4321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>CPF</label>
              <input
                type="text"
                placeholder="123.456.789-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}
              />
            </div>

            <button
              onClick={handleRequestOtp}
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: authLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {authLoading ? 'Enviando código...' : 'Receber Código de Acesso'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem', color: '#166534' }}>
              Código de verificação de 6 dígitos enviado para <strong>{phone}</strong>.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Código de 6 Dígitos</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '1.5rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={authLoading || otpCode.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: authLoading || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              {authLoading ? 'Verificando...' : 'Confirmar e Entrar'}
            </button>

            <button
              onClick={handleRequestOtp}
              disabled={otpCooldown > 0}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                color: otpCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-primary)',
                border: 'none',
                fontSize: '0.85rem',
                cursor: otpCooldown > 0 ? 'default' : 'pointer',
              }}
            >
              {otpCooldown > 0 ? `Reenviar código em ${otpCooldown}s` : 'Não recebi o código (Reenviar)'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Authenticated Portal View
  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Portal do Paciente</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Olá, <strong>{session.patientName}</strong>! Gerencie suas consultas e documentos com total privacidade.
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Sair da Conta
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => selectTab('schedule')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'schedule' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'schedule' ? '#fff' : 'var(--color-text)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Agendar Consulta
        </button>
        <button
          onClick={() => selectTab('appointments')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'appointments' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'appointments' ? '#fff' : 'var(--color-text)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Minhas Consultas
        </button>
        <button
          onClick={() => selectTab('documents')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'documents' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'documents' ? '#fff' : 'var(--color-text)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          Carteira Digital
        </button>
      </div>

      {/* Tab: Agendar Consulta */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>1. Escolha a Especialidade</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Especialidade Médica</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
              >
                {meta?.specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {meta?.appointmentTypes && meta.appointmentTypes.length > 0 ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Tipo de Atendimento</label>
                <select
                  value={selectedAppointmentType}
                  onChange={(e) => setSelectedAppointmentType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
                >
                  {meta.appointmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Profissional (Opcional)</label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
              >
                <option value="">Qualquer profissional disponível</option>
                {meta?.professionals
                  .filter((p) => !selectedSpecialty || p.specialtyId === selectedSpecialty)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Data da Consulta</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
              />
            </div>

            <button
              onClick={fetchSlots}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                border: '1px solid var(--color-primary)',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Atualizar Horários
            </button>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>2. Horários Disponíveis</h3>
            {loadingSlots ? (
              <p style={{ color: 'var(--color-text-muted)' }}>Carregando horários em tempo real...</p>
            ) : availableSlots.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Nenhum horário livre encontrado nesta data para a especialidade selecionada. Tente outro dia.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {availableSlots.map((slot) => {
                  const time = new Date(slot.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const isSelected = selectedSlot?.startsAt === slot.startsAt && selectedSlot?.professionalId === slot.professionalId;
                  return (
                    <button
                      key={`${slot.professionalId}-${slot.startsAt}`}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '12px 8px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? '#ecfdf5' : '#fff',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {time}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {slot.professionalName.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Horário Selecionado:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {new Date(selectedSlot.startsAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(selectedSlot.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} com{' '}
                    {selectedSlot.professionalName}
                  </div>
                </div>
                <button
                  onClick={handleBook}
                  disabled={bookingLoading}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bookingLoading ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Minhas Consultas */}
      {activeTab === 'appointments' && (
        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Histórico de Consultas</h3>
          {loadingAppointments ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Carregando suas consultas...</p>
          ) : myAppointments.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px' }}>
              Você ainda não possui consultas agendadas.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myAppointments.map((apt) => {
                const date = new Date(apt.startsAt);
                const isUpcoming = date > new Date() && apt.status !== 'cancelado';
                return (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#fff',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                        {apt.specialtyName} — {apt.professionalName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        Data: {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ marginTop: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background:
                              apt.status === 'confirmado'
                                ? '#dcfce7'
                                : apt.status === 'cancelado'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              apt.status === 'confirmado'
                                ? '#15803d'
                                : apt.status === 'cancelado'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {apt.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {isUpcoming && (
                      <button
                        onClick={() => {
                          setCancellingAptId(apt.id);
                          setCancelModalOpen(true);
                        }}
                        style={{
                          padding: '8px 14px',
                          background: 'transparent',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Desmarcar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Carteira Digital */}
      {activeTab === 'documents' && (
        <div style={{ background: 'var(--color-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Carteira Digital de Documentos Clínicos</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Acesse suas receitas digitais, atestados médicos e pedidos de exames com certificação digital e autenticidade validável.
          </p>

          {loadingDocuments ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Carregando seus documentos clínicos...</p>
          ) : myDocuments.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px' }}>
              Nenhum documento médico emitido até o momento.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {myDocuments.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: '#fff',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                      {doc.documentType}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      ASSINADO ICP
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                    Emitido em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px', wordBreak: 'break-all' }}>
                    Código Verificador: <strong>{doc.publicToken}</strong>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'var(--color-primary-light)',
                        color: 'var(--color-primary-dark)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Visualizar
                    </button>
                    <a
                      href={`/api/v1/medical-documents/public/validate-document/${doc.publicToken}/download`}
                      download
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '8px 12px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'inline-block',
                      }}
                    >
                      Baixar PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Visualização de Documento */}
      {selectedDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '540px', width: '90%' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>{selectedDoc.documentType}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Documento emitido e assinado digitalmente em conformidade com o CFM.
            </p>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', maxHeight: '250px', overflowY: 'auto' }}>
              <pre style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {JSON.stringify(JSON.parse(selectedDoc.contentPayload), null, 2)}
              </pre>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
              Validação pública disponível em: <br />
              <code>/public/validate-document/{selectedDoc.publicToken}</code>
            </div>

            <button
              onClick={() => setSelectedDoc(null)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--color-border)',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Desmarcar Consulta */}
      {cancelModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '440px', width: '90%' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Desmarcar Consulta</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Cancelamentos devem ser feitos com no mínimo 2 horas de antecedência.
            </p>

            <textarea
              placeholder="Motivo do cancelamento (opcional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCancelModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirmar Desmarcação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
