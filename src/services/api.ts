import { API_BASE_URL } from '../config/api';

type ApiRequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers,
    method: options.method || 'GET',
  });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson && response.status !== 204 ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(data?.message || 'Erro ao comunicar com a API.', response.status, data?.details);
  }

  return data as TResponse;
}
