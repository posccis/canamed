import { describe, expect, it } from 'vitest';

import {
  formatDayLabel,
  formatTime,
  formatTimeRange,
  localInputToUtcIso,
  statusLabel,
  toLocalInputValue,
  toClinicIsoDate,
} from './agendaFormat';

describe('agendaFormat', () => {
  it('exibe o horário no fuso America/Fortaleza (UTC-3)', () => {
    expect(formatTime('2026-10-01T17:00:00Z')).toBe('14:00');
  });

  it('monta o intervalo do atendimento', () => {
    expect(formatTimeRange('2026-10-01T17:00:00Z', '2026-10-01T17:30:00Z')).toBe('14:00 – 14:30');
  });

  it('descreve o dia por extenso', () => {
    const label = formatDayLabel('2026-10-01');

    expect(label).toContain('2026');
    expect(label).toContain('outubro');
  });

  it('converte a hora local da clínica para UTC antes de enviar à API', () => {
    expect(localInputToUtcIso('2026-10-01T14:00')).toBe('2026-10-01T17:00:00.000Z');
  });

  it('recusa valor de data e hora fora do formato esperado', () => {
    expect(localInputToUtcIso('01/10/2026 14:00')).toBeNull();
  });

  it('preenche o campo de data e hora a partir de um instante UTC', () => {
    expect(toLocalInputValue('2026-10-01T17:00:00Z')).toBe('2026-10-01T14:00');
  });

  it('extrai a data da clínica a partir de um instante UTC', () => {
    expect(toClinicIsoDate('2026-10-02T01:00:00Z')).toBe('2026-10-01');
  });

  it('traduz o status do agendamento', () => {
    expect(statusLabel('faltou')).toBe('Faltou');
    expect(statusLabel('agendado')).toBe('Agendado');
  });
});
