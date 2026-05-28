import type { ApiErrorResponse } from '@droxyde/types';

import { env } from './env';

export class ApiError extends Error {
  status: number;
  payload: ApiErrorResponse;

  constructor(payload: ApiErrorResponse) {
    const msg = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
    super(msg || 'API error');
    this.name = 'ApiError';
    this.status = payload.statusCode;
    this.payload = payload;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  baseUrl?: string;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, baseUrl, headers, ...rest } = options;
  const url = `${(baseUrl ?? env.apiUrl).replace(/\/$/, '')}/api${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      Accept: 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    throw new ApiError(
      (data as ApiErrorResponse) ?? { statusCode: res.status, message: res.statusText },
    );
  }

  return data as T;
}
