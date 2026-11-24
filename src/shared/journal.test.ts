import { describe, expect, test } from 'bun:test'

import {
  JOURNAL_COLUMNS,
  calendarMonth,
  journalAnalytics,
  journalFilename,
  manualRow,
  migrateDayNotes,
  migrateJournal,
  parseJournalBundle,
  rowFromVerdict,
  shiftMonth,
  toCsv,
  toJournalJson,
  upsertDayNote,
  weekSummary,
} from './journal'
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

describe('a row written by hand', () => {
  const manual = manualRow({
    date: '2026-11-19',
    symbol: 'aapl',
    setup: 'manual',
    entryCents: 20_000,
    stopCents: 19_500,
    targetCents: 21_000,
    size: 10,
    note: 'bought the reclaim',
    tags: ['A+', 'a+', ' news'],
  })

  test('is MANUAL, never a gate approval', () => {
    expect(manual?.verdict).toBe('MANUAL')
    expect(manual?.source).toBe('manual')
    expect(manual?.took).toBe(true)
    expect(manual?.gateRule).toBe('')
    expect(manual?.symbol).toBe('AAPL')
  })

  test('takes its R plan from its own levels, and dedupes tags', () => {
    expect(manual?.rPlanned).toBe('2.00')
    expect(manual?.tags).toEqual(['A+', 'news'])
    expect(manual?.rResult).toBeNull()
  })

  test('refuses levels that are not a long', () => {
    expect(manualRow({ date: '2026-11-19', symbol: 'TSLA', setup: 'manual', entryCents: 100, stopCents: 120, targetCents: 140, size: 1 })).toBeNull()
    expect(manualRow({ date: '2026-11-19', symbol: 'TSLA', setup: 'manual', entryCents: 100, stopCents: 90, targetCents: 95, size: 1 })).toBeNull()
  })
})

describe('the stored shape moves forward', () => {
  test('a row from before tags and source keeps working', () => {
    const [old] = migrateJournal([
      { tradeId: 'x1', date: '2026-11-19', session: 'open', symbol: 'tsla', setup: 'orb', verdict: 'BLOCKED', gateRule: 'R-12', took: false, size: 0, note: 'n' },
    ])
    expect(old.symbol).toBe('TSLA')
    expect(old.tags).toEqual([])
    expect(old.source).toBe('gate')
    expect(old.editedAt).toBeNull()
    expect(old.rulesFollowed).toBe(true)
  })

  test('junk and rows without a trade id are dropped, not fatal', () => {
    expect(migrateJournal(null)).toEqual([])
    expect(migrateJournal([{ date: '2026-11-19' }, 'nope', 42])).toEqual([])
  })

  test('a manual verdict implies the manual source', () => {
    const [row] = migrateJournal([{ tradeId: 'm1', date: '2026-11-19', symbol: 'NVDA', verdict: 'MANUAL' }])
    expect(row.source).toBe('manual')
    expect(row.setup).toBe('manual')
  })

  test('day notes are cleaned, sorted and empty ones dropped', () => {
    const notes = migrateDayNotes([
      { date: '2026-11-19', note: 'b', updatedAt: '2026-11-19T21:00:00.000Z' },
      { date: '2026-11-18', note: 'a', updatedAt: '2026-11-18T21:00:00.000Z' },
      { date: '2026-11-17', note: '   ', updatedAt: '2026-11-17T21:00:00.000Z' },
    ])
    expect(notes.map((n) => n.date)).toEqual(['2026-11-18', '2026-11-19'])
    expect(upsertDayNote(notes, '2026-11-19', '   ').map((n) => n.date)).toEqual(['2026-11-18'])
  })
})

describe('the calendar', () => {
  const rows = [
    row({ tradeId: 'a', date: '2026-11-19', rResult: 2 }),
    row({ tradeId: 'b', date: '2026-11-19', rResult: -1 }),
    row({ tradeId: 'c', date: '2026-11-18', verdict: 'BLOCKED', gateRule: 'R-12', took: false, size: 0, rResult: 0 }),
  ]
  const month = calendarMonth(rows, 2026, 10, '2026-11-19')

  test('is six Monday-first weeks, so the grid never jumps', () => {
    expect(month.weeks).toHaveLength(6)
    expect(month.weeks.every((w) => w.length === 7)).toBe(true)
    expect(month.label).toBe('November 2026')
  })

  test('buckets rows by their own session date, with closed R only', () => {
    const day = month.weeks.flat().find((d) => d.date === '2026-11-19')
    expect(day).toMatchObject({ inMonth: true, isToday: true, rows: 2, taken: 2, closed: 2, sumR: 1 })
    const blockedDay = month.weeks.flat().find((d) => d.date === '2026-11-18')
    expect(blockedDay).toMatchObject({ rows: 1, taken: 0, closed: 0, sumR: 0 })
  })

  test('pads with the neighbouring month and totals only its own days', () => {
    expect(month.weeks[0][0]).toMatchObject({ date: '2026-10-26', inMonth: false })
    expect(month.totals).toEqual({ rows: 3, taken: 2, closed: 2, sumR: 1 })
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
  })
})

describe('analytics', () => {
  // Newest first, as the store keeps them: +2 newest, -1 oldest.
  const results = [2, -1, -1, 2, 1, -1, 2, -1, 2, 2, 1, -1]
  const rows = results.map((r, i) => row({ tradeId: `t${i}`, rResult: r }))

  test('reads the rows in the order they happened', () => {
    const a = journalAnalytics(rows)
    expect(a.closed).toBe(12)
    expect(a.tooSmall).toBe(false)
    expect(a.expectancyR).toBe(0.58)
    expect(a.profitFactor).toBe(2.4)
    // Cumulative R runs −1, 0, 2, 4, 3, 5, 4, 5, 7, 6, 5, 7: the worst fall from a peak is 2.
    expect(a.maxDrawdownR).toBe(2)
    expect(a.currentStreak).toEqual({ kind: 'win', length: 1 })
    expect(a.winRate.n).toBe(12)
    expect(a.bySymbol[0]).toMatchObject({ key: 'TSLA', closed: 12, sumR: 7 })
  })

  test('below ten closed trades it will not print a rate or a factor', () => {
    const a = journalAnalytics(rows.slice(0, 4))
    expect(a.tooSmall).toBe(true)
    expect(a.expectancyR).toBeNull()
    expect(a.profitFactor).toBeNull()
    expect(a.winRate.reliable).toBe(false)
    // The drawdown is still arithmetic — it just is not presented as an edge.
    expect(a.maxDrawdownR).toBe(2)
  })

  test('blocked rows are counted by the rule that refused them', () => {
    const a = journalAnalytics([
      row({ tradeId: 'b1', verdict: 'BLOCKED', gateRule: 'R-12', took: false, rResult: 0 }),
      row({ tradeId: 'b2', verdict: 'BLOCKED', gateRule: 'R-12', took: false, rResult: 0 }),
      row({ tradeId: 'b3', verdict: 'BLOCKED', gateRule: 'R-04', took: false, rResult: 0 }),
    ])
    expect(a.blocksByRule).toEqual([
      { ruleId: 'R-12', count: 2 },
      { ruleId: 'R-04', count: 1 },
    ])
  })
})

describe('the backup file', () => {
  const notes = [{ date: '2026-11-19', note: 'patience', updatedAt: '2026-11-19T21:00:00.000Z' }]

  test('round-trips rows and day notes', () => {
    const parsed = parseJournalBundle(toJournalJson([row()], notes, '2026-11-19T22:00:00.000Z'))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.rows).toHaveLength(1)
    expect(parsed.dayNotes).toEqual(notes)
  })

  test('a bare array of rows is accepted', () => {
    const parsed = parseJournalBundle(JSON.stringify([row()]))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.dayNotes).toEqual([])
  })

  test('refuses a file that is not a journal', () => {
    expect(parseJournalBundle('not json')).toEqual({ ok: false, error: 'That file is not JSON. Pick the .json export from this page.' })
    expect(parseJournalBundle('{"rows": []}').ok).toBe(false)
    expect(parseJournalBundle('{"hello": 1}').ok).toBe(false)
  })

  test('the CSV is still the seventeen documented columns', () => {
    expect(toCsv([]).split('\n')[0]).toBe(JOURNAL_COLUMNS.join(','))
    expect(toCsv([row()]).split('\n')[1].split(',').length).toBe(17)
  })
})
