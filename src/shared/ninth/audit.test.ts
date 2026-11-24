import { describe, expect, test } from 'bun:test'

import { appendAudit, auditFor, lastTrace } from './audit'
import type { AuditRow } from './audit'
import { AUDIT_MAX_ROWS } from './types'

const row = (over: Partial<AuditRow> = {}): AuditRow => ({
  id: 'row-1',
  traceId: 'trace-1',
  at: '2026-11-19T14:35:00.000Z',
  kind: 'tool',
  question: 'what is the price?',
  skills: ['desk.core'],
  tool: 'get_quote',
  tier: 1,
  status: 'ok',
  blocked: null,
  ms: 4,
  steps: null,
  tokensIn: null,
  tokensOut: null,
  refs: ['chart:TSLA:5'],
  ...over,
})

describe('the audit log', () => {
  test('keeps the newest row first', () => {
    const rows = appendAudit([], row({ id: 'first' }))
    const next = appendAudit(rows, row({ id: 'second' }))
    expect(next.map((entry) => entry.id)).toEqual(['second', 'first'])
  })

  test('drops the oldest rows at 500', () => {
    let rows: AuditRow[] = []
    for (let i = 0; i < AUDIT_MAX_ROWS + 25; i++) rows = appendAudit(rows, row({ id: `row-${i}` }))
    expect(rows).toHaveLength(AUDIT_MAX_ROWS)
    expect(rows[0].id).toBe(`row-${AUDIT_MAX_ROWS + 24}`)
    expect(rows[AUDIT_MAX_ROWS - 1].id).toBe('row-25')
  })

  test('finds one turn by its trace id, and the newest trace', () => {
    const rows = appendAudit(
      appendAudit([], row({ id: 'a', traceId: 'trace-a' })),
      row({ id: 'b', traceId: 'trace-b' }),
    )
    expect(auditFor(rows, 'trace-a').map((entry) => entry.id)).toEqual(['a'])
    expect(lastTrace(rows)).toBe('trace-b')
    expect(lastTrace([])).toBeNull()
  })
})
