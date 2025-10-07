// src/lib/request.ts
import type { AxiosResponse } from "axios";
import { toApiError, getRetryAfterMs } from "./https";
import { ApiError } from "./error";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type CallOpts<T> = {
  validate?: (data: unknown) => T;  // (z) => z.parse(data)
  retries?: number;                 // default 2 for idempotent GETs
  idempotent?: boolean;             // only retry when true
  signal?: AbortSignal;             // for cancellation
};

/**
 * Wrap an axios call with:
 * - retry/backoff on network/5xx/429 (idempotent only)
 * - 429 Retry-After support
 * - error normalization
 * - optional zod validation
 */
export async function request<T>(
  op: () => Promise<AxiosResponse<any>>,
  { validate, retries = 2, idempotent = false }: CallOpts<T> = {}
): Promise<T> {
  let attempt = 0;

  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      const res = await op();
      const data = res.status === 204 ? undefined : res.data;
      return validate ? validate(data) : (data as T);
    } catch (e) {
      const err = toApiError(e);

      // Abort? (axios throws DOMException when aborted)
      // If you pass AbortController to axios via `signal`, axios will throw a CanceledError.
      if ((e as any).name === "CanceledError") throw err;

      // Retry rules (idempotent only)
      const canRetry =
        idempotent &&
        (err.code === "NETWORK" ||
         err.code === "TIMEOUT" ||
         err.code === "SERVER" ||
         err.code === "RATE_LIMITED");

      if (!canRetry || attempt >= retries) throw err;

      attempt++;

      // 429 respect Retry-After
      let delay = 250 * Math.pow(2, attempt - 1); // expo backoff
      if (err.code === "RATE_LIMITED") {
        const ra = getRetryAfterMs((e as any));
        delay = Math.max(delay, ra);
      }
      await sleep(delay);
    }
  }
}