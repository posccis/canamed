import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiGet } from './client';

describe('apiGet', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna o corpo quando a resposta é bem-sucedida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'healthy' }),
    }));

    await expect(apiGet<{ status: string }>('/health/live')).resolves.toEqual({ status: 'healthy' });
  });

  it('lança ApiError com o título do Problem Details quando a resposta falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ title: 'Serviço indisponível', traceId: 'trace-123' }),
    }));

    const error = await apiGet('/health/ready').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(503);
    expect((error as ApiError).message).toBe('Serviço indisponível');
    expect((error as ApiError).traceId).toBe('trace-123');
  });

  it('usa mensagem padrão quando o corpo não é Problem Details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('corpo inválido');
      },
    }));

    const error = await apiGet('/health/ready').catch((reason: unknown) => reason);

    expect((error as ApiError).message).toBe('Não foi possível concluir a operação.');
  });
});
