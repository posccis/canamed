import { useState } from 'react';

import { cancelAppointment, rescheduleAppointment, type Appointment } from './agendaApi';
import { describeError, suggestedTimes } from './agendaErrors';
import { formatTimeRange, localInputToUtcIso, toLocalInputValue } from './agendaFormat';
import type { Room } from '../clinics/clinicsApi';

type AppointmentActionsProps = {
  appointment: Appointment;
  mode: 'reschedule' | 'cancel';
  rooms?: Room[];
  onDone: () => void;
  onClose: () => void;
};

/** Fluxos F-002 (remarcar) e F-003 (cancelar com motivo obrigatório). */
export function AppointmentActions({ appointment, mode, rooms = [], onDone, onClose }: AppointmentActionsProps) {
  const [localStart, setLocalStart] = useState(toLocalInputValue(appointment.startsAt));
  const [roomId, setRoomId] = useState(appointment.roomId ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const activeRooms = rooms.filter((r) => r.isActive);

  const resumoSobre = `${appointment.patientName} • ${appointment.appointmentTypeName} • ${formatTimeRange(
    appointment.startsAt,
    appointment.endsAt,
  )}${appointment.roomName ? ` • Sala: ${appointment.roomName}` : ''}`;

  async function handleReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startsAt = localInputToUtcIso(localStart);

    if (!startsAt) {
      setError('Informe a nova data e o novo horário.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuggestions([]);

    try {
      await rescheduleAppointment(appointment.id, startsAt, roomId ? roomId : null);
      onDone();
    } catch (reason_: unknown) {
      setError(describeError(reason_));
      setSuggestions(suggestedTimes(reason_));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reason.trim()) {
      setError('Informe o motivo do cancelamento.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await cancelAppointment(appointment.id, reason.trim());
      onDone();
    } catch (reason_: unknown) {
      setError(describeError(reason_));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={mode === 'reschedule' ? handleReschedule : handleCancel}>
      <p className="form__hint">{resumoSobre}</p>

      {mode === 'reschedule' ? (
        <>
          <label className="field">
            <span className="field__label">Novo horário (horário de Brasília/Fortaleza)</span>
            <input
              className="field__input"
              type="datetime-local"
              value={localStart}
              onChange={(event) => setLocalStart(event.target.value)}
              required
            />
          </label>
          {activeRooms.length > 0 ? (
            <label className="field">
              <span className="field__label">Sala (opcional)</span>
              <select
                className="field__input"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
              >
                <option value="">Sem sala vinculada</option>
                {activeRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : (
        <label className="field">
          <span className="field__label">Motivo do cancelamento</span>
          <textarea
            className="field__input field__input--multiline"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
          />
        </label>
      )}

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
          {suggestions.length > 0 ? (
            <p>Horários livres próximos: {suggestions.join(', ')}.</p>
          ) : null}
        </div>
      ) : null}

      <div className="form__actions">
        <button type="button" className="button button--ghost" onClick={onClose}>
          Voltar
        </button>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? 'Salvando…' : mode === 'reschedule' ? 'Confirmar remarcação' : 'Confirmar cancelamento'}
        </button>
      </div>
    </form>
  );
}
