import { useEffect, useState } from 'react';

import { createAppointmentType, createPatient, createProfessional } from './agendaApi';
import { describeError } from './agendaErrors';
import { fetchSpecialties, type Specialty } from '../catalog/catalogApi';
import { categoryOptions, coverageOptions } from '../catalog/catalogLabels';

type QuickRegistrationPanelProps = {
  onRegistered: (message: string) => void;
};

/**
 * Cadastro rápido a partir da agenda: paciente, profissional e tipo de consulta com a classificação
 * assistencial (natureza, custeio e especialidade) exigida pela SPEC-0004.
 */
export function QuickRegistrationPanel({ onRegistered }: QuickRegistrationPanelProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientBirthDate, setPatientBirthDate] = useState('');
  const [professionalName, setProfessionalName] = useState('');
  const [professionalSpecialtyId, setProfessionalSpecialtyId] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeCategory, setTypeCategory] = useState('avulsa');
  const [typeCoverage, setTypeCoverage] = useState('particular');
  const [typeSpecialtyId, setTypeSpecialtyId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchSpecialties(controller.signal)
      .then((list) => setSpecialties(list.filter((specialty) => specialty.isActive)))
      .catch(() => setSpecialties([]));

    return () => controller.abort();
  }, []);

  async function submit(action: () => Promise<unknown>, successMessage: string, reset: () => void) {
    setSaving(true);
    setError(null);

    try {
      await action();
      reset();
      onRegistered(successMessage);
    } catch (reason: unknown) {
      setError(describeError(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2 className="card__title">Cadastros rápidos</h2>
      <p className="form__hint">
        Cadastro mínimo para operar a agenda, com a classificação da consulta. Gestão completa do catálogo fica na aba
        Catálogo.
      </p>

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <form
        className="form form--inline"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(
            () =>
              createPatient({
                name: patientName.trim(),
                phone: patientPhone.trim(),
                email: patientEmail.trim() || null,
                birthDate: patientBirthDate || null,
              }),
            'Paciente cadastrado.',
            () => {
              setPatientName('');
              setPatientPhone('');
              setPatientEmail('');
              setPatientBirthDate('');
            },
          );
        }}
      >
        <label className="field">
          <span className="field__label">Paciente</span>
          <input
            className="field__input"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            required
            maxLength={200}
          />
        </label>
        <label className="field">
          <span className="field__label">Telefone</span>
          <input
            className="field__input"
            value={patientPhone}
            onChange={(event) => setPatientPhone(event.target.value)}
            required
            maxLength={40}
          />
        </label>
        <label className="field">
          <span className="field__label">E-mail (opcional)</span>
          <input
            className="field__input"
            type="email"
            value={patientEmail}
            onChange={(event) => setPatientEmail(event.target.value)}
          />
        </label>
        <label className="field field--short">
          <span className="field__label">Nascimento (opcional)</span>
          <input
            className="field__input"
            type="date"
            value={patientBirthDate}
            onChange={(event) => setPatientBirthDate(event.target.value)}
          />
        </label>
        <button type="submit" className="button button--secondary" disabled={saving}>
          Cadastrar paciente
        </button>
      </form>

      <form
        className="form form--inline"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(
            () =>
              createProfessional({
                name: professionalName.trim(),
                specialtyId: professionalSpecialtyId || null,
              }),
            'Profissional cadastrado.',
            () => {
              setProfessionalName('');
              setProfessionalSpecialtyId('');
            },
          );
        }}
      >
        <label className="field">
          <span className="field__label">Profissional</span>
          <input
            className="field__input"
            value={professionalName}
            onChange={(event) => setProfessionalName(event.target.value)}
            required
            maxLength={200}
          />
        </label>
        <label className="field">
          <span className="field__label">Especialidade</span>
          <select
            className="field__input"
            value={professionalSpecialtyId}
            onChange={(event) => setProfessionalSpecialtyId(event.target.value)}
          >
            <option value="">Sem especialidade</option>
            {specialties.map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="button button--secondary" disabled={saving}>
          Cadastrar profissional
        </button>
      </form>

      <form
        className="form form--inline"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(
            () =>
              createAppointmentType({
                name: typeName.trim(),
                category: typeCategory,
                coverage: typeCoverage,
                durationMinutes: Number(durationMinutes),
                specialtyId: typeSpecialtyId || null,
              }),
            'Tipo de consulta cadastrado.',
            () => {
              setTypeName('');
              setTypeSpecialtyId('');
            },
          );
        }}
      >
        <label className="field">
          <span className="field__label">Tipo de consulta</span>
          <input
            className="field__input"
            value={typeName}
            onChange={(event) => setTypeName(event.target.value)}
            required
            maxLength={200}
          />
        </label>
        <label className="field field--short">
          <span className="field__label">Natureza</span>
          <select
            className="field__input"
            value={typeCategory}
            onChange={(event) => setTypeCategory(event.target.value)}
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
            value={typeCoverage}
            onChange={(event) => setTypeCoverage(event.target.value)}
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
            value={typeSpecialtyId}
            onChange={(event) => setTypeSpecialtyId(event.target.value)}
          >
            <option value="">Sem especialidade</option>
            {specialties.map((specialty) => (
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
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="button button--secondary" disabled={saving}>
          Cadastrar tipo
        </button>
      </form>
    </section>
  );
}
