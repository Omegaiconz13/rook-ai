import type { Bar, DailyBar } from './market'
import raw from './data/market.json'
import metaFile from './data/meta.json'

/*
  The market dataset written by scripts/fetch_bars.py (yfinance → Yahoo Finance).
  Bars are stored compactly: one open timestamp per session and `[index, open,
  high, low, close, volume]` per bar, where index is the 5-minute offset from the
  open. A missing bar therefore stays missing instead of shifting the session.

  Nothing here touches the network at runtime. The file is a build artefact; the
  screens label it with the provider and the time it was fetched.
*/

export type MarketMeta = {
  source: string
  provider: string
  interval: string
  timezone: string
  sessionDate: string
  fetchedAt: string
  delayed: boolean
  partialSession: boolean
  sessions: number
  note: string
}

type RawBar = [number, number, number, number, number, number]
type RawSession = { date: string; open: string; bars: RawBar[] }
type RawSymbol = { sessions: RawSession[]; daily: [string, number][] }

export const META = metaFile as MarketMeta
export const HAS_REAL_DATA = META.source === 'yfinance'

const BAR_MS = 5 * 60 * 1000
const SYMBOLS = (raw as unknown as { symbols: Record<string, RawSymbol> }).symbols

function expand(session: RawSession): Bar[] {
  const base = new Date(session.open).getTime()
  return session.bars.map(([index, open, high, low, close, volume]) => ({
    start: new Date(base + index * BAR_MS).toISOString(),
    open,
    high,
    low,
    close,
    volume,
  }))
}

/** The session the desk opens on: the newest session in the dataset. */
export function marketBars(symbol: string): Bar[] {
  const sessions = SYMBOLS[symbol.toUpperCase()]?.sessions
  const latest = sessions?.[sessions.length - 1]
  return latest ? expand(latest) : []
}

/** Completed sessions before the desk session, oldest first. */
export function marketPastSessions(symbol: string): Bar[][] {
  const sessions = SYMBOLS[symbol.toUpperCase()]?.sessions ?? []
  return sessions.slice(0, -1).map(expand)
}

export function marketDaily(symbol: string): DailyBar[] {
  const daily = SYMBOLS[symbol.toUpperCase()]?.daily ?? []
  return daily.map(([date, close]) => ({ date, close }))
}

/** Previous session's close, i.e. the newest close before the desk session. */
export function marketPrevClose(symbol: string): number {
  const daily = marketDaily(symbol)
  for (let i = daily.length - 1; i >= 0; i--) {
    if (daily[i].date < META.sessionDate) return daily[i].close
  }
  return 0
}

export function marketSymbols(): string[] {
  return Object.keys(SYMBOLS).map((s) => s.toUpperCase())
}
