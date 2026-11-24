import { barsFor, pastSessionsFor } from './fixtures'
import type { Bar } from './market'

/*
  The chart feed: the bars this repo already holds, reshaped for the charting
  library. Nothing here fetches anything — the 30 sessions in the yfinance
  snapshot (plus the desk session) are all Rook has, and every coarser candle is
  aggregated from those 5-minute bars, never invented.

  Money stays in integer cents in `Bar`; the chart wants price units, so the
  conversion happens in exactly one place, `toChartBars`.
*/

/** One candle as the charting library wants it: price units, epoch milliseconds. */
export type ChartBar = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/** The timeframes Rook serves. Bare minutes, plus `1D`, the library's canonical form. */
export const TIMEFRAMES = ['5', '15', '30', '60', '1D'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

export const DEFAULT_TIMEFRAME: Timeframe = '5'

export const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '1D': '1D',
}

/**
 * The stored id for whatever the chart reports as its timeframe: the id itself
 * (`'5'`) or the label the topbar shows (`'5m'`).
 */
export function timeframeFor(value: string): Timeframe | undefined {
  if ((TIMEFRAMES as readonly string[]).includes(value)) return value as Timeframe
  return TIMEFRAMES.find((id) => TIMEFRAME_LABEL[id] === value)
}

/**
 * Every 5-minute bar held for a symbol: the completed sessions in the snapshot,
 * oldest first, then the desk session. Still in integer cents.
 */
export function historyFor(symbol: string): Bar[] {
  return [...pastSessionsFor(symbol, 30).flat(), ...barsFor(symbol)]
}

/**
 * A symbol as the desk uses it. The chart speaks `VENUE:TICKER` (`NASDAQ:TSLA`);
 * everything in `src/shared` is keyed by the bare ticker.
 */
export function bareTicker(symbol: string): string {
  const ticker = symbol.includes(':') ? symbol.slice(symbol.lastIndexOf(':') + 1) : symbol
  return ticker.toUpperCase()
}

/** The desk session's own window for a symbol, in epoch ms — where its levels live. */
export function sessionWindow(symbol: string): { from: number; to: number } | null {
  const bars = barsFor(bareTicker(symbol))
  if (bars.length === 0) return null
  return { from: Date.parse(bars[0].start), to: Date.parse(bars[bars.length - 1].start) }
}

/** Cents → price units, ISO open time → epoch ms. The only conversion point. */
export function toChartBars(bars: Bar[]): ChartBar[] {
  return bars.map((b) => ({
    time: Date.parse(b.start),
    open: b.open / 100,
    high: b.high / 100,
    low: b.low / 100,
    close: b.close / 100,
    volume: b.volume,
  }))
}

/** A session's identity for bucketing: the UTC date of the bar's open time. */
function sessionOf(bar: Bar): string {
  return bar.start.slice(0, 10)
}

/**
 * Aggregate 5-minute bars into `minutes` buckets. Buckets are counted from the
 * session's own first bar, and a bucket never spans two sessions: an overnight
 * gap is a session boundary, not a 19-hour candle.
 */
export function aggregateBars(bars: Bar[], minutes: number): ChartBar[] {
  if (minutes <= 5) return toChartBars(bars)
  const bucketMs = minutes * 60_000
  const out: ChartBar[] = []
  let session = ''
  let sessionStart = 0
  let bucket = Number.NaN

  for (const bar of bars) {
    const key = sessionOf(bar)
    const time = Date.parse(bar.start)
    if (key !== session) {
      session = key
      sessionStart = time
      bucket = Number.NaN
    }
    const index = Math.floor((time - sessionStart) / bucketMs)
    const last = out[out.length - 1]
    if (!last || index !== bucket) {
      bucket = index
      out.push({
        time,
        open: bar.open / 100,
        high: bar.high / 100,
        low: bar.low / 100,
        close: bar.close / 100,
        volume: bar.volume,
      })
      continue
    }
    last.high = Math.max(last.high, bar.high / 100)
    last.low = Math.min(last.low, bar.low / 100)
    last.close = bar.close / 100
    last.volume = (last.volume ?? 0) + bar.volume
  }

  return out
}

/**
 * One candle per session, aggregated from that session's 5-minute bars: the
 * open is the first bar's, the close the last one's, the extremes and volume
 * come from the bars between. No close-only daily series is drawn as OHLC.
 */
export function dailyBars(bars: Bar[]): ChartBar[] {
  const out: ChartBar[] = []
  let session = ''

  for (const bar of bars) {
    const key = sessionOf(bar)
    const last = out[out.length - 1]
    if (!last || key !== session) {
      session = key
      // A daily bar is a date: the library stamps it at 00:00 UTC and shows
      // that date in every time zone (intraday stamps would place it at a time).
      out.push({
        time: Date.parse(`${key}T00:00:00Z`),
        open: bar.open / 100,
        high: bar.high / 100,
        low: bar.low / 100,
        close: bar.close / 100,
        volume: bar.volume,
      })
      continue
    }
    last.high = Math.max(last.high, bar.high / 100)
    last.low = Math.min(last.low, bar.low / 100)
    last.close = bar.close / 100
    last.volume = (last.volume ?? 0) + bar.volume
  }

  return out
}

/** The bars for one symbol at one timeframe, oldest first. Unknown input is empty. */
export function chartHistory(symbol: string, timeframe: string): ChartBar[] {
  if (!TIMEFRAMES.includes(timeframe as Timeframe)) return []
  const bars = historyFor(symbol)
  if (bars.length === 0) return []
  if (timeframe === '1D') return dailyBars(bars)
  return aggregateBars(bars, Number(timeframe))
}
