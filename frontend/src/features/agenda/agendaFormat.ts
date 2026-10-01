/** Fuso horário oficial de exibição (RN-010 da SPEC-0002). */
export const clinicTimeZone = 'America/Fortaleza';

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: clinicTimeZone,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dayFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: clinicTimeZone,
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: clinicTimeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
};

/** Rótulo em português para o status do agendamento. */
export function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

/** Horário (HH:mm) no fuso da clínica. */
export function formatTime(isoDateTime: string): string {
  return timeFormatter.format(new Date(isoDateTime));
}

/** Intervalo legível, por exemplo "14:00 – 14:30". */
export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${formatTime(startsAt)} – ${formatTime(endsAt)}`;
}

/** Data por extenso no fuso da clínica, a partir de "yyyy-MM-dd". */
export function formatDayLabel(date: string): string {
  const reference = new Date(`${date}T12:00:00Z`);

  return dayFormatter.format(reference);
}

/** Data de hoje (yyyy-MM-dd) no fuso da clínica. */
export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Converte um instante ISO em valor para o campo datetime-local. */
export function toLocalInputValue(isoDateTime: string): string {
  const parts = readParts(new Date(isoDateTime));

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * Converte um valor de datetime-local (hora local da clínica) no instante UTC esperado pela API.
 * Retorna null quando o valor não está no formato esperado.
 */
export function localInputToUtcIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const asUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  const offset = timeZoneOffsetMilliseconds(new Date(asUtc));

  return new Date(asUtc - offset).toISOString();
}

/** Data (yyyy-MM-dd) no fuso da clínica a partir de um instante UTC. */
export function toClinicIsoDate(isoDateTime: string): string {
  return toIsoDate(new Date(isoDateTime));
}

function toIsoDate(date: Date): string {
  const parts = readParts(date);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function readParts(date: Date): Record<string, string> {
  const parts = partsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '00';

  const hour = read('hour') === '24' ? '00' : read('hour');

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour,
    minute: read('minute'),
  };
}

function timeZoneOffsetMilliseconds(date: Date): number {
  const parts = readParts(date);
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );

  return asUtc - date.getTime();
}
