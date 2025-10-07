// src/lib/auth.ts
export type AuthTokens = { accessToken: string; refreshToken?: string };

const ACCESS = "access_token";
const REFRESH = "refresh_token";
const USER   = "current_user";


export const auth = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  set(tokens: AuthTokens) {
    localStorage.setItem(ACCESS, tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem(REFRESH, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },

    // NEW: user persistence
    setUser(user: unknown) {
        try { localStorage.setItem(USER, JSON.stringify(user)); } catch {}
    }, getUser<T = any>(): T | undefined {
        try { const s = localStorage.getItem(USER); return s ? JSON.parse(s) as T : undefined; } catch { return undefined; }
    },
    clearUser() { localStorage.removeItem(USER); },
};