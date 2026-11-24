import { marketBars, marketDaily, marketPastSessions, marketPrevClose } from './dataset'
import type { Bar, DailyBar } from './market'
import { INSTRUMENTS, SESSION_DATE } from './market'
import { mulberry32 } from './rng'

/*
  Two sources, one API. The functions at the bottom of this file serve the
  yfinance snapshot when src/shared/data/market.json is present, and fall back
  to the generated session below when it is not, so a checkout without the
  dataset still runs with no network and no keys.

  The generated session is deterministic sample data for one US session
  (09:30–16:00 ET), in integer cents, seeded so a reload never changes a number.
  TSLA is pinned to the worked example in
  specs/001-ai-trading-desk/contracts/risk-engine.md: opening range
  354.47–362.18, breakout close 364.18, stop 358.32, 2R target 375.90.
*/

const OPEN_UTC_MINUTES = 14 * 60 + 30 // 09:30 EDT/EST is 14:30 UTC in November
const BAR_MS = 5 * 60 * 1000
const BARS = 78

function sessionStartMs(date: string): number {
  return new Date(`${date}T00:00:00Z`).getTime() + OPEN_UTC_MINUTES * 60_000
}

function isoFor(index: number, startMs: number): string {
  return new Date(startMs + index * 5 * 60_000).toISOString()
}

type Anchor = { open: number; high: number; low: number; close: number }
type Plan = {
  open: number
  drift: number
  vol: number
  volume: number
  seed: number
  anchors?: Record<number, Anchor>
}

/** Build a session: pinned anchors where given, a seeded walk elsewhere. */
function walk(plan: Plan, startMs: number, seed = plan.seed): Bar[] {
  const rand = mulberry32(seed)
  const bars: Bar[] = []
  let prev = plan.open

  for (let i = 0; i < BARS; i++) {
    const anchor = plan.anchors?.[i]
    const open = anchor?.open ?? prev
    // `vol` is a per-bar standard deviation, so this draw is normal-ish
    // (sum of four uniforms) rather than a flat ±vol band.
    const gaussianish = (rand() + rand() + rand() + rand() - 2) * 1.7320508
    const close = anchor?.close ?? Math.max(100, Math.round(open * (1 + plan.drift + gaussianish * plan.vol)))
    const spread = Math.max(6, Math.round(Math.abs(close - open) * 0.7 + rand() * plan.vol * 0.6 * open))
    const high = anchor?.high ?? Math.max(open, close) + spread
    const low = anchor?.low ?? Math.min(open, close) - spread
    bars.push({
      start: isoFor(i, startMs),
      open,
      high,
      low,
      close,
      volume: Math.round(plan.volume * (0.55 + rand() * 0.9) * (i < 3 ? 1.8 : 1)),
    })
    prev = close
  }
  return bars
}

/** 25 completed sessions, ending the day before the sample session. */
function dailySeries(seed: number, lastClose: number, drift: number, vol: number): DailyBar[] {
  const rand = mulberry32(seed)
  const out: DailyBar[] = []
  let price = lastClose
  for (let i = 0; i < 25; i++) {
    const day = new Date(Date.UTC(2026, 10, 19) - (25 - i) * 86_400_000)
    out.push({ date: day.toISOString().slice(0, 10), close: Math.round(price) })
    price = price * (1 + (rand() - 0.5) * 2 * vol - drift)
  }
  return out.reverse()
}

const PLANS: Record<string, Plan> = {
  TSLA: {
    open: 35_890,
    drift: 0.0006,
    vol: 0.003,
    volume: 900_000,
    seed: 20261119,
    anchors: {
      0: { open: 35_890, high: 36_120, low: 35_520, close: 35_640 },
      1: { open: 35_640, high: 36_218, low: 35_447, close: 36_020 },
      2: { open: 36_020, high: 36_150, low: 35_780, close: 35_910 },
      3: { open: 35_910, high: 36_050, low: 35_820, close: 35_950 },
      4: { open: 35_950, high: 36_110, low: 35_900, close: 36_040 },
      5: { open: 36_040, high: 36_090, low: 35_880, close: 35_980 },
      6: { open: 35_980, high: 36_160, low: 35_940, close: 36_120 },
      7: { open: 36_120, high: 36_200, low: 36_020, close: 36_160 },
      8: { open: 36_150, high: 36_490, low: 36_140, close: 36_418 },
    },
  },
  NVDA: {
    open: 18_240,
    drift: 0.0005,
    vol: 0.0032,
    volume: 2_100_000,
    seed: 771903,
    anchors: {
      0: { open: 18_240, high: 18_310, low: 18_090, close: 18_140 },
      1: { open: 18_140, high: 18_220, low: 17_980, close: 18_060 },
      2: { open: 18_060, high: 18_170, low: 18_010, close: 18_120 },
      4: { open: 18_120, high: 18_240, low: 18_080, close: 18_210 },
      6: { open: 18_210, high: 18_360, low: 18_190, close: 18_340 },
    },
  },
  AMD: {
    open: 21_480,
    drift: 0.0004,
    vol: 0.003,
    volume: 640_000,
    seed: 511903,
    anchors: {
      0: { open: 21_480, high: 21_560, low: 21_310, close: 21_380 },
      1: { open: 21_380, high: 21_470, low: 21_250, close: 21_300 },
      2: { open: 21_300, high: 21_420, low: 21_270, close: 21_390 },
      5: { open: 21_390, high: 21_500, low: 21_360, close: 21_470 },
      7: { open: 21_470, high: 21_640, low: 21_450, close: 21_620 },
    },
  },
  AAPL: {
    open: 27_310,
    drift: 0.0002,
    vol: 0.0018,
    volume: 520_000,
    seed: 331903,
    anchors: {
      0: { open: 27_310, high: 27_430, low: 27_230, close: 27_340 },
      1: { open: 27_340, high: 27_470, low: 27_260, close: 27_400 },
      2: { open: 27_400, high: 27_455, low: 27_320, close: 27_360 },
      5: { open: 27_360, high: 27_440, low: 27_300, close: 27_380 },
      9: { open: 27_380, high: 27_430, low: 27_310, close: 27_350 },
      14: { open: 27_350, high: 27_410, low: 27_290, close: 27_330 },
    },
  },
  MSFT: {
    open: 41_820,
    drift: 0.0003,
    vol: 0.0018,
    volume: 180_000,
    seed: 991903,
    anchors: {
      0: { open: 41_820, high: 41_900, low: 41_700, close: 41_760 },
      1: { open: 41_760, high: 41_880, low: 41_740, close: 41_860 },
      2: { open: 41_860, high: 41_980, low: 41_820, close: 41_960 },
      3: { open: 41_960, high: 42_080, low: 41_940, close: 42_050 },
      4: { open: 42_050, high: 42_140, low: 42_020, close: 42_120 },
      5: { open: 42_120, high: 42_190, low: 42_080, close: 42_160 },
      6: { open: 42_160, high: 42_180, low: 42_070, close: 42_110 },
      7: { open: 42_110, high: 42_150, low: 42_050, close: 42_080 },
      8: { open: 42_080, high: 42_120, low: 42_030, close: 42_060 },
      9: { open: 42_060, high: 42_230, low: 42_040, close: 42_210 },
    },
  },
  META: {
    open: 61_240,
    drift: 0.0003,
    vol: 0.002,
    volume: 140_000,
    seed: 121903,
    anchors: {
      0: { open: 61_240, high: 61_380, low: 61_120, close: 61_350 },
      1: { open: 61_350, high: 61_470, low: 61_280, close: 61_430 },
      2: { open: 61_430, high: 61_690, low: 61_390, close: 61_640 },
      4: { open: 61_640, high: 61_780, low: 61_600, close: 61_720 },
    },
  },
  SPY: {
    open: 68_910,
    drift: 0.0001,
    vol: 0.001,
    volume: 1_400_000,
    seed: 441903,
    anchors: {
      0: { open: 68_910, high: 68_980, low: 68_840, close: 68_870 },
      1: { open: 68_870, high: 68_960, low: 68_850, close: 68_940 },
      2: { open: 68_940, high: 68_975, low: 68_890, close: 68_920 },
      3: { open: 68_920, high: 68_995, low: 68_900, close: 68_980 },
    },
  },
  QQQ: {
    open: 61_020,
    drift: 0.0001,
    vol: 0.0012,
    volume: 900_000,
    seed: 661903,
    anchors: {
      0: { open: 61_020, high: 61_090, low: 60_940, close: 60_980 },
      1: { open: 60_980, high: 61_070, low: 60_950, close: 61_040 },
      2: { open: 61_040, high: 61_080, low: 61_000, close: 61_030 },
      4: { open: 61_030, high: 61_120, low: 61_010, close: 61_110 },
    },
  },
}

const BARS_BY_SYMBOL: Record<string, Bar[]> = Object.fromEntries(
  INSTRUMENTS.map((i) => {
    const plan = PLANS[i.symbol]
    return [i.symbol, walk(plan, sessionStartMs(SESSION_DATE))]
  }),
)

/**
 * Completed sessions before the sample session, newest last. Used by the Time
 * Machine's historical re-run. Generated from the same per-symbol plan with a
 * different seed, so they are sample data like everything else here.
 */
const PAST_CACHE = new Map<string, Bar[][]>()

export function generatedPastSessionsFor(symbol: string, count = 30): Bar[][] {
  const key = `${symbol.toUpperCase()}:${count}`
  const hit = PAST_CACHE.get(key)
  if (hit) return hit.map((s) => s.map((b) => ({ ...b })))

  const plan = PLANS[symbol.toUpperCase()]
  if (!plan) return []

  const sessions: Bar[][] = []
  const anchor = new Date(`${SESSION_DATE}T00:00:00Z`).getTime()
  let day = 1
  while (sessions.length < count) {
    const ms = anchor - day * 86_400_000
    const weekday = new Date(ms).getUTCDay()
    if (weekday !== 0 && weekday !== 6) {
      const date = new Date(ms).toISOString().slice(0, 10)
      // Each past session gets its own small drift, positive or negative, so
      // the history is not a stack of days that all trend the same way.
      const n = sessions.length
      const drift = (mulberry32(plan.seed + n * 104_729)() - 0.5) * plan.vol * 0.8
      sessions.push(walk({ ...plan, drift }, sessionStartMs(date), plan.seed + n * 7919 + 13))
    }
    day++
  }
  sessions.reverse()
  PAST_CACHE.set(key, sessions)
  return sessions.map((s) => s.map((b) => ({ ...b })))
}

const DAILY_BY_SYMBOL: Record<string, DailyBar[]> = Object.fromEntries(
  INSTRUMENTS.map((i) => {
    const plan = PLANS[i.symbol]
    return [i.symbol, dailySeries(plan.seed % 9973, plan.open, plan.drift, plan.vol * 3)]
  }),
)

/** The generated session's bars. Returned as a copy so callers cannot mutate it. */
export function generatedBarsFor(symbol: string): Bar[] {
  const bars = BARS_BY_SYMBOL[symbol.toUpperCase()]
  return bars ? bars.map((b) => ({ ...b })) : []
}

export function generatedDailyFor(symbol: string): DailyBar[] {
  const daily = DAILY_BY_SYMBOL[symbol.toUpperCase()]
  return daily ? daily.map((b) => ({ ...b })) : []
}

/* ---- The desk's data API: yfinance snapshot first, generated session second ---- */

/** The desk session's bars, oldest first. */
const BARS_CACHE = new Map<string, Bar[]>()

/**
 * The snapshot's 5-minute bars. Cached per symbol because callers hand the result
 * straight to the chart as an effect dependency: a fresh array every render would
 * tear the chart down and draw it again. The bars are read-only everywhere.
 */
export function barsFor(symbol: string): Bar[] {
  const key = symbol.toUpperCase()
  let bars = BARS_CACHE.get(key)
  if (!bars) {
    const real = marketBars(key)
    bars = real.length ? real : generatedBarsFor(key)
    BARS_CACHE.set(key, bars)
  }
  return bars
}

export function dailyFor(symbol: string): DailyBar[] {
  const real = marketDaily(symbol)
  return real.length ? real : generatedDailyFor(symbol)
}

/** Completed sessions before the desk session, oldest first, newest last. */
export function pastSessionsFor(symbol: string, count = 30): Bar[][] {
  const real = marketPastSessions(symbol)
  if (real.length) return real.slice(-count)
  return generatedPastSessionsFor(symbol, count)
}

/** Previous session's close, used for the change-percent line on the desk. */
export function prevCloseFor(symbol: string): number {
  const real = marketPrevClose(symbol)
  if (real) return real
  const daily = dailyFor(symbol)
  return daily.length ? daily[daily.length - 1].close : 0
}

export { SESSION_DATE, BAR_MS, OPEN_UTC_MINUTES }
