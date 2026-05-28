import { cookies } from 'next/headers';
import type { SessionInfo } from '@droxyde/types';

import { env } from './env';

/**
 * Server-side session lookup. Forwards the incoming cookie header to the API
 * (`/api/auth/me`) so we can render protected pages without exposing tokens.
 */
export async function getServerSession(): Promise<SessionInfo> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    const res = await fetch(`${env.apiInternalUrl.replace(/\/$/, '')}/api/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return { authenticated: false, user: null };
    return (await res.json()) as SessionInfo;
  } catch {
    return { authenticated: false, user: null };
  }
}
