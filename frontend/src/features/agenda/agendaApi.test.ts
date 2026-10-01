import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '../../api/client';
import { createAppointment, fetchAgendaDay } from './agendaApi';

describe('agendaApi', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('monta a consulta da agenda do dia com data e profissional', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ date: '2026-10-01', appointments: [], blocks: [] }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await fetchAgendaDay('2026-10-01', 'profissional-1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/appointments?date=2026-10-01&professionalId=profissional-1'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('envia o agendamento como JSON no POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'agendamento-1' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await createAppointment({
      professionalId: 'profissional-1',
      patientId: 'paciente-1',
      appointmentTypeId: 'tipo-1',
      startsAt: '2026-10-01T17:00:00.000Z',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        professionalId: 'profissional-1',
        patientId: 'paciente-1',
        appointmentTypeId: 'tipo-1',
        startsAt: '2026-10-01T17:00:00.000Z',
      }),
    );
  });

  it('expõe os horários sugeridos quando a API responde conflito', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        type: 'https://canamed.local/problems/appointment-overlap',
        title: 'Horário ocupado',
        detail: 'Este horário já está ocupado para o profissional selecionado.',
        traceId: 'trace-1',
        suggestions: ['2026-10-01T18:00:00Z', '2026-10-01T18:15:00Z'],
      }),
    }));

    const error = await createAppointment({
      professionalId: 'profissional-1',
      patientId: 'paciente-1',
      appointmentTypeId: 'tipo-1',
      startsAt: '2026-10-01T17:15:00.000Z',
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).detail).toBe('Este horário já está ocupado para o profissional selecionado.');
    expect((error as ApiError).extensions.suggestions).toEqual([
      '2026-10-01T18:00:00Z',
      '2026-10-01T18:15:00Z',
    ]);
  });
});
