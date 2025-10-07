// src/lib/errors.ts
export type ApiErrorCode =
  | "NETWORK" | "TIMEOUT" | "UNAUTHORIZED" | "FORBIDDEN"
  | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "VALIDATION"
  | "SERVER" | "UNKNOWN";

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;
  requestId?: string;

  constructor(code: ApiErrorCode, message: string, opts?: {
    status?: number; details?: unknown; requestId?: string;
  }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = opts?.status;
    this.details = opts?.details;
    this.requestId = opts?.requestId;
  }
}
