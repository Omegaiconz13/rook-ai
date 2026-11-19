import { HAS_REAL_DATA, META } from './dataset'

/*
  Market types and the desk universe. The prices come from the yfinance snapshot
  in src/shared/data (see scripts/fetch_bars.py); if that dataset is missing the
  generated sample session in fixtures.ts is used instead. Either way the screens
  say which one is on screen: nothing here talks to the network.
*/

export type Provenance = 'seed' | 'live' | 'fallback' | 'user'

/** v1 is long-only. Shorting is out of scope by constitution. */
export type Side = 'long'

export type SessionState = 'pre' | 'open' | 'close' | 'closed'

export const SESSION_DATE = META.sessionDate

function labelFor(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`))
}

/** The session the desk opens on, for copy and labels. */
export const SESSION_LABEL = labelFor(SESSION_DATE)

const FETCHED_LABEL = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
}).format(new Date(META.fetchedAt))

/**
 * Provenance for every screen: which feed, when it was fetched, and the words
 * the copy uses about it. One source of truth so no label can drift from the
 * data it describes.
 */
export const DATA = {
  real: HAS_REAL_DATA,
  provider: META.provider,
  fetchedAt: META.fetchedAt,
  fetchedLabel: `${FETCHED_LABEL} UTC`,
  delayed: META.delayed,
  partial: META.partialSession,
  badge: HAS_REAL_DATA ? 'MARKET DATA' : 'SAMPLE DATA',
  /** "sample session" / "real session" */
  sessionWord: HAS_REAL_DATA ? 'real session' : 'sample session',
  /** "fictional prices" / "delayed Yahoo Finance prices" */
  priceWord: HAS_REAL_DATA ? 'delayed Yahoo Finance prices' : 'fictional prices',
  sourceLine: HAS_REAL_DATA
    ? `${META.provider} via yfinance · delayed · fetched ${FETCHED_LABEL} UTC`
    : 'Generated sample session · no network',
} as const

export type Instrument = {
  symbol: string
  name: string
  exchange: 'NASDAQ' | 'NYSE' | 'AMEX'
  sector: string
  avgVolume: number
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ', sector: 'Auto', avgVolume: 98_200_000 },
  { symbol: 'NVDA', name: 'NVIDIA', exchange: 'NASDAQ', sector: 'Semiconductors', avgVolume: 214_000_000 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', sector: 'Semiconductors', avgVolume: 52_400_000 },
  { symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ', sector: 'Hardware', avgVolume: 48_100_000 },
  { symbol: 'MSFT', name: 'Microsoft', exchange: 'NASDAQ', sector: 'Software', avgVolume: 21_300_000 },
  { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ', sector: 'Internet', avgVolume: 16_800_000 },
  { symbol: 'SPY', name: 'S&P 500 ETF', exchange: 'AMEX', sector: 'Index ETF', avgVolume: 71_500_000 },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', exchange: 'NASDAQ', sector: 'Index ETF', avgVolume: 43_900_000 },
]

export const INSTRUMENT_BY_SYMBOL: Record<string, Instrument> = Object.fromEntries(INSTRUMENTS.map((i) => [i.symbol, i]))

/** One 5-minute candle. Prices are integer cents; `start` is ISO UTC. */
export type Bar = {
  start: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** One completed session, used by the 20-day reclaim rule. */
export type DailyBar = { date: string; close: number }

export type Quote = {
  symbol: string
  last: number
  prevClose: number
  changePct: number
  asOf: string
  delayed: boolean
  provenance: Provenance
}

export function instrumentFor(symbol: string): Instrument | undefined {
  return INSTRUMENT_BY_SYMBOL[symbol.toUpperCase()]
}
