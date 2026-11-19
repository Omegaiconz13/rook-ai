import type { GateVerdict, SessionInfo, TradePlan } from './risk'
import { price } from './sizing'
import type { Rate } from './stats'
import { rateOf } from './stats'

/*
  The journal is the memory of the desk, including the trades it refused.
  Columns are fixed: a reviewer can only spot patterns in columns that are
  filled the same way every day.
*/

export const JOURNAL_COLUMNS = [
  'trade_id', 'date', 'session', 'symbol', 'setup', 'gate_rule', 'verdict', 'took',
  'size', 'entry', 'stop', 'target', 'r_planned', 'r_result', 'rules_followed', 'note', 'memo_id',
] as const

export type JournalRow = {
  tradeId: string
  date: string
  session: SessionInfo['state']
  symbol: string
  setup: string
  gateRule: string
  verdict: 'APPROVED' | 'BLOCKED'
  took: boolean
  size: number
  entry: string
  stop: string
  target: string
  rPlanned: string
  rResult: number | null
  rulesFollowed: boolean
  note: string
  memoId: string | null
}

export function rowFromVerdict(args: {
  plan: TradePlan
  verdict: GateVerdict
  sessionDate: string
  session: SessionInfo
  setupFamily: string
  took?: boolean
  note?: string
}): JournalRow {
  const { plan, verdict, sessionDate, session, setupFamily, took = false, note = '' } = args
  return {
    tradeId: crypto.randomUUID(),
    date: sessionDate,
    session: session.state,
    symbol: plan.symbol,
    setup: setupFamily,
    gateRule: verdict.ruleId ?? '',
    verdict: verdict.verdict === 'approved' ? 'APPROVED' : 'BLOCKED',
    took: verdict.verdict === 'approved' && took,
    size: verdict.size ?? 0,
    entry: price(plan.entryCents),
    stop: price(plan.stopCents),
    target: price(plan.targetCents),
    rPlanned: plan.rMultiple.toFixed(2),
    rResult: verdict.verdict === 'approved' ? null : 0,
    rulesFollowed: verdict.verdict === 'approved',
    note,
    memoId: null,
  }
}

function cell(value: string | number | boolean | null): string {
  if (value === null) return ''
  const s = typeof value === 'boolean' ? String(value) : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export type WeekSummary = {
  total: number
  taken: number
  blocked: number
  closed: number
  ruleBreaks: number
  sumR: number
  blocksByRule: { ruleId: string; count: number }[]
  tooSmall: boolean
  /** Hit rate of closed trades, with its N and Wilson interval. */
  winRate: Rate
  suggestion: string
}

const SAMPLE_FLOOR = 10

/**
 * The weekly review. It reports what happened and suggests at most one change;
 * below ten rows it refuses to read a pattern into the noise.
 */
export function weekSummary(rows: JournalRow[]): WeekSummary {
  const taken = rows.filter((r) => r.took)
  const blocked = rows.filter((r) => r.verdict === 'BLOCKED')
  const closed = taken.filter((r) => r.rResult !== null)
  const sumR = Math.round(closed.reduce((n, r) => n + (r.rResult ?? 0), 0) * 100) / 100
  const ruleBreaks = rows.filter((r) => r.took && !r.rulesFollowed).length

  const counts = new Map<string, number>()
  for (const r of blocked) counts.set(r.gateRule || 'unknown', (counts.get(r.gateRule || 'unknown') ?? 0) + 1)
  const blocksByRule = [...counts.entries()]
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId))

  const closedR = closed.map((r) => r.rResult ?? 0)
  const wins = closedR.filter((r) => r > 0).length
  const winRate = rateOf('Hit rate', wins, closedR.length, closedR.map((r) => r > 0))

  const tooSmall = rows.length < SAMPLE_FLOOR
  const topRule = blocksByRule[0]
  let suggestion: string
  if (tooSmall) {
    suggestion = `Sample too small: ${rows.length} of ${SAMPLE_FLOOR} rows. Keep logging before changing anything.`
  } else if (ruleBreaks > 0) {
    suggestion = `${ruleBreaks} taken ${ruleBreaks === 1 ? 'trade' : 'trades'} broke a written rule. Fix the process before the size.`
  } else if (topRule) {
    suggestion = `${topRule.ruleId} blocked the most trades (${topRule.count}). Check whether the limit or the routine is the problem.`
  } else if (sumR < 0) {
    suggestion = `Open risk is negative at ${sumR.toFixed(2)}R. Cut size, not the stop.`
  } else {
    suggestion = 'Nothing stands out. Repeat the same process next week.'
  }

  return {
    total: rows.length,
    taken: taken.length,
    blocked: blocked.length,
    closed: closed.length,
    ruleBreaks,
    sumR,
    blocksByRule,
    tooSmall,
    winRate,
    suggestion,
  }
}

export function journalFilename(date: string): string {
  return `rook-journal-${date}.csv`
}

export function toCsv(rows: JournalRow[]): string {
  const head = JOURNAL_COLUMNS.join(',')
  const body = rows.map((r) =>
    [
      r.tradeId, r.date, r.session, r.symbol, r.setup, r.gateRule, r.verdict, r.took,
      r.size, r.entry, r.stop, r.target, r.rPlanned, r.rResult, r.rulesFollowed, r.note, r.memoId,
    ].map(cell).join(','),
  )
  return [head, ...body].join('\n')
}
