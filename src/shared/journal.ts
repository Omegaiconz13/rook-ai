import type { GateVerdict, SessionInfo, TradePlan } from './risk'
import { price } from './sizing'
import type { Rate } from './stats'
import { MIN_SAMPLE, rateOf } from './stats'

/*
  The journal is the memory of the desk, including the trades it refused.
  Columns are fixed: a reviewer can only spot patterns in columns that are
  filled the same way every day. Everything else here — the day notes, the
  calendar, the analytics — is derived from those rows rather than stored twice.
*/

export const JOURNAL_COLUMNS = [
  'trade_id', 'date', 'session', 'symbol', 'setup', 'gate_rule', 'verdict', 'took',
  'size', 'entry', 'stop', 'target', 'r_planned', 'r_result', 'rules_followed', 'note', 'memo_id',
] as const

/** Bumped when a row gains fields; `migrateJournal` fills the old shape forward. */
export const JOURNAL_SCHEMA = 2
/** Rows kept in this browser. Older ones are dropped only by the export-first prune. */
export const JOURNAL_MAX_ROWS = 2000
/** The schema's note limit, in characters. */
export const NOTE_MAX = 280
/** A day note is a page, not a line. */
export const DAY_NOTE_MAX = 2000

/**
 * `MANUAL` is a row the reader wrote by hand — a trade the gate never saw. It is
 * a third verdict rather than a fake `APPROVED`, so no report can claim the gate
 * cleared something it was never shown.
 */
export type JournalVerdict = 'APPROVED' | 'BLOCKED' | 'MANUAL'

export type JournalSource = 'gate' | 'manual'

export type JournalRow = {
  tradeId: string
  date: string
  session: SessionInfo['state']
  symbol: string
  setup: string
  gateRule: string
  verdict: JournalVerdict
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
  /** Free labels (`FOMO`, `A+`, `news`) — one dimension to group by. */
  tags: string[]
  /** Set the first time the reader edits a row, so an edited record is visible as one. */
  editedAt: string | null
  source: JournalSource
}

export function rowFromVerdict(args: {
  plan: TradePlan
  verdict: GateVerdict
  sessionDate: string
  session: SessionInfo
  setupFamily: string
  took?: boolean
  note?: string
  tags?: string[]
}): JournalRow {
  const { plan, verdict, sessionDate, session, setupFamily, took = false, note = '', tags = [] } = args
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
    note: clampNote(note),
    memoId: null,
    tags: cleanTags(tags),
    editedAt: null,
    source: 'gate',
  }
}

/**
 * A trade written down by hand: no gate verdict, no invented size. Entry, stop
 * and target are the reader's own numbers, stored in cents like everything else.
 */
export function manualRow(args: {
  date: string
  symbol: string
  setup: string
  entryCents: number
  stopCents: number
  targetCents: number
  size: number
  session?: SessionInfo['state']
  note?: string
  tags?: string[]
  rulesFollowed?: boolean
}): JournalRow | null {
  const { entryCents, stopCents, targetCents } = args
  if (entryCents <= 0 || stopCents <= 0 || targetCents <= 0) return null
  if (stopCents >= entryCents || targetCents <= entryCents) return null
  const risk = entryCents - stopCents
  return {
    tradeId: crypto.randomUUID(),
    date: args.date,
    session: args.session ?? 'open',
    symbol: args.symbol.toUpperCase(),
    setup: args.setup || 'manual',
    gateRule: '',
    verdict: 'MANUAL',
    took: true,
    size: Math.max(0, Math.floor(args.size)),
    entry: price(entryCents),
    stop: price(stopCents),
    target: price(targetCents),
    rPlanned: ((targetCents - entryCents) / risk).toFixed(2),
    rResult: null,
    rulesFollowed: args.rulesFollowed ?? true,
    note: clampNote(args.note ?? ''),
    memoId: null,
    tags: cleanTags(args.tags ?? []),
    editedAt: null,
    source: 'manual',
  }
}

/** Trim to the schema's limit; the editor shows the same count. */
export function clampNote(note: string): string {
  return note.slice(0, NOTE_MAX)
}

export function clampDayNote(note: string): string {
  return note.slice(0, DAY_NOTE_MAX)
}

/** At most eight labels, each short and lower-cased once, with no duplicates. */
export function cleanTags(tags: string[]): string[] {
  const out: string[] = []
  for (const raw of tags) {
    const tag = raw.trim().slice(0, 24)
    if (!tag) continue
    if (out.some((t) => t.toLowerCase() === tag.toLowerCase())) continue
    out.push(tag)
    if (out.length === 8) break
  }
  return out
}

/** `FOMO, a+` → `['FOMO', 'a+']`; the editor's comma field and the row share this. */
export function parseTags(value: string): string[] {
  return cleanTags(value.split(','))
}

export function tagsToInput(tags: string[]): string {
  return tags.join(', ')
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** One session's page: a note the reader writes beside that day's rows. */
export type DayNote = { date: string; note: string; updatedAt: string }

export function dayNoteFor(notes: DayNote[], date: string): DayNote | undefined {
  return notes.find((n) => n.date === date)
}

/** Set (or clear) the note for a date; empty text removes it. */
export function upsertDayNote(notes: DayNote[], date: string, note: string, updatedAt = new Date().toISOString()): DayNote[] {
  const text = clampDayNote(note).trim()
  const rest = notes.filter((n) => n.date !== date)
  if (!text) return rest
  return [...rest, { date, note: text, updatedAt }].sort((a, b) => a.date.localeCompare(b.date))
}

/* ── the calendar ─────────────────────────────────────────────────────────── */

export type CalendarTotals = { rows: number; taken: number; closed: number; sumR: number }

export type CalendarDay = {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
} & CalendarTotals

export type CalendarMonth = {
  year: number
  /** 0-based, as the Date API uses it. */
  month: number
  label: string
  /** Monday-first, six weeks, so the grid never changes height. */
  weeks: CalendarDay[][]
  totals: CalendarTotals
}

const EMPTY_TOTALS: CalendarTotals = { rows: 0, taken: 0, closed: 0, sumR: 0 }

function isoDate(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1, 12)))
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month + delta, 1))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
}

export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

/**
 * A month of the journal, Monday-first. Rows already carry their ET session
 * date, so nothing here converts time zones: a row belongs to the date it was
 * written under.
 */
export function calendarMonth(rows: JournalRow[], year: number, month: number, today: string): CalendarMonth {
  const byDate = new Map<string, CalendarTotals>()
  for (const row of rows) {
    const day = byDate.get(row.date) ?? { rows: 0, taken: 0, closed: 0, sumR: 0 }
    day.rows += 1
    if (row.took) day.taken += 1
    if (row.took && row.rResult !== null) {
      day.closed += 1
      day.sumR = round2(day.sumR + row.rResult)
    }
    byDate.set(row.date, day)
  }

  // Monday-first week: getUTCDay() is 0 for Sunday, which is column 6 here.
  const first = new Date(Date.UTC(year, month, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const weeks: CalendarDay[][] = []
  let totals: CalendarTotals = { ...EMPTY_TOTALS }

  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = []
    for (let d = 0; d < 7; d++) {
      const dayOfMonth = 1 - offset + w * 7 + d
      const date = isoDate(year, month, dayOfMonth)
      const inMonth = new Date(Date.UTC(year, month, dayOfMonth)).getUTCMonth() === month
      const bucket = byDate.get(date) ?? EMPTY_TOTALS
      if (inMonth) {
        totals = {
          rows: totals.rows + bucket.rows,
          taken: totals.taken + bucket.taken,
          closed: totals.closed + bucket.closed,
          sumR: round2(totals.sumR + bucket.sumR),
        }
      }
      week.push({ date, day: new Date(Date.UTC(year, month, dayOfMonth)).getUTCDate(), inMonth, isToday: date === today, ...bucket })
    }
    weeks.push(week)
  }

  return { year, month, label: monthLabel(year, month), weeks, totals }
}

/* ── analytics ───────────────────────────────────────────────────────────── */

export type JournalSplit = { key: string; taken: number; closed: number; sumR: number; winRate: Rate }

export type JournalAnalytics = {
  taken: number
  closed: number
  /** Mean R of closed trades. `null` below the sample floor. */
  expectancyR: number | null
  /** Gross wins ÷ gross losses. `null` when no closed trade lost. */
  profitFactor: number | null
  avgWinR: number | null
  avgLossR: number | null
  /** Worst peak-to-trough of cumulative R, in R, walking the rows in order. */
  maxDrawdownR: number
  currentStreak: { kind: 'win' | 'loss' | 'none'; length: number }
  bestR: number | null
  worstR: number | null
  winRate: Rate
  blocksByRule: { ruleId: string; count: number }[]
  bySetup: JournalSplit[]
  bySymbol: JournalSplit[]
  tooSmall: boolean
}

/**
 * Every figure here is arithmetic over the rows in this browser, in the order
 * they happened. Nothing is reported below ten closed trades: a profit factor
 * from four rows is a coincidence with a decimal point.
 */
export function journalAnalytics(rows: JournalRow[]): JournalAnalytics {
  // Rows are stored newest-first; the calendar and streaks want them in order.
  const ordered = [...rows].reverse()
  const closedRows = ordered.filter((r) => r.took && r.rResult !== null)
  const results = closedRows.map((r) => r.rResult as number)

  const wins = results.filter((r) => r > 0)
  const losses = results.filter((r) => r < 0)
  const grossWin = wins.reduce((n, r) => n + r, 0)
  const grossLoss = Math.abs(losses.reduce((n, r) => n + r, 0))
  const tooSmall = closedRows.length < MIN_SAMPLE

  let peak = 0
  let cumulative = 0
  let maxDrawdownR = 0
  for (const r of results) {
    cumulative += r
    peak = Math.max(peak, cumulative)
    maxDrawdownR = Math.max(maxDrawdownR, peak - cumulative)
  }

  let streakKind: 'win' | 'loss' | 'none' = 'none'
  let streakLength = 0
  for (let i = results.length - 1; i >= 0; i--) {
    const kind: 'win' | 'loss' | 'none' = results[i] > 0 ? 'win' : results[i] < 0 ? 'loss' : 'none'
    if (kind === 'none') break
    if (streakKind === 'none') {
      streakKind = kind
      streakLength = 1
    } else if (kind === streakKind) {
      streakLength += 1
    } else break
  }

  const blocked = rows.filter((r) => r.verdict === 'BLOCKED')
  const ruleCounts = new Map<string, number>()
  for (const r of blocked) {
    const id = r.gateRule || 'unknown'
    ruleCounts.set(id, (ruleCounts.get(id) ?? 0) + 1)
  }

  const split = (keyOf: (r: JournalRow) => string): JournalSplit[] => {
    const groups = new Map<string, JournalRow[]>()
    for (const row of ordered) {
      const key = keyOf(row) || '—'
      groups.set(key, [...(groups.get(key) ?? []), row])
    }
    return [...groups.entries()]
      .map(([key, group]) => {
        const closedGroup = group.filter((r) => r.took && r.rResult !== null)
        const hits = closedGroup.map((r) => (r.rResult as number) > 0)
        return {
          key,
          taken: group.filter((r) => r.took).length,
          closed: closedGroup.length,
          sumR: round2(closedGroup.reduce((n, r) => n + (r.rResult as number), 0)),
          winRate: rateOf(key, hits.filter(Boolean).length, hits.length, hits),
        }
      })
      .sort((a, b) => b.sumR - a.sumR || b.closed - a.closed || a.key.localeCompare(b.key))
  }

  const hits = results.map((r) => r > 0)

  return {
    taken: ordered.filter((r) => r.took).length,
    closed: closedRows.length,
    expectancyR: tooSmall ? null : round2(results.reduce((n, r) => n + r, 0) / results.length),
    profitFactor: tooSmall || losses.length === 0 || grossLoss === 0 ? null : round2(grossWin / grossLoss),
    avgWinR: tooSmall || wins.length === 0 ? null : round2(grossWin / wins.length),
    avgLossR: tooSmall || losses.length === 0 ? null : round2(grossLoss / losses.length) * -1,
    maxDrawdownR: round2(maxDrawdownR),
    currentStreak: { kind: streakKind, length: streakLength },
    bestR: results.length === 0 ? null : Math.max(...results),
    worstR: results.length === 0 ? null : Math.min(...results),
    winRate: rateOf('Hit rate', hits.filter(Boolean).length, hits.length, hits),
    blocksByRule: [...ruleCounts.entries()]
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count || a.ruleId.localeCompare(b.ruleId)),
    bySetup: split((r) => r.setup),
    bySymbol: split((r) => r.symbol),
    tooSmall,
  }
}

/* ── the weekly review ───────────────────────────────────────────────────── */

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
  const sumR = round2(closed.reduce((n, r) => n + (r.rResult ?? 0), 0))
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

/* ── the file the reader owns ─────────────────────────────────────────────── */

export function journalFilename(date: string): string {
  return `rook-journal-${date}.csv`
}

export function journalBackupFilename(date: string): string {
  return `rook-journal-${date}.json`
}

function cell(value: string | number | boolean | null): string {
  if (value === null) return ''
  const s = typeof value === 'boolean' ? String(value) : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
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

export type JournalBundle = {
  app: 'rook'
  kind: 'journal'
  schema: number
  exportedAt: string
  rows: JournalRow[]
  dayNotes: DayNote[]
}

/** The whole journal in one file: every row, every day note, nothing else. */
export function journalBundle(rows: JournalRow[], dayNotes: DayNote[], exportedAt: string): JournalBundle {
  return { app: 'rook', kind: 'journal', schema: JOURNAL_SCHEMA, exportedAt, rows, dayNotes }
}

export function toJournalJson(rows: JournalRow[], dayNotes: DayNote[], exportedAt: string): string {
  return JSON.stringify(journalBundle(rows, dayNotes, exportedAt), null, 2)
}

export type BundleResult = { ok: true; rows: JournalRow[]; dayNotes: DayNote[] } | { ok: false; error: string }

/**
 * Read a backup. A bare array of rows is accepted — that is what an older
 * export would look like — and the field-level shape is repaired rather than
 * rejected, so one odd row cannot cost the reader the other two hundred.
 */
export function parseJournalBundle(text: string): BundleResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not JSON. Pick the .json export from this page.' }
  }
  const record = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null
  const rawRows = Array.isArray(raw) ? raw : record?.rows
  if (!Array.isArray(rawRows)) return { ok: false, error: 'No journal rows in that file.' }
  const rows = migrateJournal(rawRows)
  if (rows.length === 0) return { ok: false, error: 'No readable journal rows in that file.' }
  return { ok: true, rows, dayNotes: migrateDayNotes(record?.dayNotes) }
}

/** Fill the current row shape forward from whatever version was stored. */
export function migrateJournal(raw: unknown): JournalRow[] {
  if (!Array.isArray(raw)) return []
  const rows: JournalRow[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const tradeId = typeof r.tradeId === 'string' ? r.tradeId : ''
    const date = typeof r.date === 'string' ? r.date.slice(0, 10) : ''
    const symbol = typeof r.symbol === 'string' ? r.symbol : ''
    if (!tradeId || !date || !symbol) continue
    const verdict: JournalVerdict =
      r.verdict === 'BLOCKED' || r.verdict === 'MANUAL' || r.verdict === 'APPROVED' ? r.verdict : r.gateRule ? 'BLOCKED' : 'APPROVED'
    rows.push({
      tradeId,
      date,
      session: (r.session === 'pre' || r.session === 'open' || r.session === 'close' || r.session === 'closed' ? r.session : 'open') as SessionInfo['state'],
      symbol: symbol.toUpperCase(),
      setup: typeof r.setup === 'string' && r.setup ? r.setup : 'manual',
      gateRule: typeof r.gateRule === 'string' ? r.gateRule : '',
      verdict,
      took: r.took === true,
      size: Number.isFinite(r.size) ? Math.max(0, Math.floor(r.size as number)) : 0,
      entry: typeof r.entry === 'string' ? r.entry : '',
      stop: typeof r.stop === 'string' ? r.stop : '',
      target: typeof r.target === 'string' ? r.target : '',
      rPlanned: typeof r.rPlanned === 'string' ? r.rPlanned : '',
      rResult: typeof r.rResult === 'number' && Number.isFinite(r.rResult) ? round2(r.rResult) : null,
      rulesFollowed: r.rulesFollowed !== false,
      note: typeof r.note === 'string' ? clampNote(r.note) : '',
      memoId: typeof r.memoId === 'string' && r.memoId ? r.memoId : null,
      tags: Array.isArray(r.tags) ? cleanTags(r.tags.filter((t): t is string => typeof t === 'string')) : [],
      editedAt: typeof r.editedAt === 'string' ? r.editedAt : null,
      source: r.source === 'manual' || verdict === 'MANUAL' ? 'manual' : 'gate',
    })
  }
  return rows
}

export function migrateDayNotes(raw: unknown): DayNote[] {
  if (!Array.isArray(raw)) return []
  const notes: DayNote[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const n = item as Record<string, unknown>
    if (typeof n.date !== 'string' || typeof n.note !== 'string') continue
    const note = clampDayNote(n.note).trim()
    if (!note) continue
    notes.push({ date: n.date.slice(0, 10), note, updatedAt: typeof n.updatedAt === 'string' ? n.updatedAt : new Date(0).toISOString() })
  }
  return notes.sort((a, b) => a.date.localeCompare(b.date))
}
