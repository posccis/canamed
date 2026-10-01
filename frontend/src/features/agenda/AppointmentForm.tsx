import { useState } from 'react';

import { createAppointment, type AppointmentType, type Patient, type Professional } from './agendaApi';
import { describeError, suggestedTimes } from './agendaErrors';
import { localInputToUtcIso } from './agendaFormat';
import { describeClassification } from '../catalog/catalogLabels';

type AppointmentFormProps = {
  professionals: Professional[];
  patients: Patient[];
  appointmentTypes: AppointmentType[];
  defaultProfessionalId: string;
  defaultDate: string;
  onCreated: () => void;
  onRegistered: () => void;
  onCancel: () => void;
};

/** Fluxo F-001: criar agendamento informando paciente, tipo de atendimento e horário. */
export function AppointmentForm({
  professionals,
  patients,
  appointmentTypes,
  defaultProfessionalId,
  defaultDate,
  onCreated,
  onRegistered,
  onCancel,
}: AppointmentFormProps) {
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId);
  const activePatients = patients.filter((patient) => patient.isActive);
  const activeTypes = appointmentTypes.filter((type) => type.isActive);
  const [patientId, setPatientId] = useState(activePatients[0]?.id ?? '');
  const [appointmentTypeId, setAppointmentTypeId] = useState(activeTypes[0]?.id ?? '');
  const [localStart, setLocalStart] = useState(`${defaultDate}T14:00`);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedType = activeTypes.find((type) => type.id === appointmentTypeId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startsAt = localInputToUtcIso(localStart);

    if (!startsAt) {
      setError('Informe a data e o horário do atendimento.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuggestions([]);

    try {
      await createAppointment({ professionalId, patientId, appointmentTypeId, startsAt });
      onCreated();
    } catch (reason: unknown) {
      setError(describeError(reason));
      setSuggestions(suggestedTimes(reason));
    } finally {
      setSaving(false);
    }
  }

  const semCadastro =
    activePatients.length === 0 || activeTypes.length === 0 || professionals.length === 0;

  return (
    <form className="form" onSubmit={handleSubmit}>
      {semCadastro ? (
        <p className="form__hint">
          Cadastre ao menos um profissional, um paciente e um tipo de atendimento para agendar.
        </p>
      ) : null}

      <label className="field">
        <span className="field__label">Profissional</span>
        <select
          className="field__input"
          value={professionalId}
          onChange={(event) => setProfessionalId(event.target.value)}
          required
        >
          {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
              {professional.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Paciente</span>
        <select
          className="field__input"
          value={patientId}
          onChange={(event) => setPatientId(event.target.value)}
          required
        >
          {activePatients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Tipo de atendimento</span>
        <select
          className="field__input"
          value={appointmentTypeId}
          onChange={(event) => setAppointmentTypeId(event.target.value)}
          required
        >
          {activeTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} — {Number(type.durationMinutes)} min ·{' '}
              {describeClassification(type.category, type.coverage, type.specialtyName)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span className="field__label">Data e hora (horário de Brasília/Fortaleza)</span>
        <input
          className="field__input"
          type="datetime-local"
          value={localStart}
          onChange={(event) => setLocalStart(event.target.value)}
          required
        />
      </label>

      {selectedType ? (
        <p className="form__hint">Duração do atendimento: {Number(selectedType.durationMinutes)} minutos.</p>
      ) : null}

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
          {suggestions.length > 0 ? (
            <p>Horários livres próximos: {suggestions.join(', ')}.</p>
          ) : null}
        </div>
      ) : null}

      <div className="form__actions">
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="button button--link" onClick={onRegistered}>
          Cadastrar paciente
        </button>
        <button type="submit" className="button button--primary" disabled={saving || semCadastro}>
          {saving ? 'Agendando…' : 'Agendar'}
        </button>
      </div>
    </form>
  );
}
