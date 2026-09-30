const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** Erro de API no formato Problem Details (RFC 7807). */
export class ApiError extends Error {
  public readonly status: number;

  public readonly traceId: string | undefined;

  public constructor(status: number, title: string, traceId?: string) {
    super(title);
    this.name = 'ApiError';
    this.status = status;
    this.traceId = traceId;
  }
}

type ProblemDetails = {
  title?: string;
  traceId?: string;
};

/**
 * Executa um GET na API do CANAMED.
 * Os tipos de retorno devem passar a vir do OpenAPI gerado pelo backend (RN-004).
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    const problem = await readProblem(response);

    throw new ApiError(
      response.status,
      problem.title ?? 'Não foi possível concluir a operação.',
      problem.traceId,
    );
  }

  return (await response.json()) as T;
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return {};
  }
}
