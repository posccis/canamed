import { useState, useEffect } from 'react';
import { patientApi, type PatientDataExport } from './patientApi';
import { useToast } from '../layout/Toast';

type PatientProfileSectionProps = {
  sessionToken: string;
};

export function PatientProfileSection({ sessionToken }: PatientProfileSectionProps) {
  const { addToast } = useToast();
  const [data, setData] = useState<PatientDataExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    patientApi
      .exportMyData(sessionToken)
      .then((res) => {
        if (!active) return;
        setData(res);
        setPhone(res.phone || '');
        setEmail(res.email || '');
      })
      .catch(() => {
        addToast('Não foi possível carregar seus dados cadastrais.', 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionToken, addToast]);

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Simula atualização com persistência de feedback
    setTimeout(() => {
      setSaving(false);
      addToast('Dados de contato atualizados com sucesso.', 'success');
    }, 400);
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--content-secondary, #626B79)' }}>
        Carregando suas informações pessoais...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--base-border, #E2E6EC)',
        padding: '24px',
        boxShadow: '0 2px 10px -2px rgba(32, 38, 49, 0.05)',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--content-primary, #202631)' }}>
          Meus Dados Cadastrais
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--content-secondary, #626B79)' }}>
          Consulte seus dados cadastrados na clínica. Para alterar nome ou documento oficial, solicite suporte à recepção por segurança médica.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          backgroundColor: 'var(--base-bg, #F7F8FA)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--content-muted, #858D99)', textTransform: 'uppercase' }}>
            Nome Completo
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--content-primary, #202631)', marginTop: '2px' }}>
            {data?.name || 'Não informado'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--content-muted, #858D99)', textTransform: 'uppercase' }}>
            Documento (CPF)
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--content-primary, #202631)', marginTop: '2px' }}>
            {data?.document ? `***.${data.document.slice(3, 6)}.${data.document.slice(6, 9)}-**` : 'Cadastrado via OTP'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--content-muted, #858D99)', textTransform: 'uppercase' }}>
            Data de Nascimento
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--content-primary, #202631)', marginTop: '2px' }}>
            {data?.birthDate ? new Date(data.birthDate).toLocaleDateString('pt-BR') : 'Não informada'}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--content-muted, #858D99)', textTransform: 'uppercase' }}>
            Cadastro Ativo Desde
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--content-primary, #202631)', marginTop: '2px' }}>
            {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('pt-BR') : 'Data recente'}
          </div>
        </div>
      </div>

      {/* Formulário de Atualização de Contato */}
      <form onSubmit={handleSaveContact} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--content-primary, #202631)' }}>
          Canais de Contato & Confirmações
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--content-primary, #202631)' }}>
              Celular com WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(81) 98765-4321"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--base-border, #E2E6EC)',
                fontSize: '0.95rem',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--content-muted, #858D99)', marginTop: '4px', display: 'block' }}>
              Utilizado para envio do código de acesso seguro e avisos da consulta.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--content-primary, #202631)' }}>
              E-mail para Recibos e Documentos
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--base-border, #E2E6EC)',
                fontSize: '0.95rem',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--content-muted, #858D99)', marginTop: '4px', display: 'block' }}>
              Opcional. Receba comprovantes e notificações de agendamento por e-mail.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--brand-primary, #852A91)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(133, 42, 145, 0.2)',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações de Contato'}
          </button>
        </div>
      </form>
    </div>
  );
}
