import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('apiFetch', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test';
    vi.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('throws ApiError when the response is not ok', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ statusCode: 401, message: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const { apiFetch, ApiError } = await import('./api');
    await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it('returns the parsed body on success', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { apiFetch } = await import('./api');
    const result = await apiFetch<{ ok: boolean }>('/health');
    expect(result).toEqual({ ok: true });
  });
});
