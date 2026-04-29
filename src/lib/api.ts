const BASE = `${import.meta.env.BASE_URL}api`;

interface ApiOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, params } = opts;

  let url = `${BASE}${path}`;
  if (params) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '') search.set(k, String(v));
    }
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const init: RequestInit = {
    method,
    cache: 'no-store',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const raw = await res.text();
  let data: unknown = {};

  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new ApiError('Something went wrong — please try again', res.status || 500, raw);
    }
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
      ? data.error
      : res.statusText || 'Something went wrong';
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Convenience methods
export const apiGet = <T = unknown>(path: string, params?: Record<string, string | number | undefined>) =>
  api<T>(path, { params });

export const apiPost = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body });

export const apiPatch = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body });

export const apiDelete = <T = unknown>(path: string, params?: Record<string, string | number | undefined>) =>
  api<T>(path, { method: 'DELETE', params });
