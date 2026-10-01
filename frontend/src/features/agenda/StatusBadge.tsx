import { statusLabel } from './agendaFormat';

/** Indicador visual do status do agendamento (RN-005). */
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge--${status}`}>{statusLabel(status)}</span>;
}
