import { useState, useMemo } from 'react';
import { AlertTriangle, Check, Search } from 'lucide-react';

import { createAppointment, type Appointment, type AppointmentType, type Patient, type Professional } from './agendaApi';
import { describeError, suggestedTimes } from './agendaErrors';
import { localInputToUtcIso } from './agendaFormat';
import { describeClassification } from '../catalog/catalogLabels';
import type { Room } from '../clinics/clinicsApi';

type AppointmentFormProps = {
  professionals: Professional[];
  patients: Patient[];
  appointmentTypes: AppointmentType[];
  rooms?: Room[];
  existingAppointments?: Appointment[];
  defaultProfessionalId: string;
  defaultDate: string;
  onCreated: () => void;
  onRegistered: () => void;
  onCancel: () => void;
};

/** Fluxo F-001: criar agendamento informando paciente, tipo de atendimento e horário com Autocomplete e Detecção de Conflitos (SPEC-0035 / Task 15). */
export function AppointmentForm({
  professionals,
  patients,
  appointmentTypes,
  rooms = [],
  existingAppointments = [],
  defaultProfessionalId,
  defaultDate,
  onCreated,
  onRegistered,
  onCancel,
}: AppointmentFormProps) {
  const [professionalId, setProfessionalId] = useState(defaultProfessionalId);
  const activePatients = patients.filter((patient) => patient.isActive);
  const activeTypes = appointmentTypes.filter((type) => type.isActive);
  const activeRooms = rooms.filter((room) => room.isActive);
  const [patientId, setPatientId] = useState(activePatients[0]?.id ?? '');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [appointmentTypeId, setAppointmentTypeId] = useState(activeTypes[0]?.id ?? '');
  const [roomId, setRoomId] = useState('');
  const [localStart, setLocalStart] = useState(`${defaultDate}T14:00`);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const selectedType = activeTypes.find((type) => type.id === appointmentTypeId);
  const selectedPatient = activePatients.find((p) => p.id === patientId);

  // Autocomplete preditivo de pacientes (por nome, CPF ou telefone)
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim() || patientSearchTerm.trim().length < 2) {
      return [];
    }
    const cleanTerm = patientSearchTerm.toLowerCase().trim();
    const cleanDigits = patientSearchTerm.replace(/\D/g, '');

    return activePatients.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(cleanTerm);
      const phoneMatch = cleanDigits.length >= 3 && p.phone ? p.phone.replace(/\D/g, '').includes(cleanDigits) : false;
      const cpfMatch = cleanDigits.length >= 3 && (p as unknown as { cpf?: string }).cpf
        ? (p as unknown as { cpf?: string }).cpf!.replace(/\D/g, '').includes(cleanDigits)
        : false;
      return nameMatch || phoneMatch || cpfMatch;
    });
  }, [patientSearchTerm, activePatients]);

  // Detecção antecipada de conflitos de horário na grade do profissional
  const conflictAppointment = useMemo(() => {
    if (!existingAppointments.length || !professionalId || !localStart) return null;

    try {
      const candidateIso = localInputToUtcIso(localStart);
      if (!candidateIso) return null;
      const candidateStart = new Date(candidateIso).getTime();
      if (isNaN(candidateStart)) return null;

      const durationMinutes = selectedType ? Number(selectedType.durationMinutes) : 30;
      const candidateEnd = candidateStart + durationMinutes * 60000;

      return existingAppointments.find((appt) => {
        if (appt.professionalId !== professionalId || appt.status === 'cancelado') return false;

        const apptStart = new Date(appt.startsAt).getTime();
        const apptEnd = appt.endsAt
          ? new Date(appt.endsAt).getTime()
          : apptStart + 30 * 60000;

        // Sobreposição: candidateStart < apptEnd && candidateEnd > apptStart
        return candidateStart < apptEnd && candidateEnd > apptStart;
      });
    } catch {
      return null;
    }
  }, [existingAppointments, professionalId, localStart, selectedType]);

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
      await createAppointment({
        professionalId,
        patientId,
        appointmentTypeId,
        startsAt,
        roomId: roomId ? roomId : null,
      });
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

      {/* Banner de Aviso de Conflito de Horário */}
      {conflictAppointment && (
        <div
          role="alert"
          style={{
            background: '#FFFBEB',
            border: '1px solid #F59E0B',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            color: '#92400E',
            fontSize: '0.85rem',
            lineHeight: 1.4,
          }}
        >
          <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <strong>Aviso de Conflito de Horário:</strong> O profissional selecionado já possui um agendamento ativo neste horário com <strong>{conflictAppointment.patientName}</strong>.
            <div style={{ fontSize: '0.78rem', marginTop: '2px', color: '#B45309' }}>
              Você pode alterar o horário do atendimento para evitar fila e atrasos.
            </div>
          </div>
        </div>
      )}

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

      {/* Campo Paciente com Autocomplete Preditivo */}
      <div className="field" style={{ position: 'relative' }}>
        <span className="field__label">Paciente (Busca Preditiva)</span>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="field__input"
            placeholder="Buscar paciente por nome, CPF ou telefone..."
            value={patientSearchTerm}
            onChange={(e) => {
              setPatientSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            style={{ paddingRight: '2rem' }}
          />
          <Search size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        </div>

        {/* Dropdown de sugestões preditivas */}
        {isDropdownOpen && filteredPatients.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              zIndex: 50,
              maxHeight: '180px',
              overflowY: 'auto',
              marginTop: '4px',
            }}
          >
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPatientId(p.id);
                  setPatientSearchTerm(p.name);
                  setIsDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.6rem 0.85rem',
                  border: 'none',
                  borderBottom: '1px solid #F1F5F9',
                  background: p.id === patientId ? '#F7ECF8' : '#FFFFFF',
                  color: '#1E293B',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {p.phone || 'Sem telefone'} {(p as unknown as { cpf?: string }).cpf ? `· CPF: ${(p as unknown as { cpf?: string }).cpf}` : ''}
                  </div>
                </div>
                {p.id === patientId && <Check size={16} color="#852A91" />}
              </button>
            ))}
          </div>
        )}

        {/* Fallback de Seleção Direta de Paciente */}
        <select
          className="field__input"
          value={patientId}
          onChange={(event) => {
            setPatientId(event.target.value);
            const found = activePatients.find((p) => p.id === event.target.value);
            if (found) setPatientSearchTerm(found.name);
          }}
          required
          style={{ marginTop: '0.5rem' }}
        >
          {activePatients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name}
            </option>
          ))}
        </select>
        {selectedPatient && (
          <div style={{ fontSize: '0.75rem', color: '#6F217B', marginTop: '0.25rem', fontWeight: 600 }}>
            ✓ Selecionada: {selectedPatient.name}
          </div>
        )}
      </div>

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

      {activeRooms.length > 0 ? (
        <label className="field">
          <span className="field__label">Sala (opcional)</span>
          <select
            className="field__input"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
          >
            <option value="">Nenhuma sala selecionada</option>
            {activeRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

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

