import { useState, useEffect, useCallback } from 'react';
import {
  patientApi,
  type PatientSession,
  type PatientDataExport,
  type PrivacyConsentItem,
  type PrivacyRequestResult,
} from './patientApi';
import { useToast } from '../layout/Toast';

export function PrivacyPortal() {
  const { addToast } = useToast();
  const [clinicId, setClinicId] = useState<string>('');
  const [session] = useState<PatientSession | null>(() => {
    const saved = localStorage.getItem('canamed_patient_session');
    return saved ? JSON.parse(saved) : null;
  });

  // State
  const [activeSection, setActiveSection] = useState<'export' | 'consents' | 'request' | 'track'>('export');
  const [exportData, setExportData] = useState<PatientDataExport | null>(null);
  const [loadingExport, setLoadingExport] = useState(false);

  // Consents
  const [consents, setConsents] = useState<PrivacyConsentItem[]>([]);
  const [loadingConsents, setLoadingConsents] = useState(false);

  // New Request
  const [requestType, setRequestType] = useState('data_access');
  const [requestDetails, setRequestDetails] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [createdProtocol, setCreatedProtocol] = useState<PrivacyRequestResult | null>(null);

  // Track Protocol
  const [searchProtocol, setSearchProtocol] = useState('');
  const [trackedRequest, setTrackedRequest] = useState<PrivacyRequestResult | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    patientApi.getPortalMeta()
      .then((m) => {
        if (m.clinicId) setClinicId(m.clinicId);
      })
      .catch(() => {});
  }, []);

  const fetchExport = useCallback(async () => {
    if (!session) return;
    setLoadingExport(true);
    try {
      const data = await patientApi.exportMyData(session.token);
      setExportData(data);
    } catch {
      addToast('Erro ao obter extrato de dados.', 'error');
    } finally {
      setLoadingExport(false);
    }
  }, [session, addToast]);

  const fetchConsents = useCallback(async () => {
    if (!session) return;
    setLoadingConsents(true);
    try {
      const list = await patientApi.getConsents(session.token);
      setConsents(list);
    } catch {
      addToast('Erro ao obter consentimentos.', 'error');
    } finally {
      setLoadingConsents(false);
    }
  }, [session, addToast]);

  useEffect(() => {
    if (activeSection === 'export') {
      fetchExport();
    } else if (activeSection === 'consents') {
      fetchConsents();
    }
  }, [activeSection, fetchExport, fetchConsents]);

  const handleToggleConsent = async (consentType: string, currentGranted: boolean) => {
    if (!session) return;
    try {
      await patientApi.updateConsent(session.token, consentType, !currentGranted);
      addToast('Preferência de consentimento atualizada.', 'success');
      fetchConsents();
    } catch {
      addToast('Erro ao atualizar consentimento.', 'error');
    }
  };

  const handleOpenRequest = async () => {
    if (!session || !clinicId) return;
    setSubmittingRequest(true);
    try {
      const res = await patientApi.openPrivacyRequest(
        session.token,
        clinicId,
        requestType,
        requestDetails,
      );
      setCreatedProtocol(res);
      addToast(`Solicitação registrada! Protocolo: ${res.protocol}`, 'success');
      setRequestDetails('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao abrir solicitação.';
      addToast(msg, 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleTrackProtocol = async () => {
    if (!searchProtocol.trim()) {
      addToast('Informe o número do protocolo.', 'info');
      return;
    }
    setTracking(true);
    try {
      const res = await patientApi.getPrivacyRequestStatus(searchProtocol.trim());
      setTrackedRequest(res);
    } catch {
      setTrackedRequest(null);
      addToast('Protocolo não encontrado.', 'error');
    } finally {
      setTracking(false);
    }
  };

  const downloadJson = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canamed-meus-dados-lgpd-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!session) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Portal de Privacidade e LGPD</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
          Para exercer seus direitos como titular de dados pessoais (Art. 18 da LGPD), acesse primeiro o <strong>Portal do Paciente</strong> com seu celular e CPF.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
          Privacidade e Autonomia do Titular (LGPD)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Em conformidade com a Lei Federal nº 13.709/2018 (LGPD), asseguramos a você transparência, controle e acesso direto aos seus dados.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveSection('export')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'export' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeSection === 'export' ? '#fff' : 'var(--color-text)',
          }}
        >
          Extrato Completo de Dados
        </button>
        <button
          onClick={() => setActiveSection('consents')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'consents' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeSection === 'consents' ? '#fff' : 'var(--color-text)',
          }}
        >
          Gestão de Consentimentos
        </button>
        <button
          onClick={() => setActiveSection('request')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'request' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeSection === 'request' ? '#fff' : 'var(--color-text)',
          }}
        >
          Abrir Solicitação LGPD
        </button>
        <button
          onClick={() => setActiveSection('track')}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            background: activeSection === 'track' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeSection === 'track' ? '#fff' : 'var(--color-text)',
          }}
        >
          Acompanhar Protocolo
        </button>
      </div>

      {/* Section 1: Extrato */}
      {activeSection === 'export' && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Meus Dados Cadastrais e Histórico</h3>
            {exportData && (
              <button
                onClick={downloadJson}
                style={{
                  padding: '8px 16px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Exportar Dados em JSON
              </button>
            )}
          </div>

          {loadingExport ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Gerando extrato seguro...</p>
          ) : exportData ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nome Completo</div>
                  <div style={{ fontWeight: 700 }}>{exportData.name}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Telefone de Contato</div>
                  <div style={{ fontWeight: 700 }}>{exportData.phone}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CPF</div>
                  <div style={{ fontWeight: 700 }}>{exportData.document || 'Não informado'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Data de Nascimento</div>
                  <div style={{ fontWeight: 700 }}>{exportData.birthDate || 'Não informado'}</div>
                </div>
              </div>

              {/* Legal Disclaimer Box */}
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '0.85rem',
                  color: '#1e40af',
                  lineHeight: '1.5',
                }}
              >
                <strong>Aviso Legal de Guarda Médica (CFM e Lei nº 13.787/2018):</strong>
                <p style={{ marginTop: '4px' }}>{exportData.legalRetentionNotice}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Section 2: Consents */}
      {activeSection === 'consents' && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Gestão de Consentimentos e Comunicação</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Controle quais canais e comunicações a clínica pode utilizar para entrar em contato com você.
          </p>

          {loadingConsents ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Carregando preferências de consentimento...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Lembretes de Consultas via WhatsApp</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Receba avisos 48h e 24h antes com botão para confirmar ou desmarcar.
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggleConsent(
                    'whatsapp_reminders',
                    consents.find((c) => c.consentType === 'whatsapp_reminders')?.isGranted ?? true,
                  )
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    (consents.find((c) => c.consentType === 'whatsapp_reminders')?.isGranted ?? true)
                      ? '#dcfce7'
                      : '#fee2e2',
                  color:
                    (consents.find((c) => c.consentType === 'whatsapp_reminders')?.isGranted ?? true)
                      ? '#15803d'
                      : '#b91c1c',
                }}
              >
                {(consents.find((c) => c.consentType === 'whatsapp_reminders')?.isGranted ?? true) ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Lembretes via SMS</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Canal alternativo de SMS para confirmação quando o WhatsApp estiver offline.
                </div>
              </div>
              <button
                onClick={() =>
                  handleToggleConsent(
                    'sms_reminders',
                    consents.find((c) => c.consentType === 'sms_reminders')?.isGranted ?? true,
                  )
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    (consents.find((c) => c.consentType === 'sms_reminders')?.isGranted ?? true)
                      ? '#dcfce7'
                      : '#fee2e2',
                  color:
                    (consents.find((c) => c.consentType === 'sms_reminders')?.isGranted ?? true)
                      ? '#15803d'
                      : '#b91c1c',
                }}
              >
                {(consents.find((c) => c.consentType === 'sms_reminders')?.isGranted ?? true) ? 'ATIVADO' : 'DESATIVADO'}
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Section 3: Abrir Solicitação */}
      {activeSection === 'request' && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Solicitação Formal de Direitos do Titular</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Abra um chamado formal ao Encarregado de Proteção de Dados (DPO) da clínica. Prazo legal de resposta: 15 dias (Art. 19 da LGPD).
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Tipo de Direito Solicitado</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.95rem' }}
            >
              <option value="data_access">Acesso Completo aos Dados (Art. 18, II)</option>
              <option value="rectification">Correção de Dados Incompletos ou Inexatos (Art. 18, III)</option>
              <option value="consent_revocation">Revogação do Consentimento (Art. 18, IX)</option>
              <option value="deletion">Eliminação de Dados Pessoais Tratados com Consentimento (Art. 18, VI)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Detalhes / Justificativa</label>
            <textarea
              placeholder="Descreva detalhadamente sua solicitação para a análise do DPO..."
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              style={{ width: '100%', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
            />
          </div>

          <button
            onClick={handleOpenRequest}
            disabled={submittingRequest}
            style={{
              padding: '12px 24px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: submittingRequest ? 'not-allowed' : 'pointer',
            }}
          >
            {submittingRequest ? 'Registrando...' : 'Registrar Solicitação Formal'}
          </button>

          {createdProtocol && (
            <div style={{ marginTop: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.05rem' }}>
                Solicitação Aberta com Sucesso!
              </div>
              <div style={{ fontSize: '0.9rem', color: '#14532d', marginTop: '6px' }}>
                Seu número de protocolo oficial é: <strong>{createdProtocol.protocol}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '4px' }}>
                Data limite para parecer: {new Date(createdProtocol.dueDate).toLocaleDateString('pt-BR')} (15 dias úteis/corridos).
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 4: Acompanhar Protocolo */}
      {activeSection === 'track' && (
        <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Consultar Protocolo de Privacidade</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Digite o número do seu protocolo para acompanhar o andamento da sua solicitação.
          </p>

          <div style={{ display: 'flex', gap: '8px', maxWidth: '440px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Ex.: LGPD-20261003-1234"
              value={searchProtocol}
              onChange={(e) => setSearchProtocol(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', fontWeight: 600 }}
            />
            <button
              onClick={handleTrackProtocol}
              disabled={tracking}
              style={{
                padding: '10px 20px',
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

          {trackedRequest && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Protocolo: </span>
                  <strong>{trackedRequest.protocol}</strong>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background:
                      trackedRequest.status === 'completed'
                        ? '#dcfce7'
                        : trackedRequest.status === 'rejected'
                        ? '#fee2e2'
                        : '#fef3c7',
                    color:
                      trackedRequest.status === 'completed'
                        ? '#15803d'
                        : trackedRequest.status === 'rejected'
                        ? '#b91c1c'
                        : '#b45309',
                  }}
                >
                  {trackedRequest.status.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>
                Tipo: <strong>{trackedRequest.requestType}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Data Limite de Resposta: {new Date(trackedRequest.dueDate).toLocaleDateString('pt-BR')}
              </div>

              {trackedRequest.responseNotes && (
                <div style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                  <strong>Parecer do Encarregado (DPO):</strong>
                  <p style={{ marginTop: '4px', color: '#334155' }}>{trackedRequest.responseNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
