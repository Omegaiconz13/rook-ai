/*
  One description of what a JSON route can answer with, shared by the Worker that
  writes it and the client that reads it. Before this file the failure shape was a
  literal repeated 18 times and statuses were bare numbers, so a 422 in one route
  and a 400 in another for the same mistake was invisible.
*/

/** The statuses this API actually uses. Anything else is a bug, not a choice. */
export const STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE: 422,
  BAD_GATEWAY: 502,
  UNAVAILABLE: 503,
} as const

export type StatusCode = (typeof STATUS)[keyof typeof STATUS]

/** A refusal. `errors` is per-field, for a form; `detail` is upstream noise. */
export type ApiFailure = {
  ok: false
  error: string
  errors?: Record<string, string>
  detail?: string
}

/** A success. Routes add their own keys beside `data`; every one sets `ok: true`. */
export type ApiResult<T> = { ok: true; data: T } | ApiFailure

/** Build a refusal. The only way the Worker is allowed to write one. */
export function fail(error: string, extra: { errors?: Record<string, string>; detail?: string } = {}): ApiFailure {
  return { ok: false, error, ...extra }
}

export function isFailure(value: unknown): value is ApiFailure {
  return typeof value === 'object' && value !== null && (value as { ok?: unknown }).ok === false
}

/** The error line to show a user for any answer, including a non-JSON one. */
export function errorText(body: unknown): string {
  if (isFailure(body) && typeof body.error === 'string' && body.error.trim()) return body.error
  return 'The desk did not answer. Try again.'
}
