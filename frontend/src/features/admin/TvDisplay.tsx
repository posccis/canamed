import { useState, useEffect, useRef, useCallback } from 'react';
import { type TvDisplayStateDto, type QueueCallEventDto, getTvDisplayState } from './adminApi';
import { useSession } from '../auth/useSession';

export function TvDisplay() {
  const { state: authState } = useSession();
  const clinicId = authState.status === 'authenticated' ? authState.session.clinicId : '';
  const clinicName = authState.status === 'authenticated' ? authState.session.clinicName : 'Cana Med';

  const [tvState, setTvState] = useState<TvDisplayStateDto | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [clock, setClock] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  const lastCallIdRef = useRef<string | null>(null);
  const lastCallCountRef = useRef<number>(0);

  // Relógio do painel
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sintetizador de áudio (Chime agradável com Web Audio API)
  const playChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Frequências harmoniosas (Re5 e La5 - 587.33Hz e 880Hz)
      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(587.33, now);
      osc2.frequency.setValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.2);
    } catch {
      // AudioContext bloqueado ou indisponível
    }
  }, []);

  // Leitura por voz (Web Speech API pt-BR)
  const speakCall = useCallback((call: QueueCallEventDto) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const text = `Senha ${call.ticketCode.split('').join(' ')}. ${call.patientName}. Dirigir-se ao ${call.roomName}.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignora falhas de síntese de voz
    }
  }, []);

  const handleNewCall = useCallback((call: QueueCallEventDto) => {
    if (audioEnabled) {
      playChime();
      setTimeout(() => {
        speakCall(call);
      }, 600);
    }
  }, [audioEnabled, playChime, speakCall]);

  // Polling de chamadas de TV a cada 3 segundos
  useEffect(() => {
    if (!clinicId) return;

    let mounted = true;
    const fetchState = async () => {
      try {
        const state = await getTvDisplayState(clinicId);
        if (!mounted) return;
        setTvState(state);

        if (state.activeCall) {
          const isDifferentTicket = lastCallIdRef.current !== state.activeCall.id;
          const isRepeatCall = lastCallCountRef.current !== state.activeCall.callCount;

          if (isDifferentTicket || isRepeatCall) {
            lastCallIdRef.current = state.activeCall.id;
            lastCallCountRef.current = state.activeCall.callCount;
            handleNewCall(state.activeCall);
          }
        }
      } catch {
        // Polling tolerante a falhas
      }
    };

    void fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [clinicId, handleNewCall]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const activeCall = tvState?.activeCall;
  const recentCalls = tvState?.recentCalls ?? [];

  return (
    <div
      className="tv-display-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '85vh',
        backgroundColor: '#0a101d',
        color: '#f8fafc',
        borderRadius: fullscreen ? '0' : '12px',
        padding: '1.5rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Topo do Painel de TV */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src="/assets/brand/canamed_logo-removebg-preview.png"
            alt="Cana Med"
            style={{ height: '48px', objectFit: 'contain' }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.05em', color: '#38bdf8' }}>
              {clinicName.toUpperCase()}
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>PAINEL DE ATENDIMENTO E CHAMADA</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {!audioEnabled ? (
            <button
              type="button"
              className="button"
              style={{
                backgroundColor: '#f59e0b',
                color: '#000',
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onClick={() => {
                setAudioEnabled(true);
                playChime();
              }}
            >
              🔔 Ativar Áudio da TV
            </button>
          ) : (
            <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🔊 Áudio Ativo
            </span>
          )}

          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', color: '#f1f5f9' }}>
            {clock}
          </div>

          <button
            type="button"
            className="button button--secondary"
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '0.4rem 0.75rem' }}
            onClick={toggleFullscreen}
            title="Alternar Tela Cheia"
          >
            {fullscreen ? 'Restaurar ⛶' : 'Tela Cheia ⛶'}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal do Painel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', flex: 1, marginTop: '2rem' }}>
        {/* Chamada Ativa em Destaque */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '2px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}>
          {activeCall ? (
            <>
              {activeCall.isPreferential && (
                <div style={{
                  position: 'absolute',
                  top: '1.5rem',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  padding: '0.4rem 1.25rem',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                }}>
                  ★ ATENDIMENTO PREFERENCIAL
                </div>
              )}

              <div style={{ fontSize: '1.4rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: activeCall.isPreferential ? '2rem' : '0' }}>
                SENHA / TICKET
              </div>

              <div style={{
                fontSize: '6rem',
                fontWeight: 900,
                color: '#38bdf8',
                letterSpacing: '0.05em',
                lineHeight: 1.1,
                margin: '0.5rem 0 1.5rem 0',
                textShadow: '0 0 30px rgba(56, 189, 248, 0.4)',
              }}>
                {activeCall.ticketCode}
              </div>

              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1.5rem' }}>
                {activeCall.patientName}
              </div>

              <div style={{
                backgroundColor: '#1e293b',
                padding: '1.25rem 2.5rem',
                borderRadius: '12px',
                border: '1px solid #334155',
                width: '100%',
                maxWidth: '550px',
              }}>
                <div style={{ fontSize: '1.1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DIRIJA-SE AO
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#4ade80', margin: '0.25rem 0' }}>
                  {activeCall.roomName}
                </div>
                <div style={{ fontSize: '1.2rem', color: '#cbd5e1' }}>
                  Com {activeCall.professionalName}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📺</div>
              <h2 style={{ fontSize: '1.8rem', color: '#94a3b8' }}>Aguardando próxima chamada</h2>
              <p style={{ fontSize: '1.1rem' }}>Os pacientes chamados pela recepção ou consultório aparecerão aqui.</p>
            </div>
          )}
        </div>

        {/* Chamadas Anteriores / Histórico Lateral */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid #1e293b',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{
            margin: '0 0 1.25rem 0',
            fontSize: '1.2rem',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #1e293b',
            paddingBottom: '0.75rem',
          }}>
            Últimas Chamadas
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {recentCalls.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '0.95rem', fontStyle: 'italic' }}>
                Nenhuma chamada anterior hoje.
              </p>
            ) : (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                        {call.ticketCode}
                      </span>
                      {call.isPreferential && (
                        <span style={{ fontSize: '0.7rem', backgroundColor: '#ef4444', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          PREF
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 600 }}>
                      {call.patientName}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80' }}>
                      {call.roomName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {new Date(call.calledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé informativo */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #1e293b',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#64748b',
          }}>
            Atendimento prioritário assegurado pela Lei Federal nº 10.048/2000.
          </div>
        </div>
      </div>
    </div>
  );
}
