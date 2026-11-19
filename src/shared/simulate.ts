import { barsFor, pastSessionsFor } from './fixtures'
import type { Bar } from './market'
import { mulberry32 } from './rng'
import type { TradePlan } from './risk'
import { setupsFor } from './setups'
import type { SetupFamily } from './setups'

/*
  The Time Machine. Before the trade: rebuild the rest of the session 10,000
  times from returns drawn from the same part of the session on the last 30
  sample sessions. Then re-run the same rule on those sessions and report what
  actually happened. Seeded, so the same plan and seed give the same answer.

  This is sample data. It is a range, not an edge.
*/

export const DEFAULT_SEED = 19
export const DEFAULT_RUNS = 10_000
/** Consecutive bars resampled together by the block bootstrap. */
export const BLOCK_SIZE = 15

/**
 * What the replay does not model. Attached to every result and printed with it,
 * because an assumption that lives only in the README is an assumption nobody
 * reads.
 */
export const SIM_ASSUMPTIONS = [
  'no slippage: entries and exits fill at the exact level',
  'no partial fills: a ticket fills whole or not at all',
  'a bar that spans the stop and the target is scored stop-first',
  'unresolved at 16:00: flat at the last close',
  'returns are drawn per time-of-day bucket, so streaks do not survive',
] as const
const MIN_RUNS = 1_000
const MAX_RUNS = 20_000
const BARS_PER_SESSION = 78

export type BootstrapResult = {
  targetFirst: number
  stopFirst: number
  neither: number
  avgR: number
  blockSize: number
}

export type SimResult = {
  symbol: string
  planId: string
  seed: number
  runs: number
  targetFirst: number
  stopFirst: number
  neither: number
  avgR: number
  /** The same replay with whole blocks of bars resampled, so streaks survive. */
  bootstrap: BootstrapResult
  historicalOccurrences: number
  historicalWins: number
  historicalLosses: number
  historicalNeither: number
  verdictLine: string
  /** The modelling assumptions this result was produced under. */
  assumptions: string[]
  createdAt: string
}

const POOLS = new Map<string, number[][]>()
const BLOCKS = new Map<string, number[][]>()

/**
 * Each past session as one return series with its own drift removed. Blocks
 * keep their order when resampled, which is the whole point: a run of three
 * down bars can come back intact instead of being shuffled away.
 */
export function blockSeries(symbol: string): number[][] {
  const key = symbol.toUpperCase()
  const hit = BLOCKS.get(key)
  if (hit) return hit

  const out = pastSessionsFor(key)
    .map((session) => {
      const returns: number[] = []
      for (let i = 1; i < session.length; i++) {
        const prev = session[i - 1].close
        if (prev > 0) returns.push(session[i].close / prev - 1)
      }
      if (returns.length === 0) return returns
      const mean = returns.reduce((n, r) => n + r, 0) / returns.length
      return returns.map((r) => r - mean)
    })
    .filter((returns) => returns.length > BLOCK_SIZE)

  BLOCKS.set(key, out)
  return out
}

/** Per-minute return pools: every past session's return at the same bar index. */
export function returnPools(symbol: string): number[][] {
  const key = symbol.toUpperCase()
  const hit = POOLS.get(key)
  if (hit) return hit

  const pools: number[][] = Array.from({ length: BARS_PER_SESSION }, () => [])
  for (const session of pastSessionsFor(key)) {
    for (let i = 1; i < session.length; i++) {
      const prev = session[i - 1].close
      if (prev > 0 && pools[i]) pools[i].push(session[i].close / prev - 1)
    }
  }
  // De-mean each time-of-day bucket. Without this the sample sessions' own
  // upward drift is baked into every replay and the odds become nonsense.
  for (const pool of pools) {
    if (pool.length === 0) continue
    const mean = pool.reduce((n, r) => n + r, 0) / pool.length
    for (let i = 0; i < pool.length; i++) pool[i] -= mean
  }
  POOLS.set(key, pools)
  return pools
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * The same path built from 15-bar blocks lifted out of past sessions, started
 * at a random offset in a random session. Uses its own generator so the two
 * columns can be compared without one consuming the other's draws.
 */
function bootstrapOutcome(args: {
  plan: TradePlan
  entryIndex: number
  risk: number
  targetR: number
  seed: number
  runs: number
}): BootstrapResult {
  const { plan, entryIndex, risk, targetR, seed, runs } = args
  const series = blockSeries(plan.symbol)
  const rng = mulberry32((seed ^ 0x9e37_79b9) >>> 0)

  let targetFirst = 0
  let stopFirst = 0
  let rSum = 0

  if (series.length === 0) return { targetFirst: 0, stopFirst: 0, neither: 100, avgR: 0, blockSize: BLOCK_SIZE }

  for (let run = 0; run < runs; run++) {
    let price = plan.entryCents
    let r = 0
    let hit: 'target' | 'stop' | null = null
    let i = entryIndex + 1

    while (i < BARS_PER_SESSION && !hit) {
      const source = series[Math.floor(rng() * series.length)]
      const start = Math.floor(rng() * (source.length - BLOCK_SIZE))
      for (let k = 0; k < BLOCK_SIZE && i < BARS_PER_SESSION; k++, i++) {
        price = price * (1 + source[start + k])
        if (price <= plan.stopCents) {
          hit = 'stop'
          break
        }
        if (price >= plan.targetCents) {
          hit = 'target'
          break
        }
      }
    }

    if (hit === 'target') {
      targetFirst++
      r = targetR
    } else if (hit === 'stop') {
      stopFirst++
      r = -1
    } else if (risk > 0) {
      r = (price - plan.entryCents) / risk
    }
    rSum += r
  }

  const targetPct = round1((targetFirst / runs) * 100)
  const stopPct = round1((stopFirst / runs) * 100)

  return {
    targetFirst: targetPct,
    stopFirst: stopPct,
    neither: round1(Math.max(0, 100 - targetPct - stopPct)),
    avgR: Math.round((rSum / runs) * 100) / 100,
    blockSize: BLOCK_SIZE,
  }
}

function entryIndexFor(plan: TradePlan, bars: Bar[]): number {
  const exact = bars.findIndex((b) => b.close === plan.entryCents)
  if (exact >= 0) return exact
  const rangeHigh = Math.max(...bars.slice(0, 3).map((b) => b.high))
  const breakout = bars.findIndex((b, i) => i >= 3 && b.close > rangeHigh)
  return breakout >= 0 ? breakout : 8
}

function familyOf(plan: TradePlan): SetupFamily {
  const tail = plan.setupId?.split('-').pop()
  return tail === 'flag' || tail === 'reclaim' || tail === 'fvg' ? tail : 'orb'
}

type Trigger = {
  bars: Bar[]
  index: number
  triggerAt: string
  entryCents: number
  stopCents: number
  targetCents: number
  rangeHighCents: number
  rangeLowCents: number
}

/** First trigger of the same rule on a past session, with that session's levels. */
function historicalTriggers(symbol: string, family: SetupFamily): Trigger[] {
  const out: Trigger[] = []
  if (family === 'reclaim') return out
  for (const bars of pastSessionsFor(symbol)) {
    const setup = setupsFor(symbol, bars, []).find((s) => s.family === family && s.status === 'triggered')
    if (!setup) continue
    const index = bars.findIndex((b) => b.start === setup.triggerAt)
    if (index < 0) continue
    out.push({
      bars,
      index,
      triggerAt: setup.triggerAt,
      entryCents: setup.entryCents,
      stopCents: setup.stopCents,
      targetCents: setup.targetCents,
      rangeHighCents: setup.rangeHighCents,
      rangeLowCents: setup.rangeLowCents,
    })
  }
  return out
}

/** The New York date a session belongs to. */
export function sessionDate(bars: Bar[]): string {
  return new Date(bars[0].start).toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function triggerOutcome(t: Trigger): { outcome: Occurrence['outcome']; rResult: number } {
  const risk = t.entryCents - t.stopCents
  const round2 = (n: number) => Math.round(n * 100) / 100

  for (let i = t.index + 1; i < t.bars.length; i++) {
    const bar = t.bars[i]
    if (bar.low <= t.stopCents) return { outcome: 'stop', rResult: -1 }
    if (bar.high >= t.targetCents) return { outcome: 'target', rResult: risk > 0 ? round2((t.targetCents - t.entryCents) / risk) : 0 }
  }

  const last = t.bars[t.bars.length - 1]
  return { outcome: 'open', rResult: risk > 0 ? round2((last.close - t.entryCents) / risk) : 0 }
}

export type Occurrence = {
  date: string
  at: string
  entryCents: number
  stopCents: number
  targetCents: number
  rangeHighCents: number
  rangeLowCents: number
  outcome: 'target' | 'stop' | 'open'
  rResult: number
}

/**
 * Every past occurrence of one rule, in date order, with its own outcome. This
 * is the list behind the Time Machine's count: the statistic can be opened.
 */
export function occurrencesFor(symbol: string, family: SetupFamily): Occurrence[] {
  return historicalTriggers(symbol, family).map((t) => {
    const { outcome, rResult } = triggerOutcome(t)
    return {
      date: sessionDate(t.bars),
      at: t.triggerAt,
      entryCents: t.entryCents,
      stopCents: t.stopCents,
      targetCents: t.targetCents,
      rangeHighCents: t.rangeHighCents,
      rangeLowCents: t.rangeLowCents,
      outcome,
      rResult,
    }
  })
}

export function simulate(args: { plan: TradePlan; seed?: number; runs?: number; now?: string }): SimResult {
  const { plan } = args
  const seed = Number.isFinite(args.seed) ? (args.seed as number) >>> 0 : DEFAULT_SEED
  const runs = Math.min(MAX_RUNS, Math.max(MIN_RUNS, Math.round(args.runs ?? DEFAULT_RUNS)))
  const bars = barsFor(plan.symbol)
  const entryIndex = entryIndexFor(plan, bars)
  const risk = plan.entryCents - plan.stopCents
  const targetR = risk > 0 ? (plan.targetCents - plan.entryCents) / risk : 0
  const pools = returnPools(plan.symbol)
  const rng = mulberry32(seed)

  let targetFirst = 0
  let stopFirst = 0
  let rSum = 0

  for (let run = 0; run < runs; run++) {
    let price = plan.entryCents
    let r = 0
    let hit: 'target' | 'stop' | null = null

    for (let i = entryIndex + 1; i < bars.length && i < BARS_PER_SESSION; i++) {
      const pool = pools[i]
      if (!pool || pool.length === 0) continue
      const ret = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))]
      price = price * (1 + ret)
      if (price <= plan.stopCents) {
        hit = 'stop'
        break
      }
      if (price >= plan.targetCents) {
        hit = 'target'
        break
      }
    }

    if (hit === 'target') {
      targetFirst++
      r = targetR
    } else if (hit === 'stop') {
      stopFirst++
      r = -1
    } else if (risk > 0) {
      r = (price - plan.entryCents) / risk
    }
    rSum += r
  }

  const targetPct = round1((targetFirst / runs) * 100)
  const stopPct = round1((stopFirst / runs) * 100)
  const neitherPct = round1(Math.max(0, 100 - targetPct - stopPct))

  const family = familyOf(plan)
  const triggers = historicalTriggers(plan.symbol, family)
  let wins = 0
  let losses = 0
  let neither = 0

  for (const t of triggers) {
    const { outcome } = triggerOutcome(t)
    if (outcome === 'target') wins++
    else if (outcome === 'stop') losses++
    else neither++
  }

  const occurrences = triggers.length
  const verdictLine =
    occurrences < 20
      ? `Too early to conclude: ${occurrences} historical ${occurrences === 1 ? 'occurrence' : 'occurrences'} on 30 sessions. Treat the range as noise, not an edge.`
      : `On ${occurrences} historical occurrences the rule hit the target first ${wins} times and the stop first ${losses} times. That is a sample, not a promise.`

  return {
    symbol: plan.symbol,
    planId: plan.id,
    seed,
    runs,
    targetFirst: targetPct,
    stopFirst: stopPct,
    neither: neitherPct,
    avgR: Math.round((rSum / runs) * 100) / 100,
    bootstrap: bootstrapOutcome({ plan, entryIndex, risk, targetR, seed, runs }),
    historicalOccurrences: occurrences,
    historicalWins: wins,
    historicalLosses: losses,
    historicalNeither: neither,
    verdictLine,
    assumptions: [...SIM_ASSUMPTIONS],
    createdAt: args.now ?? new Date().toISOString(),
  }
}
