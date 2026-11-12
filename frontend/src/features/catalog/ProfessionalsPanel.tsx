import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Edit2,
  Ban,
  RotateCcw,
  Award,
  AlertTriangle,
} from 'lucide-react';

import {
  fetchProfessionals,
  createProfessional,
  type Professional,
} from '../agenda/agendaApi';
import {
  fetchSpecialties,
  updateProfessional,
  deactivateProfessional,
  activateProfessional,
  type Specialty,
} from './catalogApi';
import { Drawer } from '../../shared/Drawer';
import { EmptyState } from '../../shared/EmptyState';

type ProfessionalFormState = {
  name: string;
  specialtyId: string;
  registrationNumber: string;
};

const emptyForm: ProfessionalFormState = {
  name: '',
  specialtyId: '',
  registrationNumber: '',
};

/**
 * Gestão do Corpo Clínico e Profissionais do Cana Med Mulher (SPEC-0030 / Módulo 3.3).
 * - Listagem e busca por Nome, CRM/Registro e Especialidade.
 * - Drawer lateral para cadastro e edição.
 * - Registro formal de CRM/UF e RQE.
 * - Trava assistencial de inativação (MED-03).
 */
export function ProfessionalsPanel() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Busca & Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [form, setForm] = useState<ProfessionalFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Modal de confirmação de inativação com trava assistencial
  const [deactivatingProfessional, setDeactivatingProfessional] = useState<Professional | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profs, specs] = await Promise.all([
        fetchProfessionals(),
        fetchSpecialties(),
      ]);
      setProfessionals(profs);
      setSpecialties(specs);
    } catch {
      setError('Não foi possível carregar a lista de profissionais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredProfessionals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return professionals.filter((prof) => {
      if (statusFilter === 'active' && !prof.isActive) return false;
      if (statusFilter === 'inactive' && prof.isActive) return false;

      if (!term) return true;

      const nameMatch = prof.name.toLowerCase().includes(term);
      const specMatch = prof.specialtyName?.toLowerCase().includes(term) ?? false;
      const regMatch = prof.registrationNumber?.toLowerCase().includes(term) ?? false;

      return nameMatch || specMatch || regMatch;
    });
  }, [professionals, search, statusFilter]);

  function handleOpenCreate() {
    setEditingProfessional(null);
    setForm(emptyForm);
    setFormErrors({});
    setDrawerOpen(true);
  }

  function handleOpenEdit(prof: Professional) {
    setEditingProfessional(prof);
    setForm({
      name: prof.name,
      specialtyId: prof.specialtyId || '',
      registrationNumber: prof.registrationNumber || '',
    });
    setFormErrors({});
    setDrawerOpen(true);
  }

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = 'Nome do profissional é obrigatório.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveProfessional(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const specialtyId = form.specialtyId || null;
    const registrationNumber = form.registrationNumber.trim() || null;

    try {
      if (editingProfessional) {
        await updateProfessional(editingProfessional.id, {
          name: form.name.trim(),
          specialtyId,
          registrationNumber,
        });
        setMessage('Cadastro do profissional atualizado com sucesso.');
      } else {
        await createProfessional({
          name: form.name.trim(),
          specialtyId,
          registrationNumber,
        });
        setMessage('Profissional cadastrado com sucesso.');
      }

      setDrawerOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'detail' in err
          ? String((err as { detail: string }).detail)
          : 'Falha ao salvar dados do profissional.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(prof: Professional) {
    setError(null);
    setMessage(null);
    try {
      if (prof.isActive) {
        await deactivateProfessional(prof.id);
        setMessage(`Profissional ${prof.name} inativado com sucesso.`);
      } else {
        await activateProfessional(prof.id);
        setMessage(`Profissional ${prof.name} reativado com sucesso.`);
      }
      setDeactivatingProfessional(null);
      await loadData();
    } catch {
      setError('Erro ao alterar status do profissional.');
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
            Corpo Clínico & Profissionais
          </h1>
          <p className="page__tagline" style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)' }}>
            Gerenciamento de médicos, especialidades e registros profissionais da clínica.
          </p>
        </div>

        <button
          type="button"
          className="button button--primary"
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          <span>Novo Profissional</span>
        </button>
      </div>

      {/* Alertas */}
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

      {/* Barra de Filtros */}
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
              placeholder="Buscar por nome, CRM ou especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`button button--small ${statusFilter === 'active' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => setStatusFilter('active')}
            >
              Ativos ({professionals.filter((p) => p.isActive).length})
            </button>
            <button
              type="button"
              className={`button button--small ${statusFilter === 'all' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => setStatusFilter('all')}
            >
              Todos ({professionals.length})
            </button>
            <button
              type="button"
              className={`button button--small ${statusFilter === 'inactive' ? 'button--secondary' : 'button--ghost'}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inativos ({professionals.filter((p) => !p.isActive).length})
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Total cadastrado: <strong>{filteredProfessionals.length}</strong> profissionais
        </div>
      </div>

      {/* Tabela de Profissionais */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Carregando corpo clínico...
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title={search ? 'Nenhum profissional encontrado' : 'Nenhum profissional cadastrado'}
            description={
              search
                ? `Não foram encontrados resultados para "${search}".`
                : 'Cadastre o primeiro médico ou profissional assistencial para disponibilizar horários na agenda.'
            }
            action={
              search
                ? { label: 'Limpar busca', onClick: () => setSearch('') }
                : { label: 'Cadastrar Profissional', onClick: handleOpenCreate }
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Profissional</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Especialidade</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Registro (CRM/UF)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfessionals.map((prof) => (
                  <tr
                    key={prof.id}
                    style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-secondary, #6F217B)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Stethoscope size={16} style={{ color: 'var(--color-primary, #852A91)' }} />
                        <span>{prof.name}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>
                      {prof.specialtyName ? (
                        <span className="badge" style={{ background: '#f0fdfa', color: '#6F217B' }}>
                          {prof.specialtyName}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Não atribuída</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontVariantNumeric: 'tabular-nums', color: '#334155' }}>
                      {prof.registrationNumber ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Award size={14} style={{ color: '#852A91' }} />
                          <span>{prof.registrationNumber}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {prof.isActive ? (
                        <span className="badge" style={{ background: '#F7ECF8', color: '#6F217B', border: '1px solid #b2f5ea' }}>
                          Ativo
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          Inativo
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => handleOpenEdit(prof)}
                          title="Editar dados do profissional"
                          aria-label={`Editar ${prof.name}`}
                        >
                          <Edit2 size={15} />
                          <span>Editar</span>
                        </button>

                        {prof.isActive ? (
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            onClick={() => setDeactivatingProfessional(prof)}
                            title="Inativar profissional"
                            aria-label={`Inativar ${prof.name}`}
                            style={{ color: '#dc2626' }}
                          >
                            <Ban size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="button button--ghost button--small"
                            onClick={() => void handleToggleActive(prof)}
                            title="Reativar profissional"
                            aria-label={`Reativar ${prof.name}`}
                            style={{ color: '#852A91' }}
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
      </div>

      {/* Drawer Lateral de Cadastro / Edição */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingProfessional ? editingProfessional.name : 'Novo Profissional'}
        subtitle={
          editingProfessional
            ? `Registro #${editingProfessional.id.slice(0, 8)} • ${editingProfessional.isActive ? 'Ativo' : 'Inativo'}`
            : 'Cadastre um médico ou especialista para vincular à agenda'
        }
        footer={
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
              onClick={(e) => void handleSaveProfessional(e)}
              disabled={saving}
            >
              {saving ? 'Salvando...' : editingProfessional ? 'Salvar Alterações' : 'Cadastrar Profissional'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveProfessional} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="form__group">
            <label className="form__label">
              Nome completo com titulação <span className="form__required">*</span>
            </label>
            <input
              type="text"
              className={`form__input ${formErrors.name ? 'form__input--error' : ''}`}
              placeholder="Ex: Dra. Ana Paula Silveira"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            {formErrors.name && (
              <span style={{ fontSize: '0.78rem', color: 'var(--color-danger)' }}>{formErrors.name}</span>
            )}
          </div>

          <div className="form__group">
            <label className="form__label">Especialidade principal</label>
            <select
              className="form__select"
              value={form.specialtyId}
              onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
            >
              <option value="">Selecione a especialidade...</option>
              {specialties
                .filter((s) => s.isActive || s.id === form.specialtyId)
                .map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="form__group">
            <label className="form__label">Registro Profissional (CRM/UF e RQE)</label>
            <input
              type="text"
              className="form__input"
              placeholder="Ex: CRM/PE 12345 • RQE 6789"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            />
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Utilizado na identificação de receitas, atestados e documentos clínicos emitidos.
            </span>
          </div>

          <div
            style={{
              padding: '0.85rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.8rem',
              color: '#475569',
              lineHeight: 1.45,
            }}
          >
            <strong>Continuidade do Cuidado:</strong> Horários de atendimento e duração das consultas são configurados de acordo com o catálogo de procedimentos ginecológicos da clínica.
          </div>
        </form>
      </Drawer>

      {/* Modal de Trava Assistencial na Inativação (MED-03) */}
      {deactivatingProfessional && (
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
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} /> Inativar Profissional
            </h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              Deseja confirmar a inativação de <strong>{deactivatingProfessional.name}</strong>?
            </p>
            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '8px',
                padding: '0.85rem',
                fontSize: '0.825rem',
                color: '#92400e',
                marginBottom: '1.25rem',
                lineHeight: 1.45,
              }}
            >
              <strong>Salvaguarda Ética e Assistencial (CFM):</strong> O profissional inativo não poderá receber novos agendamentos. Caso existam consultas futuras agendadas ou confirmadas, certifique-se de remanejar as pacientes na agenda para evitar abandono de atendimento.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setDeactivatingProfessional(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => void handleToggleActive(deactivatingProfessional)}
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

