'use client';

import type { AuthResponse, LoginPayload, RegisterPayload, SessionInfo } from '@droxyde/types';

import { apiFetch } from './api';

export const authClient = {
  register(payload: RegisterPayload) {
    return apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: payload });
  },
  login(payload: LoginPayload) {
    return apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: payload });
  },
  logout() {
    return apiFetch<void>('/auth/logout', { method: 'POST' });
  },
  me() {
    return apiFetch<SessionInfo>('/auth/me');
  },
  deleteAccount() {
    return apiFetch<void>('/auth/me', { method: 'DELETE' });
  },
};
