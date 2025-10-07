// src/lib/http.ts
import axios, {AxiosError, AxiosHeaders} from "axios";
import { auth } from './auth';
import { ApiError } from "./error";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000/api",
  withCredentials: false, // flip to true if you use cookie auth
  timeout: 15000,
});

// Automatically attach JWT from storage
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Refresh queue (avoid stampede) ---
let isRefreshing = false;
let queued: Array<(t: string) => void> = [];


function setHeader(cfg: any, key: string, val: string) {
    const h = AxiosHeaders.from(cfg.headers); // normalize whatever is there
    h.set(key, val);
    cfg.headers = h; // put it back as AxiosHeaders
  }

http.interceptors.response.use(
    (r) => r,
    async (err: AxiosError) => {
      const status = err.response?.status;
      const original = err.config!;
      // 429: respect Retry-After if present (handled in caller retry too)
      if (status === 429) throw err;
  
      // 401: try refresh once if we have a refresh token
      if (status === 401 && !AxiosHeaders.from(original.headers).has("x-retried")) {
        setHeader(original, "x-retried", "1");
  
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const { data } = await axios.post(
              `${http.defaults.baseURL}/auth/refresh`,
              { refresh_token: auth.getRefresh() }
            );
            const newAccess = data.access_token as string;
            auth.set({ accessToken: newAccess, refreshToken: auth.getRefresh() || undefined });
            queued.forEach((cb) => cb(newAccess));
            queued = [];
            isRefreshing = false;
            setHeader(original, "Authorization",`Bearer ${newAccess}`);
            return http(original);
          } catch (e) {
            isRefreshing = false;
            queued = [];
            auth.clear();
            throw e;
          }
        }
  
        // Wait for refresh completion
        return new Promise((resolve) => {
          queued.push((newToken) => {
            setHeader(original, "Authorization",`Bearer ${newToken}`);
            resolve(http(original));
          });
        });
      }
  
      throw err;
    }
  );
  
  // Helpers
  export const getRetryAfterMs = (e: AxiosError) => {
    const ra = e.response?.headers?.["retry-after"];
    if (!ra) return 0;
    const asNum = Number(ra);
    if (!Number.isNaN(asNum)) return asNum * 1000;
    const dt = Date.parse(String(ra));
    return Number.isNaN(dt) ? 0 : Math.max(0, dt - Date.now());
  };
  
  export const toApiError = (e: unknown): ApiError => {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      const msg =
        (e.response?.data as any)?.detail ||
        (e.response?.data as any)?.message ||
        e.message ||
        "Request failed";
  
      const requestId = (e.response?.headers?.["x-request-id"] as string | undefined);
  
      if (e.code === "ECONNABORTED") return new ApiError("TIMEOUT", msg, { status, requestId });
      if (!e.response) return new ApiError("NETWORK", "Network error", { requestId });
  
      // Map common statuses
      if (status === 400 || status === 422) return new ApiError("VALIDATION", msg, { status, details: e.response.data, requestId });
      if (status === 401) return new ApiError("UNAUTHORIZED", msg, { status, requestId });
      if (status === 403) return new ApiError("FORBIDDEN", msg, { status, requestId });
      if (status === 404) return new ApiError("NOT_FOUND", msg, { status, requestId });
      if (status === 409) return new ApiError("CONFLICT", msg, { status, requestId });
      if (status === 429) return new ApiError("RATE_LIMITED", msg, { status, requestId });
      if (status && status >= 500) return new ApiError("SERVER", msg, { status, requestId });
  
      return new ApiError("UNKNOWN", msg, { status, requestId });
    }
    return new ApiError("UNKNOWN", (e as any)?.message ?? "Unknown error");
  };
