import { useState, useEffect } from 'react';
import {
  patientApi,
  type KioskSearchResult,
  type KioskCheckInResult,
  type KioskTicketStatus,
} from './patientApi';
import { useToast } from '../layout/Toast';

export function KioskMode() {
  const { addToast } = useToast();
  const [clinicId, setClinicId] = useState<string>('');

  // Mode: checkin or ticket_tracker
  const [mode, setMode] = useState<'checkin' | 'tracker'>('checkin');

  // Checkin states
  const [keypadInput, setKeypadInput] = useState('');
  const [searchResults, setSearchResults] = useState<KioskSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedApt, setSelectedApt] = useState<KioskSearchResult | null>(null);
  const [isPreferential, setIsPreferential] = useState(false);
  const [ticketResult, setTicketResult] = useState<KioskCheckInResult | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  // Tracker states
  const [trackerCode, setTrackerCode] = useState('');
  const [ticketStatus, setTicketStatus] = useState<KioskTicketStatus | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    patientApi.getPortalMeta()
      .then((m) => {
        if (m.clinicId) {
          setClinicId(m.clinicId);
        }
      })
      .catch(() => addToast('Erro ao carregar dados da clínica', 'error'));
  }, [addToast]);

  const handleKeypadPress = (val: string) => {
    if (val === 'clear') {
      setKeypadInput('');
      setSearchResults([]);
      setHasSearched(false);
      setSelectedApt(null);
    } else if (val === 'backspace') {
      setKeypadInput((prev) => prev.slice(0, -1));
    } else {
      if (keypadInput.length < 14) {
        setKeypadInput((prev) => prev + val);
      }
    }
  };

  const handleSearch = async () => {
    if (!keypadInput.trim() || !clinicId) {
      addToast('Digite seu CPF ou telefone para localizar seu agendamento.', 'info');
      return;
    }
    setSearching(true);
    setHasSearched(true);
    setSelectedApt(null);
    try {
      const results = await patientApi.kioskSearch(clinicId, keypadInput.trim());
      setSearchResults(results);
      if (results.length === 1 && results[0].allowedCheckIn) {
        setSelectedApt(results[0]);
      }
    } catch {
      setSearchResults([]);
      addToast('Erro ao buscar agendamento.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedApt || !clinicId) return;
    setCheckingIn(true);
    try {
      const res = await patientApi.kioskCheckIn(
        selectedApt.appointmentId,
        clinicId,
        isPreferential,
        'kiosk',
      );
      setTicketResult(res);
      addToast(`Check-in realizado! Senha ${res.ticketCode}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Não foi possível realizar o check-in.';
      addToast(msg, 'error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleTrackTicket = async () => {
    if (!trackerCode.trim() || !clinicId) {
      addToast('Digite o código da sua senha (ex.: N-001).', 'info');
      return;
    }
    setTracking(true);
    try {
      const status = await patientApi.kioskTicketStatus(clinicId, trackerCode.trim());
      setTicketStatus(status);
    } catch {
      setTicketStatus(null);
      addToast('Senha não localizada ou já finalizada hoje.', 'error');
    } finally {
      setTracking(false);
    }
  };

  const resetAll = () => {
    setKeypadInput('');
    setSearchResults([]);
    setHasSearched(false);
    setSelectedApt(null);
    setIsPreferential(false);
    setTicketResult(null);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          color: '#fff',
          padding: '24px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Autoatendimento CANAMED</h1>
        <p style={{ opacity: 0.9, marginTop: '6px', fontSize: '1rem' }}>
          Totem de Recepção Inteligente — Faça seu check-in e retire sua senha com rapidez.
        </p>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => {
            setMode('checkin');
            resetAll();
          }}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: mode === 'checkin' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: mode === 'checkin' ? '#fff' : 'var(--color-text)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          Novo Check-in
        </button>
        <button
          onClick={() => setMode('tracker')}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: mode === 'tracker' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: mode === 'tracker' ? '#fff' : 'var(--color-text)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          Consultar Fila / Senha
        </button>
      </div>

      {/* Screen: Check-in */}
      {mode === 'checkin' && !ticketResult && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Digite seu CPF ou Telefone</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Identifique-se para confirmarmos sua presença na consulta de hoje.
            </p>
          </div>

          {/* Display input */}
          <div
            style={{
              maxWidth: '420px',
              margin: '0 auto 20px',
              padding: '14px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '2px solid var(--color-primary)',
              textAlign: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
              letterSpacing: '2px',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {keypadInput || <span style={{ color: '#cbd5e1' }}>Digite os números</span>}
          </div>

          {/* Touch Keypad */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              maxWidth: '360px',
              margin: '0 auto 24px',
            }}
          >
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeypadPress(digit)}
                style={{
                  padding: '16px',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  background: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
              >
                {digit}
              </button>
            ))}
            <button
              onClick={() => handleKeypadPress('clear')}
              style={{
                padding: '16px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '1px solid #fca5a5',
                background: '#fee2e2',
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              LIMPAR
            </button>
            <button
              onClick={() => handleKeypadPress('0')}
              style={{
                padding: '16px',
                fontSize: '1.5rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: '#fff',
                cursor: 'pointer',
              }}
            >
              0
            </button>
            <button
              onClick={() => handleKeypadPress('backspace')}
              style={{
                padding: '16px',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: '#f1f5f9',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <button
              onClick={handleSearch}
              disabled={searching || !keypadInput}
              style={{
                padding: '14px 48px',
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: '10px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                cursor: searching || !keypadInput ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {searching ? 'Buscando...' : 'Buscar Agendamento'}
            </button>
          </div>

          {/* Results section */}
          {hasSearched && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '16px' }}>
                  Nenhum agendamento encontrado para hoje com este CPF/telefone. Compareça à recepção para orientações.
                </div>
              ) : (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Consultas Localizadas</h3>
                  {searchResults.map((r) => {
                    const isSelected = selectedApt?.appointmentId === r.appointmentId;
                    const time = new Date(r.scheduledTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={r.appointmentId}
                        onClick={() => r.allowedCheckIn && setSelectedApt(r)}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          background: isSelected ? '#ecfdf5' : '#fff',
                          marginBottom: '12px',
                          cursor: r.allowedCheckIn ? 'pointer' : 'default',
                          opacity: r.allowedCheckIn ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{r.maskedName}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                              CPF: {r.maskedCpf} | Horário: <strong>{time}</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginTop: '4px' }}>
                              Profissional: {r.professionalName}
                            </div>
                          </div>
                          <div>
                            {r.allowedCheckIn ? (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                                CHECK-IN DISPONÍVEL
                              </span>
                            ) : (
                              <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem' }}>
                                NÃO PERMITIDO
                              </span>
                            )}
                          </div>
                        </div>

                        {!r.allowedCheckIn && r.disallowReason && (
                          <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '8px' }}>
                            {r.disallowReason}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {selectedApt && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)', marginTop: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}>
                        <input
                          type="checkbox"
                          checked={isPreferential}
                          onChange={(e) => setIsPreferential(e.target.checked)}
                          style={{ width: '20px', height: '20px' }}
                        />
                        Atendimento Prioritário (Lei nº 10.048/2000 — 60+ anos, gestantes, lactantes, PCD)
                      </label>

                      <button
                        onClick={handleConfirmCheckIn}
                        disabled={checkingIn}
                        style={{
                          width: '100%',
                          padding: '16px',
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          borderRadius: '10px',
                          background: 'var(--color-primary)',
                          color: '#fff',
                          border: 'none',
                          cursor: checkingIn ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {checkingIn ? 'Emitindo sua senha...' : 'Confirmar Presença e Emitir Senha'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Screen: Ticket Emitted */}
      {mode === 'checkin' && ticketResult && (
        <div style={{ background: 'var(--color-surface)', padding: '36px 24px', borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center', maxWidth: '520px', margin: '0 auto', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ color: '#166534', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Check-in Concluído com Sucesso!
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '2px dashed var(--color-primary)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Sua Senha de Atendimento:</div>
            <div style={{ fontSize: '3.6rem', fontWeight: 900, color: 'var(--color-primary-dark)', margin: '8px 0' }}>
              {ticketResult.ticketCode}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: ticketResult.priority === 'Preferential' ? '#b45309' : '#475569' }}>
              {ticketResult.priority === 'Preferential' ? 'ATENDIMENTO PRIORITÁRIO' : 'ATENDIMENTO NORMAL'}
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              Posição na Fila: <strong>{ticketResult.positionInQueue}º lugar</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Médico: {ticketResult.professionalName}
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            Por favor, dirija-se à sala de espera. Sua senha será chamada no painel luminoso sonoro da clínica.
          </p>

          <button
            onClick={resetAll}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 700,
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Finalizar / Novo Atendimento
          </button>
        </div>
      )}

      {/* Screen: Ticket Tracker */}
      {mode === 'tracker' && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', maxWidth: '520px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Consultar Posição da Senha</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Acompanhe quantas pessoas estão na sua frente em tempo real.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Ex.: N-001 ou P-002"
              value={trackerCode}
              onChange={(e) => setTrackerCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '1.1rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            />
            <button
              onClick={handleTrackTicket}
              disabled={tracking}
              style={{
                padding: '12px 20px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: tracking ? 'not-allowed' : 'pointer',
              }}
            >
              {tracking ? 'Buscando...' : 'Consultar'}
            </button>
          </div>

          {ticketStatus && (
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary-dark)' }}>
                {ticketStatus.ticketCode}
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.9rem', color: '#166534', fontWeight: 700 }}>
                Status: {ticketStatus.status.toUpperCase()}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {ticketStatus.aheadInQueueCount}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Pessoas na Frente</div>
                </div>
                <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>
                    ~{ticketStatus.estimatedWaitMinutes} min
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Espera Estimada</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
