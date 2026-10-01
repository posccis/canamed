import { useState } from 'react';

import { createBlock } from './agendaApi';
import { describeError } from './agendaErrors';
import { localInputToUtcIso } from './agendaFormat';

type BlockFormProps = {
  professionalId: string;
  defaultDate: string;
  onCreated: () => void;
  onClose: () => void;
};

/** Bloqueio de agenda do profissional (RN-011). */
export function BlockForm({ professionalId, defaultDate, onCreated, onClose }: BlockFormProps) {
  const [start, setStart] = useState(`${defaultDate}T12:00`);
  const [end, setEnd] = useState(`${defaultDate}T13:00`);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startsAt = localInputToUtcIso(start);
    const endsAt = localInputToUtcIso(end);

    if (!startsAt || !endsAt) {
      setError('Informe o início e o fim do bloqueio.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createBlock(professionalId, { startsAt, endsAt, reason: reason.trim() || null });
      onCreated();
    } catch (reason_: unknown) {
      setError(describeError(reason_));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Início do bloqueio</span>
        <input
          className="field__input"
          type="datetime-local"
          value={start}
          onChange={(event) => setStart(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Fim do bloqueio</span>
        <input
          className="field__input"
          type="datetime-local"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Motivo (opcional)</span>
        <input
          className="field__input"
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
        />
      </label>

      {error ? (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="form__actions">
        <button type="button" className="button button--ghost" onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? 'Bloqueando…' : 'Bloquear horário'}
        </button>
      </div>
    </form>
  );
}
