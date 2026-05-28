import type { PublicUser } from './user.js';
export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}
export interface LoginPayload {
  email: string;
  password: string;
}
export interface AuthResponse {
  user: PublicUser;
}
export interface SessionInfo {
  authenticated: boolean;
  user: PublicUser | null;
}
//# sourceMappingURL=auth.d.ts.map
