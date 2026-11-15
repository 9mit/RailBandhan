export type AppErrorCode =
  | "unauthorized"
  | "forbidden"
  | "validation"
  | "not_found"
  | "rate_limited"
  | "conflict"
  | "internal"
  | "unavailable"
  | "payload_too_large";

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  validation: 400,
  not_found: 404,
  rate_limited: 429,
  conflict: 409,
  internal: 500,
  unavailable: 503,
  payload_too_large: 413,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}
