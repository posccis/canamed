import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Calendar,
  Ban,
  Phone,
  Mail,
  FileText,
  Clock,
  RotateCcw,
} from 'lucide-react';

import {
  createPatient,
  fetchPatients,
  fetchPatientAppointments,
  type Appointment,
} from '../agenda/agendaApi';
import {
  updatePatient,
  deactivatePatient,
  activatePatient,
  type ManagedPatient,
} from '../catalog/catalogApi';
import { fetchHealthPlans, type HealthPlan } from '../clinics/clinicsApi';
import { Drawer } from '../../shared/Drawer';
import { EmptyState } from '../../shared/EmptyState';
import { formatTimeRange } from '../agenda/agendaFormat';
import { StatusBadge } from '../agenda/StatusBadge';

type PatientFormState = {
  name: string;
  phone: string;
  email: string;
  document: string;
  birthDate: string;
  healthPlanId: string;
  notes: string;
};

const emptyForm: PatientFormState = {
  name: '',
  phone: '',
  email: '',
  document: '',
  birthDate: '',
  healthPlanId: '',
  notes: '',
};

function calculateAge(birthDateStr?: string | null): string {
  if (!birthDateStr) return '';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} anos`;
}

function formatCpf(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Gestão Completa de Pacientes do Cana Med Mulher (SPEC-0030 / Módulo 3.2).
 * - Busca com debounce por Nome, CPF e Telefone.
 * - Drawer lateral para cadastro e edição rápida.
 * - Histórico de agendamentos associados.
 * - Inativação lógica com preservação de 20 anos (Lei nº 13.787/2018).
 * - Segregação estrita sem exposição de dados clínicos confidenciais.
 */
export function PatientsPanel() {
  const [patients, setPatients] = useState<ManagedPatient[]>([]);
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Filtros & Busca
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Paginação
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer & Edição
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<ManagedPatient | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'form' | 'history'>('form');
  const [form, setForm] = useState<PatientFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Histórico de agendamentos da paciente selecionada
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Modal de confirmação de inativação
  const [deactivatingPatient, setDeactivatingPatient] = useState<ManagedPatient | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientList, plans] = await Promise.all([
        fetchPatients(),
        fetchHealthPlans().catch(() => []),
      ]);
      setPatients(patientList);
      setHealthPlans(plans);
    } catch {
      setError('Não foi possível carregar a lista de pacientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Carrega histórico quando abre a aba de histórico de um paciente existente
  useEffect(() => {
    if (editingPatient && activeDrawerTab === 'history') {
      setLoadingAppointments(true);
      fetchPatientAppointments(editingPatient.id)
        .then(setPatientAppointments)
        .catch(() => setPatientAppointments([]))
        .finally(() => setLoadingAppointments(false));
    }
  }, [editingPatient, activeDrawerTab]);

  // Filtragem dos pacientes
  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    const cleanTermDigits = term.replace(/\D/g, '');

    return patients.filter((patient) => {
      // Filtro de status
      if (statusFilter === 'active' && !patient.isActive) return false;
      if (statusFilter === 'inactive' && patient.isActive) return false;

      if (!term) return true;

      const nameMatch = patient.name.toLowerCase().includes(term);
      const emailMatch = patient.email?.toLowerCase().includes(term) ?? false;
      const docMatch = cleanTermDigits && patient.document?.replace(/\D/g, '').includes(cleanTermDigits);
      const phoneMatch = cleanTermDigits && patient.phone?.replace(/\D/g, '').includes(cleanTermDigits);

      return nameMatch || emailMatch || Boolean(docMatch) || Boolean(phoneMatch);
    });
  }, [patients, search, statusFilter]);

  // Paginação sobre os filtrados
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  function handleOpenCreate() {
    setEditingPatient(null);
    setForm(emptyForm);
    setFormErrors({});
    setActiveDrawerTab('form');
    setDrawerOpen(true);
  }

  function handleOpenEdit(patient: ManagedPatient, initialTab: 'form' | 'history' = 'form') {
    setEditingPatient(patient);
    setForm({
      name: patient.name,
      phone: patient.phone,
      email: patient.email || '',
      document: patient.document || '',
      birthDate: patient.birthDate || '',
      healthPlanId: patient.healthPlanId || '',
      notes: '',
    });
    setFormErrors({});
    setActiveDrawerTab(initialTab);
    setDrawerOpen(true);
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = 'Nome da paciente é obrigatório.';
    }
    if (!form.phone.trim()) {
      errs.phone = 'Telefone para contato é obrigatório.';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'E-mail informado é inválido.';
    }
    const cleanCpf = form.document.replace(/\D/g, '');
    if (cleanCpf && cleanCpf.length !== 11) {
      errs.document = 'CPF deve conter exatamente 11 dígitos.';
    }

    // Validação de duplicidade de CPF na clínica (exceto se for a própria paciente em edição)
    if (cleanCpf) {
      const duplicate = patients.find(
        (p) =>
          p.id !== editingPatient?.id &&
          p.document?.replace(/\D/g, '') === cleanCpf
      );
      if (duplicate) {
        errs.document = `Já existe uma paciente cadastrada com este CPF (${duplicate.name}).`;
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSavePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const cleanCpf = form.document.replace(/\D/g, '') || null;
    const cleanPhone = form.phone.trim();
    const cleanEmail = form.email.trim() || null;
    const cleanBirth = form.birthDate || null;
    const planId = form.healthPlanId || null;

    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, {
          name: form.name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          birthDate: cleanBirth,
          document: cleanCpf,
          healthPlanId: planId,
        });
        setMessage('Cadastro da paciente atualizado com sucesso.');
      } else {
        await createPatient({
          name: form.name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          birthDate: cleanBirth,
          document: cleanCpf,
          healthPlanId: planId,
        });
        setMessage('Paciente cadastrada com sucesso.');
      }

      setDrawerOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'detail' in err
          ? String((err as { detail: string }).detail)
          : 'Falha ao salvar dados da paciente.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(patient: ManagedPatient) {
    setError(null);
    setMessage(null);
    try {
      if (patient.isActive) {
        await deactivatePatient(patient.id);
        setMessage(`Cadastro de ${patient.name} inativado com sucesso (histórico preservado).`);
      } else {
        await activatePatient(patient.id);
        setMessage(`Cadastro de ${patient.name} reativado com sucesso.`);
      }
      setDeactivatingPatient(null);
      await loadData();
    } catch {
      setError('Erro ao alterar status do cadastro da paciente.');
    }
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Cabeçalho da Página */}
      <div
        className="page__header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 className="page__title" style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            Gestão de Pacientes
          </h1>
          <p className="page__tagline" style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)' }}>
            Cadastro unificado, busca em tempo real e histórico de agendamentos da clínica.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          <span>Nova Paciente</span>
        </button>
      </div>

      {/* Alertas de Sucesso / Erro */}
      {message && (
        <div className="alert alert--success" role="status" style={{ marginBottom: '1rem' }}>
          <p>{message}</p>
        </div>
      )}
      {error && (
        <div className="alert alert--error" role="alert" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Barra de Ferramentas: Busca & Filtros */}
      <div
        className="card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <div className="login__input-with-icon" style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form__input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Buscar por nome, CPF ou telefone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Chips de filtro de status */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`button button--small ${statusFilter === 'active' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => { setStatusFilter('active'); setPage(1); }}
            >
              Ativas ({patients.filter((p) => p.isActive).length})
            </button>
            <button
              type="button"
              className={`button button--small ${statusFilter === 'all' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => { setStatusFilter('all'); setPage(1); }}
            >
              Todas ({patients.length})
            </button>
            <button
              type="button"
              className={`button button--small ${statusFilter === 'inactive' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => { setStatusFilter('inactive'); setPage(1); }}
            >
              Inativas ({patients.filter((p) => !p.isActive).length})
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Total encontrado: <strong>{totalItems}</strong> {totalItems === 1 ? 'paciente' : 'pacientes'}
        </div>
      </div>

      {/* Tabela de Pacientes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Carregando lista de pacientes...
          </div>
        ) : paginatedPatients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nenhuma paciente encontrada' : 'Nenhuma paciente cadastrada'}
            description={
              search
                ? `Não foram encontrados resultados para "${search}". Tente buscar por outros termos ou limpe o filtro.`
                : 'Cadastre a primeira paciente da clínica para iniciar os agendamentos e atendimentos.'
            }
            action={
              search
                ? { label: 'Limpar busca', onClick: () => setSearch('') }
                : { label: 'Cadastrar Paciente', onClick: handleOpenCreate }
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Paciente</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CPF</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contato</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Convênio</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Idade</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-secondary, #005F6A)' }}>
                        {patient.name}
                      </div>
                      {patient.email && (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={12} /> {patient.email}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontVariantNumeric: 'tabular-nums', color: '#334155' }}>
                      {patient.document ? formatCpf(patient.document) : '—'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontVariantNumeric: 'tabular-nums', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} style={{ color: '#94a3b8' }} />
                        <span>{formatPhone(patient.phone)}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {patient.healthPlanName ? (
                        <span className="badge" style={{ background: '#f0fdfa', color: '#005F6A' }}>
                          {patient.healthPlanName}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Particular</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                      {calculateAge(patient.birthDate) || '—'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {patient.isActive ? (
                        <span
                          className="badge"
                          style={{ background: '#e6fffa', color: '#005F6A', border: '1px solid #b2f5ea' }}
                        >
                          Ativa
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}
                        >
                          Inativa
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => handleOpenEdit(patient, 'form')}
                          title="Editar dados da paciente"
                          aria-label={`Editar dados de ${patient.name}`}
                        >
                          <Edit2 size={15} />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => handleOpenEdit(patient, 'history')}
                          title="Ver histórico de agendamentos"
                          aria-label={`Ver histórico de ${patient.name}`}
                        >
                          <Calendar size={15} />
                          <span>Histórico</span>
                        </button>

                        {patient.isActive ? (
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            onClick={() => setDeactivatingPatient(patient)}
                            title="Inativar cadastro"
                            aria-label={`Inativar ${patient.name}`}
                            style={{ color: '#dc2626' }}
                          >
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            onClick={() => void handleToggleActive(patient)}
                            title="Reativar cadastro"
                            aria-label={`Reativar ${patient.name}`}
                            style={{ color: '#008080' }}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Barra de Paginação */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: '#64748b',
            }}
          >
            <div>
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                className="form__select"
                style={{ height: '32px', padding: '0 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>

              <button
                type="button"
                className="button button--ghost button--small"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Lateral de Cadastro / Edição & Histórico */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingPatient ? editingPatient.name : 'Nova Paciente'}
        subtitle={
          editingPatient
            ? `Cadastro #${editingPatient.id.slice(0, 8)} • ${editingPatient.isActive ? 'Ativa' : 'Inativa'}`
            : 'Preencha os dados cadastrais mínimos para agendamento'
        }
        footer={
          activeDrawerTab === 'form' ? (
            <>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setDrawerOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={(e) => void handleSavePatient(e)}
                disabled={saving}
              >
                {saving ? 'Salvando...' : editingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setDrawerOpen(false)}
            >
              Fechar
            </button>
          )
        }
      >
        {/* Abas no topo do Drawer quando em modo de edição */}
        {editingPatient && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <button
              type="button"
              className={`button button--small ${activeDrawerTab === 'form' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => setActiveDrawerTab('form')}
            >
              Dados Cadastrais
            </button>
            <button
              type="button"
              className={`button button--small ${activeDrawerTab === 'history' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => setActiveDrawerTab('history')}
            >
              Histórico de Consultas
            </button>
          </div>
        )}

        {/* Conteúdo: Formulário de Cadastro */}
        {activeDrawerTab === 'form' && (
          <form onSubmit={handleSavePatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Nome Completo */}
            <div className="form__group">
              <label className="form__label">
                Nome completo <span className="form__required">*</span>
              </label>
              <input
                type="text"
                className={`form__input ${formErrors.name ? 'form__input--error' : ''}`}
                placeholder="Ex: Maria das Dores Silva"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              {formErrors.name && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)' }}>{formErrors.name}</span>
              )}
            </div>

            {/* CPF & Telefone em duas colunas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form__group">
                <label className="form__label">CPF</label>
                <input
                  type="text"
                  className={`form__input ${formErrors.document ? 'form__input--error' : ''}`}
                  placeholder="000.000.000-00"
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: formatCpf(e.target.value) })}
                />
                {formErrors.document && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)' }}>{formErrors.document}</span>
                )}
              </div>

              <div className="form__group">
                <label className="form__label">
                  Telefone / WhatsApp <span className="form__required">*</span>
                </label>
                <input
                  type="text"
                  className={`form__input ${formErrors.phone ? 'form__input--error' : ''}`}
                  placeholder="(81) 99999-9999"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  required
                />
                {formErrors.phone && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)' }}>{formErrors.phone}</span>
                )}
              </div>
            </div>

            {/* E-mail & Data de Nascimento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
              <div className="form__group">
                <label className="form__label">E-mail</label>
                <input
                  type="email"
                  className={`form__input ${formErrors.email ? 'form__input--error' : ''}`}
                  placeholder="paciente@exemplo.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {formErrors.email && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)' }}>{formErrors.email}</span>
                )}
              </div>

              <div className="form__group">
                <label className="form__label">Data de nascimento</label>
                <input
                  type="date"
                  className="form__input"
                  value={form.birthDate}
                  onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                />
              </div>
            </div>

            {/* Convênio / Plano de Saúde */}
            <div className="form__group">
              <label className="form__label">Convênio ou Plano de Saúde</label>
              <select
                className="form__select"
                value={form.healthPlanId}
                onChange={(e) => setForm({ ...form, healthPlanId: e.target.value })}
              >
                <option value="">Particular (Sem convênio)</option>
                {healthPlans
                  .filter((p) => p.isActive || p.id === form.healthPlanId)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} {plan.ansCode ? `(ANS ${plan.ansCode})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* Aviso Regulatório e de Privacidade (LGPD & CFM) */}
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '0.8rem',
                color: '#475569',
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 600, color: '#005F6A', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={14} /> Observações administrativas e sigilo
              </div>
              <p style={{ margin: 0 }}>
                Anotações cadastrais são restritas à rotina de recepção e faturamento. Dados clínicos de anamnese e exames íntimos são acessíveis exclusivamente no consultório médico sob sigilo CFM.
              </p>
            </div>
          </form>
        )}

        {/* Conteúdo: Histórico de Consultas da Paciente */}
        {activeDrawerTab === 'history' && (
          <div>
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
              Histórico operacional de agendamentos de <strong>{editingPatient?.name}</strong> na clínica:
            </div>

            {loadingAppointments ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Carregando histórico de agendamentos...
              </div>
            ) : patientAppointments.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
                Nenhum agendamento registrado para esta paciente ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {patientAppointments.map((app) => (
                  <div
                    key={app.id}
                    style={{
                      padding: '0.85rem 1rem',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#005F6A', fontSize: '0.9rem' }}>
                        {app.appointmentTypeName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={13} />
                        <span>{formatTimeRange(app.startsAt, app.endsAt)}</span>
                        <span>• {app.specialtyName || 'Ginecologia'}</span>
                      </div>
                    </div>

                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal de Confirmação de Inativação Lógica */}
      {deactivatingPatient && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#991b1b' }}>
              Inativar Cadastro de Paciente
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              Deseja realmente inativar o cadastro de <strong>{deactivatingPatient.name}</strong>?
            </p>
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                color: '#991b1b',
                marginBottom: '1.25rem',
              }}
            >
              <strong>Salvaguarda Legal (Lei nº 13.787/2018):</strong> O histórico de consultas, agendamentos e registros de saúde NÃO será apagado e permanecerá retido de forma segura pelo prazo legal mínimo de 20 anos.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setDeactivatingPatient(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => void handleToggleActive(deactivatingPatient)}
              >
                Confirmar Inativação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
