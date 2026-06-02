// URL бекенд сервера
// Для локального запуску використовуємо localhost
export const API_URL = import.meta.env.VITE_API_URL || '';

type ApiRequestOptions = {
  method?: string;
  token?: string | null;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function joinUrl(base: string, path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!base) return p;
  return `${base.replace(/\/+$/, '')}${p}`;
}

async function readResponsePayload(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

function payloadMessage(payload: any) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  return (
    payload.message ||
    payload.msg ||
    payload.error ||
    payload.details ||
    ''
  );
}

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const { method = 'GET', token, headers = {}, body, signal } = options;
  const finalHeaders: Record<string, string> = { ...headers };

  if (token) finalHeaders['x-auth-token'] = token;

  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  return fetch(joinUrl(API_URL, path), {
    method,
    headers: finalHeaders,
    body: finalBody,
    signal
  });
}

export async function apiJson<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const res = await apiRequest(path, options);
  const payload = await readResponsePayload(res);
  if (!res.ok) {
    const message = payloadMessage(payload) || `HTTP ${res.status}`;
    throw new ApiError(message, res.status, payload);
  }
  return payload as T;
}
