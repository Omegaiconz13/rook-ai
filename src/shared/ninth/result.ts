import { MAX_RESULT_CHARS } from './types'
import type { ToolOutcome } from './types'

/*
  Tool results. A result is capped at 4,000 characters so one long journal cannot
  crowd the model's window; when it overflows the shape is replaced with the
  truncated JSON and a flag, never silently shortened into invalid data.
*/

export function ok(data: Record<string, unknown>, refs: string[] = []): ToolOutcome {
  const json = JSON.stringify(data)
  if (json.length <= MAX_RESULT_CHARS) return { ok: true, data, refs }

  // `json` is embedded as a string, so its quotes are escaped again: trim until
  // the wrapper itself fits, not just the text it carries.
  let room = MAX_RESULT_CHARS
  let joined = { truncated: true, json: json.slice(0, room) }
  while (JSON.stringify(joined).length > MAX_RESULT_CHARS && room > 0) {
    room = Math.floor(room * 0.8)
    joined = { truncated: true, json: json.slice(0, room) }
  }
  return { ok: true, data: joined, refs }
}

export function fail(why: string, refs: string[] = [], blocked?: string): ToolOutcome {
  return blocked === undefined ? { ok: false, why, refs } : { ok: false, why, refs, blocked }
}
