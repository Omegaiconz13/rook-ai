import { AUDIT_MAX_ROWS } from './types'
import type { Tier } from './types'

/*
  The audit log. Every turn writes one row, every tool call writes another, and
  they all carry the turn's `trace_id`, so a reader can open `/trace` and see the
  routing, the tools, the tiers, the blocks and the spend behind an answer. The
  log is a ring buffer in the browser: 500 rows, newest first, no network.
*/

export type AuditStatus = 'ok' | 'blocked' | 'error' | 'pending'

export type AuditRow = {
  id: string
  traceId: string
  /** ISO timestamp. */
  at: string
  kind: 'turn' | 'tool' | 'confirm'
  question: string
  skills: string[]
  tool: string | null
  tier: Tier | null
  status: AuditStatus
  /** The gate's block code, when the call was refused. */
  blocked: string | null
  ms: number | null
  steps: number | null
  tokensIn: number | null
  tokensOut: number | null
  refs: string[]
}

export function appendAudit(rows: AuditRow[], row: AuditRow): AuditRow[] {
  return [row, ...rows].slice(0, AUDIT_MAX_ROWS)
}

export function auditFor(rows: AuditRow[], traceId: string): AuditRow[] {
  return rows.filter((row) => row.traceId === traceId)
}

/** The newest trace, for `/trace` when no id is given. */
export function lastTrace(rows: AuditRow[]): string | null {
  return rows.length > 0 ? rows[0].traceId : null
}
