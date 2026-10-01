import { useCallback, useEffect, useState } from 'react';

import { describeError } from '../agenda/agendaErrors';
import {
  activateAppointmentType,
  activatePatient,
  activateProfessional,
  activateSpecialty,
  createManagedAppointmentType,
  createSpecialty,
  deactivateAppointmentType,
  deactivatePatient,
  deactivateProfessional,
  deactivateSpecialty,
  fetchSpecialties,
  renameSpecialty,
  updateAppointmentType,
  updatePatient,
  updateProfessional,
  type ManagedAppointmentType,
  type ManagedPatient,
  type ManagedProfessional,
  type Specialty,
} from './catalogApi';
import { categoryLabels, categoryOptions, coverageLabels, coverageOptions, describeClassification } from './catalogLabels';
import { fetchPatients, fetchProfessionals, fetchAppointmentTypes } from '../agenda/agendaApi';

type TypeFormState = {
  id: string | null;
  name: string;
  category: string;
  coverage: string;
  durationMinutes: string;
  specialtyId: string;
};

const emptyTypeForm: TypeFormState = {
  id: null,
  name: '',
  category: 'avulsa',
  coverage: 'particular',
  durationMinutes: '30',
  specialtyId: '',
};

/**
 * Catálogo assistencial (SPEC-0004): especialidades, tipos de consulta com natureza e custeio,
 * profissionais e pacientes — criação, edição e ativação/desativação.
 */
export function CatalogPanel() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<ManagedAppointmentType[]>([]);
  const [professionals, setProfessionals] = useState<ManagedProfessional[]>([]);
  const [patients, setPatients] = useState<ManagedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [specialtyName, setSpecialtyName] = useState('');
  const [renamingSpecialty, setRenamingSpecialty] = useState<Specialty | null>(null);
  const [specialtyDraft, setSpecialtyDraft] = useState('');
  const [typeForm, setTypeForm] = useState<TypeFormState | null>(null);
  const [editingProfessional, setEditingProfessional] = useState<ManagedProfessional | null>(null);
  const [professionalDraft, setProfessionalDraft] = useState({ name: '', specialtyId: '' });
  const [editingPatient, setEditingPatient] = useState<ManagedPatient | null>(null);
  const [patientDraft, setPatientDraft] = useState({ name: '', phone: '', email: '', birthDate: '' });

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const [specialtyList, typeList, professionalList, patientList] = await Promise.all([
        fetchSpecialties(),
        fetchAppointmentTypes(),
        fetchProfessionals(),
        fetchPatients(),
      ]);

      setSpecialties(specialtyList);
      setAppointmentTypes(typeList);
      setProfessionals(professionalList);
      setPatients(patientList);
      setError(null);
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await action();
      setMessage(successMessage);
      await reload();
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSaving(false);
    }
  }

  const activeSpecialties = specialties.filter((specialty) => specialty.isActive);

  return (
    <div className="page">
      <h1 className="page__title page__title--section">Catálogo assistencial</h1>

      {message ? (
        <div className="alert alert--success" role="status">
          <p>{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? <div className="skeleton"><div className="skeleton__row" /></div> : null}

      <section className="card">
        <h2 className="card__title">Especialidades</h2>
        <p className="form__hint">
          Usadas por profissionais e por tipos de consulta. Uma especialidade em uso por registro ativo não pode ser
          desativada.
        </p>

        <form
          className="form form--inline"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => createSpecialty(specialtyName.trim()), 'Especialidade criada.').then(() =>
              setSpecialtyName(''),
            );
          }}
        >
          <label className="field">
            <span className="field__label">Nova especialidade</span>
            <input
              className="field__input"
              value={specialtyName}
              onChange={(event) => setSpecialtyName(event.target.value)}
              required
              maxLength={120}
            />
          </label>
          <button type="submit" className="button button--secondary" disabled={saving}>
            Adicionar
          </button>
        </form>

        <ul className="agenda__list">
          {specialties.map((specialty) => (
            <li key={specialty.id} className="agenda__item">
              <div className="agenda__details">
                <p className="agenda__patient">{specialty.name}</p>
              </div>
              <span className={`badge ${specialty.isActive ? 'badge--confirmado' : 'badge--cancelado'}`}>
                {specialty.isActive ? 'Ativa' : 'Inativa'}
              </span>
              <div className="agenda__actions">
                <button
                  type="button"
                  className="button button--link"
                  onClick={() => {
                    setRenamingSpecialty(specialty);
                    setSpecialtyDraft(specialty.name);
                  }}
                >
                  Renomear
                </button>
                {specialty.isActive ? (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => deactivateSpecialty(specialty.id), 'Especialidade desativada.')}
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => activateSpecialty(specialty.id), 'Especialidade reativada.')}
                  >
                    Reativar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {renamingSpecialty ? (
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => renameSpecialty(renamingSpecialty.id, specialtyDraft || renamingSpecialty.name),
                'Especialidade renomeada.',
              ).then(() => setRenamingSpecialty(null));
            }}
          >
            <label className="field">
              <span className="field__label">Novo nome de {renamingSpecialty.name}</span>
              <input
                className="field__input"
                value={specialtyDraft}
                onChange={(event) => setSpecialtyDraft(event.target.value)}
                required
                maxLength={120}
              />
            </label>
            <button type="submit" className="button button--primary" disabled={saving}>
              Salvar
            </button>
            <button type="button" className="button button--ghost" onClick={() => setRenamingSpecialty(null)}>
              Cancelar
            </button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card__title">Tipos de consulta</h2>
        <p className="form__hint">
          A natureza (avulsa ou acompanhamento) e o custeio (particular ou plano de saúde) são copiados para cada
          agendamento no momento da criação.
        </p>

        {!typeForm ? (
          <button type="button" className="button button--secondary" onClick={() => setTypeForm(emptyTypeForm)}>
            Novo tipo de consulta
          </button>
        ) : (
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();

              const request = {
                name: typeForm.name.trim(),
                category: typeForm.category,
                coverage: typeForm.coverage,
                durationMinutes: Number(typeForm.durationMinutes),
                specialtyId: typeForm.specialtyId || null,
              };

              void run(
                () =>
                  typeForm.id
                    ? updateAppointmentType(typeForm.id, request)
                    : createManagedAppointmentType(request),
                typeForm.id ? 'Tipo de consulta alterado.' : 'Tipo de consulta criado.',
              ).then(() => setTypeForm(null));
            }}
          >
            <label className="field">
              <span className="field__label">Nome</span>
              <input
                className="field__input"
                value={typeForm.name}
                onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value })}
                required
                maxLength={200}
              />
            </label>

            <label className="field field--short">
              <span className="field__label">Natureza</span>
              <select
                className="field__input"
                value={typeForm.category}
                onChange={(event) => setTypeForm({ ...typeForm, category: event.target.value })}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--short">
              <span className="field__label">Custeio</span>
              <select
                className="field__input"
                value={typeForm.coverage}
                onChange={(event) => setTypeForm({ ...typeForm, coverage: event.target.value })}
              >
                {coverageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--short">
              <span className="field__label">Especialidade</span>
              <select
                className="field__input"
                value={typeForm.specialtyId}
                onChange={(event) => setTypeForm({ ...typeForm, specialtyId: event.target.value })}
              >
                <option value="">Sem especialidade</option>
                {activeSpecialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field--short">
              <span className="field__label">Duração (min)</span>
              <input
                className="field__input"
                type="number"
                min={1}
                max={1440}
                value={typeForm.durationMinutes}
                onChange={(event) => setTypeForm({ ...typeForm, durationMinutes: event.target.value })}
                required
              />
            </label>

            <button type="submit" className="button button--primary" disabled={saving}>
              Salvar
            </button>
            <button type="button" className="button button--ghost" onClick={() => setTypeForm(null)}>
              Cancelar
            </button>
          </form>
        )}

        <ul className="agenda__list">
          {appointmentTypes.map((type) => (
            <li key={type.id} className="agenda__item">
              <div className="agenda__time">{Number(type.durationMinutes)} min</div>
              <div className="agenda__details">
                <p className="agenda__patient">{type.name}</p>
                <p className="agenda__meta">
                  {describeClassification(type.category, type.coverage, type.specialtyName)}
                </p>
              </div>
              <span className={`badge ${type.isActive ? 'badge--confirmado' : 'badge--cancelado'}`}>
                {type.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <div className="agenda__actions">
                <button
                  type="button"
                  className="button button--link"
                  onClick={() =>
                    setTypeForm({
                      id: type.id,
                      name: type.name,
                      category: type.category,
                      coverage: type.coverage,
                      durationMinutes: String(Number(type.durationMinutes)),
                      specialtyId: type.specialtyId ?? '',
                    })
                  }
                >
                  Editar
                </button>
                {type.isActive ? (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => deactivateAppointmentType(type.id), 'Tipo desativado.')}
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => activateAppointmentType(type.id), 'Tipo reativado.')}
                  >
                    Reativar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="card__title">Profissionais</h2>

        <ul className="agenda__list">
          {professionals.map((professional) => (
            <li key={professional.id} className="agenda__item">
              <div className="agenda__details">
                <p className="agenda__patient">{professional.name}</p>
                <p className="agenda__meta">{professional.specialtyName ?? 'Sem especialidade definida'}</p>
              </div>
              <span className={`badge ${professional.isActive ? 'badge--confirmado' : 'badge--cancelado'}`}>
                {professional.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <div className="agenda__actions">
                <button
                  type="button"
                  className="button button--link"
                  onClick={() => {
                    setEditingProfessional(professional);
                    setProfessionalDraft({
                      name: professional.name,
                      specialtyId: professional.specialtyId ?? '',
                    });
                  }}
                >
                  Editar
                </button>
                {professional.isActive ? (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => deactivateProfessional(professional.id), 'Profissional desativado.')}
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => activateProfessional(professional.id), 'Profissional reativado.')}
                  >
                    Reativar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {editingProfessional ? (
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () =>
                  updateProfessional(editingProfessional.id, {
                    name: professionalDraft.name.trim(),
                    specialtyId: professionalDraft.specialtyId || null,
                  }),
                'Profissional atualizado.',
              ).then(() => setEditingProfessional(null));
            }}
          >
            <label className="field">
              <span className="field__label">Nome</span>
              <input
                className="field__input"
                value={professionalDraft.name}
                onChange={(event) => setProfessionalDraft({ ...professionalDraft, name: event.target.value })}
                required
                maxLength={200}
              />
            </label>
            <label className="field field--short">
              <span className="field__label">Especialidade</span>
              <select
                className="field__input"
                value={professionalDraft.specialtyId}
                onChange={(event) => setProfessionalDraft({ ...professionalDraft, specialtyId: event.target.value })}
              >
                <option value="">Sem especialidade</option>
                {activeSpecialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button button--primary" disabled={saving}>
              Salvar
            </button>
            <button type="button" className="button button--ghost" onClick={() => setEditingProfessional(null)}>
              Cancelar
            </button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2 className="card__title">Pacientes</h2>
        <p className="form__hint">E-mail e data de nascimento são opcionais e não aparecem em log.</p>

        <ul className="agenda__list">
          {patients.map((patient) => (
            <li key={patient.id} className="agenda__item">
              <div className="agenda__details">
                <p className="agenda__patient">{patient.name}</p>
                <p className="agenda__meta">
                  {patient.phone}
                  {patient.email ? ` • ${patient.email}` : ''}
                  {patient.birthDate ? ` • nasc. ${patient.birthDate}` : ''}
                </p>
              </div>
              <span className={`badge ${patient.isActive ? 'badge--confirmado' : 'badge--cancelado'}`}>
                {patient.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <div className="agenda__actions">
                <button
                  type="button"
                  className="button button--link"
                  onClick={() => {
                    setEditingPatient(patient);
                    setPatientDraft({
                      name: patient.name,
                      phone: patient.phone,
                      email: patient.email ?? '',
                      birthDate: patient.birthDate ?? '',
                    });
                  }}
                >
                  Editar
                </button>
                {patient.isActive ? (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => deactivatePatient(patient.id), 'Paciente desativado.')}
                  >
                    Desativar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button--link"
                    onClick={() => void run(() => activatePatient(patient.id), 'Paciente reativado.')}
                  >
                    Reativar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {editingPatient ? (
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () =>
                  updatePatient(editingPatient.id, {
                    name: patientDraft.name.trim(),
                    phone: patientDraft.phone.trim(),
                    email: patientDraft.email.trim() || null,
                    birthDate: patientDraft.birthDate || null,
                  }),
                'Paciente atualizado.',
              ).then(() => setEditingPatient(null));
            }}
          >
            <label className="field">
              <span className="field__label">Nome</span>
              <input
                className="field__input"
                value={patientDraft.name}
                onChange={(event) => setPatientDraft({ ...patientDraft, name: event.target.value })}
                required
                maxLength={200}
              />
            </label>
            <label className="field">
              <span className="field__label">Telefone</span>
              <input
                className="field__input"
                value={patientDraft.phone}
                onChange={(event) => setPatientDraft({ ...patientDraft, phone: event.target.value })}
                required
                maxLength={40}
              />
            </label>
            <label className="field">
              <span className="field__label">E-mail</span>
              <input
                className="field__input"
                type="email"
                value={patientDraft.email}
                onChange={(event) => setPatientDraft({ ...patientDraft, email: event.target.value })}
              />
            </label>
            <label className="field field--short">
              <span className="field__label">Nascimento</span>
              <input
                className="field__input"
                type="date"
                value={patientDraft.birthDate}
                onChange={(event) => setPatientDraft({ ...patientDraft, birthDate: event.target.value })}
              />
            </label>
            <button type="submit" className="button button--primary" disabled={saving}>
              Salvar
            </button>
            <button type="button" className="button button--ghost" onClick={() => setEditingPatient(null)}>
              Cancelar
            </button>
          </form>
        ) : null}
      </section>

      <p className="form__hint">
        Naturezas disponíveis: {Object.values(categoryLabels).join(', ')}. Custeios: {Object.values(coverageLabels).join(', ')}.
      </p>
    </div>
  );
}
