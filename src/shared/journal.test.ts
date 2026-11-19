import { describe, expect, test } from 'bun:test'

import { JOURNAL_COLUMNS, journalFilename, rowFromVerdict, toCsv, weekSummary } from './journal'
import type { JournalRow } from './journal'
import type { GateVerdict, SessionInfo, TradePlan } from './risk'

const plan: TradePlan = {
  id: 'plan-tsla',
  symbol: 'TSLA',
  direction: 'long',
  entryCents: 36_418,
  stopCents: 35_832,
  targetCents: 37_590,
  riskPerShareCents: 586,
  rMultiple: 2,
  setupId: 'TSLA-orb',
  status: 'draft',
  provenance: 'seed',
}

const session: SessionInfo = { state: 'open', nowEt: '10:12' }

const approved: GateVerdict = {
  planId: 'plan-tsla',
  verdict: 'approved',
  ruleId: null,
  reason: 'Approved 6 shares; position cap set the size.',
  size: 6,
  decidingLimit: 'position-cap',
  lossAtStopCents: 3516,
  rewardRisk: 2,
}

const blocked: GateVerdict = {
  planId: 'plan-tsla',
  verdict: 'blocked',
  ruleId: 'R-12',
  reason: 'Reward:risk is 1.00, below your 1.50 minimum.',
  size: null,
  decidingLimit: null,
  lossAtStopCents: null,
  rewardRisk: 1,
}

function row(over: Partial<JournalRow> = {}): JournalRow {
  return { ...rowFromVerdict({ plan, verdict: approved, sessionDate: '2026-11-19', session, setupFamily: 'orb', took: true }), ...over }
}

describe('rows', () => {
  test('an approved, taken plan records a size and no result yet', () => {
    const r = rowFromVerdict({ plan, verdict: approved, sessionDate: '2026-11-19', session, setupFamily: 'orb', took: true })
    expect(r.size).toBe(6)
    expect(r.took).toBe(true)
    expect(r.rResult).toBeNull()
    expect(r.rPlanned).toBe('2.00')
    expect(r.verdict).toBe('APPROVED')
  })
  test('a blocked plan records size 0 and is never "took"', () => {
    const r = rowFromVerdict({ plan, verdict: blocked, sessionDate: '2026-11-19', session, setupFamily: 'orb', took: true })
    expect(r.size).toBe(0)
    expect(r.took).toBe(false)
    expect(r.gateRule).toBe('R-12')
    expect(r.rResult).toBe(0)
  })
})

describe('csv', () => {
  test('the header is the documented column order', () => {
    expect(toCsv([]).split('\n')[0]).toBe(JOURNAL_COLUMNS.join(','))
  })
  test('a comma, a quote and a newline are all quoted and escaped', () => {
    const csv = toCsv([row({ note: 'sold early, "just in case"\nsecond line' })])
    expect(csv).toContain('"sold early, ""just in case""\nsecond line"')
  })
  test('boolean and null cells stay plain', () => {
    const line = toCsv([row()]).split('\n')[1]
    expect(line).toContain(',true,')
    expect(line.endsWith(',')).toBe(true) // memo_id is null
  })
  test('the filename carries the session date', () => {
    expect(journalFilename('2026-11-19')).toBe('rook-journal-2026-11-19.csv')
  })
})

describe('week summary', () => {
  test('under ten rows it refuses to read a pattern', () => {
    const s = weekSummary([row(), row({ gateRule: 'R-12', verdict: 'BLOCKED', took: false, size: 0 })])
    expect(s.tooSmall).toBe(true)
    expect(s.suggestion).toContain('Sample too small')
  })
  test('counts taken, blocked and sums the closed R', () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => row({ tradeId: `t${i}`, rResult: i % 2 === 0 ? 2 : -1 })),
      row({ tradeId: 'b1', verdict: 'BLOCKED', took: false, size: 0, rResult: 0, gateRule: 'R-12' }),
    ]
    const s = weekSummary(rows)
    expect(s.total).toBe(11)
    expect(s.taken).toBe(10)
    expect(s.blocked).toBe(1)
    expect(s.closed).toBe(10)
    expect(s.sumR).toBe(5)
  })
  test('names the rule that blocked most often', () => {
    const rows = [
      ...Array.from({ length: 9 }, (_, i) => row({ tradeId: `t${i}` })),
      row({ tradeId: 'b1', verdict: 'BLOCKED', took: false, size: 0, gateRule: 'R-12' }),
      row({ tradeId: 'b2', verdict: 'BLOCKED', took: false, size: 0, gateRule: 'R-12' }),
      row({ tradeId: 'b3', verdict: 'BLOCKED', took: false, size: 0, gateRule: 'R-04' }),
    ]
    const s = weekSummary(rows)
    expect(s.blocksByRule[0]).toEqual({ ruleId: 'R-12', count: 2 })
    expect(s.suggestion).toContain('R-12')
  })
  test('a broken rule outranks the block counts', () => {
    const rows = [
      ...Array.from({ length: 10 }, (_, i) => row({ tradeId: `t${i}`, rulesFollowed: i === 0 ? false : true })),
      row({ tradeId: 'b1', verdict: 'BLOCKED', took: false, size: 0, gateRule: 'R-12' }),
    ]
    const s = weekSummary(rows)
    expect(s.ruleBreaks).toBe(1)
    expect(s.suggestion).toContain('broke a written rule')
  })
})
