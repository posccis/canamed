const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

/** Erro de API no formato Problem Details (RFC 7807). */
export class ApiError extends Error {
  public readonly status: number;

  public readonly traceId: string | undefined;

  public readonly detail: string | undefined;

  public readonly problemType: string | undefined;

  /** Campos adicionais do Problem Details (ex.: horários livres sugeridos em um conflito). */
  public readonly extensions: Record<string, unknown>;

  public constructor(
    status: number,
    title: string,
    options: { traceId?: string; detail?: string; problemType?: string; extensions?: Record<string, unknown> } = {},
  ) {
    super(title);
    this.name = 'ApiError';
    this.status = status;
    this.traceId = options.traceId;
    this.detail = options.detail;
    this.problemType = options.problemType;
    this.extensions = options.extensions ?? {};
  }
}

type ProblemDetails = {
  type?: string;
  title?: string;
  detail?: string;
  traceId?: string;
  [key: string]: unknown;
};

/**
 * Executa um GET na API do CANAMED.
 * Os tipos de retorno vêm do OpenAPI gerado pelo backend (RN-004).
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>('GET', path, undefined, signal);
}

/** Executa um POST com corpo JSON na API do CANAMED. */
export async function apiPost<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>('POST', path, body, signal);
}

/** Executa um PUT com corpo JSON na API do CANAMED. */
export async function apiPut<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>('PUT', path, body, signal);
}

/** Executa um DELETE na API do CANAMED. */
export async function apiDelete<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>('DELETE', path, undefined, signal);
}

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Proteção CSRF da sessão em cookie (RN-016 da SPEC-0003).
    'X-Canamed-Requested-With': 'canamed-spa',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = await readProblem(response);
  const { title, detail, traceId, type, ...extensions } = problem;

  return new ApiError(response.status, title ?? 'Não foi possível concluir a operação.', {
    traceId,
    detail,
    problemType: type,
    extensions,
  });
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return {};
  }
}
