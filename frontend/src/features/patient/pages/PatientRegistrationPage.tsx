import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { patientPaths } from '../../../navigation/routes';
import { patientApi, type RegistrationDraftResponse } from '../patientApi';
import { formatCpf, formatPhone } from '../../../utils/masks';

interface FormState {
  name: string;
  document: string;
  birthDate: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  healthPlanName: string;
  healthPlanCardNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  chronicConditions: string;
  consentTerms: boolean;
}

const initialForm: FormState = {
  name: '',
  document: '',
  birthDate: '',
  phone: '',
  email: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  healthPlanName: '',
  healthPlanCardNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  allergies: '',
  chronicConditions: '',
  consentTerms: true,
};

/**
 * Página pública de Cadastro Completo pelo link compartilhado L-06 (SPEC-0026/F-004/RN-015/RN-016).
 * Permite preenchimento mobile-first, salvamento de rascunho e envio para validação pela recepção.
 */
export function PatientRegistrationPage() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const paths = patientPaths(slug ?? 'cana-med');

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<RegistrationDraftResponse | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const loadDraft = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await patientApi.getRegistrationDraft(token);
      setDraft(res);

      if (res.payloadJson) {
        try {
          const parsed = JSON.parse(res.payloadJson);
          setForm((prev) => ({
            ...prev,
            ...parsed,
          }));
        } catch {
          // Mantém o estado atual
        }
      }
    } catch {
      setNotice({
        type: 'error',
        message: 'Não foi possível carregar o formulário. O link pode ter expirado ou ser inválido.',
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    let formatted = value;
    if (typeof value === 'string') {
      if (field === 'document') {
        formatted = formatCpf(value);
      } else if (field === 'phone' || field === 'emergencyContactPhone') {
        formatted = formatPhone(value);
      }
    }
    setForm((prev) => ({ ...prev, [field]: formatted }));
  };

  const handleSaveDraft = async () => {
    if (!token) return;
    setBusy(true);
    setNotice(null);
    try {
      const updated = await patientApi.updateRegistrationDraft(token, JSON.stringify(form));
      setDraft(updated);
      setNotice({ type: 'success', message: 'Rascunho salvo com sucesso. Você pode continuar depois!' });
    } catch {
      setNotice({ type: 'error', message: 'Falha ao salvar rascunho. Tente novamente.' });
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    if (!form.name.trim() || !form.phone.trim()) {
      setNotice({ type: 'error', message: 'Preencha pelo menos nome e telefone para enviar.' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const submitted = await patientApi.submitRegistrationDraft(token, JSON.stringify(form));
      setDraft(submitted);
      setNotice({
        type: 'success',
        message: 'Cadastro enviado com sucesso para conferência da nossa equipe!',
      });
    } catch {
      setNotice({ type: 'error', message: 'Erro ao enviar cadastro. Tente novamente.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <section className="patient-page">
        <p className="patient-help">Carregando formulário de cadastro…</p>
      </section>
    );
  }

  const isApproved = draft?.status === 'approved';
  const isPendingReview = draft?.status === 'pending_review';
  const isReturned = draft?.status === 'returned';
  const isReadOnly = isApproved || isPendingReview;

  return (
    <section className="patient-page">
      <header className="patient-page__header">
        <h1 className="patient-page__title">Cadastro Completo</h1>
        <p className="patient-page__subtitle">
          {draft ? `Paciente: ${draft.patientNameMasked}` : 'Preencha seus dados cadastrais para atendimento.'}
        </p>
      </header>

      {/* Badges de Status */}
      {isApproved && (
        <div className="patient-notice" style={{ background: '#dcfce7', borderColor: '#22c55e', color: '#15803d' }}>
          <strong>Cadastro Aprovado!</strong>
          <p style={{ marginTop: '4px' }}>
            Seus dados cadastrais foram validados com sucesso pela nossa recepção.
          </p>
        </div>
      )}

      {isPendingReview && (
        <div className="patient-notice" style={{ background: '#e0f2fe', borderColor: '#0284c7', color: '#0369a1' }}>
          <strong>Cadastro em Análise</strong>
          <p style={{ marginTop: '4px' }}>
            Recebemos seus dados! Nossa recepção está realizando a conferência. Você pode acompanhar por este mesmo link.
          </p>
        </div>
      )}

      {isReturned && (
        <div className="patient-notice patient-notice--error">
          <strong>Ajustes Solicitados pela Recepção</strong>
          <p style={{ marginTop: '4px' }}>
            {draft.reviewNote || 'Por favor, revise as informações indicadas e reenvie.'}
          </p>
        </div>
      )}

      {notice && !isApproved && !isPendingReview && (
        <div className={`patient-notice ${notice.type === 'error' ? 'patient-notice--error' : ''}`}>
          {notice.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dados Pessoais */}
        <fieldset className="patient-fieldset" disabled={isReadOnly}>
          <legend style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
            1. Dados Pessoais
          </legend>

          <label className="patient-field">
            <span>Nome Completo *</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            <label className="patient-field">
              <span>CPF</span>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={form.document}
                onChange={(e) => handleChange('document', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>Data de Nascimento</span>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            <label className="patient-field">
              <span>Telefone / WhatsApp *</span>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </label>
          </div>
        </fieldset>

        {/* Endereço */}
        <fieldset className="patient-fieldset" disabled={isReadOnly} style={{ marginTop: '16px' }}>
          <legend style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
            2. Endereço Residencial
          </legend>

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
            <label className="patient-field">
              <span>CEP</span>
              <input
                type="text"
                placeholder="50000-000"
                value={form.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>Logradouro (Rua/Av.)</span>
              <input
                type="text"
                value={form.street}
                onChange={(e) => handleChange('street', e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '8px' }}>
            <label className="patient-field">
              <span>Número</span>
              <input
                type="text"
                value={form.number}
                onChange={(e) => handleChange('number', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>Complemento</span>
              <input
                type="text"
                value={form.complement}
                onChange={(e) => handleChange('complement', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>Bairro</span>
              <input
                type="text"
                value={form.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px', gap: '8px' }}>
            <label className="patient-field">
              <span>Cidade</span>
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>UF</span>
              <input
                type="text"
                maxLength={2}
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
              />
            </label>
          </div>
        </fieldset>

        {/* Convênio */}
        <fieldset className="patient-fieldset" disabled={isReadOnly} style={{ marginTop: '16px' }}>
          <legend style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
            3. Convênio / Plano de Saúde (se aplicável)
          </legend>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <label className="patient-field">
              <span>Nome do Convênio / Operadora</span>
              <input
                type="text"
                placeholder="Ex: Unimed, Bradesco, Particular"
                value={form.healthPlanName}
                onChange={(e) => handleChange('healthPlanName', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>Número da Carteirinha</span>
              <input
                type="text"
                value={form.healthPlanCardNumber}
                onChange={(e) => handleChange('healthPlanCardNumber', e.target.value)}
              />
            </label>
          </div>
        </fieldset>

        {/* Contato de Emergência e Histórico */}
        <fieldset className="patient-fieldset" disabled={isReadOnly} style={{ marginTop: '16px' }}>
          <legend style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary-dark)' }}>
            4. Informações Complementares
          </legend>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
            <label className="patient-field">
              <span>Contato de Emergência (Nome)</span>
              <input
                type="text"
                value={form.emergencyContactName}
                onChange={(e) => handleChange('emergencyContactName', e.target.value)}
              />
            </label>

            <label className="patient-field">
              <span>Telefone de Emergência</span>
              <input
                type="tel"
                value={form.emergencyContactPhone}
                onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
              />
            </label>
          </div>

          <label className="patient-field" style={{ marginTop: '8px' }}>
            <span>Alergias Conhecidas</span>
            <input
              type="text"
              placeholder="Ex: Penicilina, Dipirona, Nenhuma..."
              value={form.allergies}
              onChange={(e) => handleChange('allergies', e.target.value)}
            />
          </label>

          <label className="patient-field">
            <span>Condições Crônicas ou Medicamentos de Uso Contínuo</span>
            <input
              type="text"
              placeholder="Ex: Hipertensão, Diabetes..."
              value={form.chronicConditions}
              onChange={(e) => handleChange('chronicConditions', e.target.value)}
            />
          </label>
        </fieldset>

        {/* Consentimento LGPD */}
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <input
            type="checkbox"
            id="consentTerms"
            disabled={isReadOnly}
            checked={form.consentTerms}
            onChange={(e) => handleChange('consentTerms', e.target.checked)}
            style={{ marginTop: '4px' }}
          />
          <label htmlFor="consentTerms" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Declaro que as informações acima são verdadeiras e autorizo o tratamento dos meus dados para fins
            assistenciais e de cuidado à saúde pela clínica, conforme a LGPD (Lei nº 13.709/2018).
          </label>
        </div>

        {/* Ações */}
        {!isReadOnly && (
          <div className="patient-actions" style={{ marginTop: '24px' }}>
            <button
              type="submit"
              className="patient-action patient-action--primary"
              disabled={busy}
            >
              {busy ? 'Enviando…' : 'Enviar cadastro para conferência'}
            </button>

            <button
              type="button"
              className="patient-action"
              onClick={() => void handleSaveDraft()}
              disabled={busy}
            >
              {busy ? 'Salvando…' : 'Salvar rascunho'}
            </button>
          </div>
        )}
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p className="patient-help">
          Precisa de ajuda com seu cadastro? Ligue para a recepção da nossa clínica.
        </p>
        <Link className="patient-action" style={{ display: 'inline-block', marginTop: '12px' }} to={paths.base}>
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
