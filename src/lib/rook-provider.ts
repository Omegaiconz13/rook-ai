import { DataUnavailableError } from '@luxalgo/vela'
import type { BarRange, DataProvider, OHLCV, ProviderInfo, SymbolDescriptor, SymbolInfo } from '@luxalgo/vela'

import { chartHistory, DEFAULT_TIMEFRAME, TIMEFRAMES } from '../shared/chartfeed'
import { barsFor, pastSessionsFor } from '../shared/fixtures'
import { INSTRUMENTS, instrumentFor } from '../shared/market'

/*
  Rook's symbols, served to the chart through the library's public data-provider
  port. The provider touches nothing but the committed snapshot: no network, no
  keys, no timers. Only `getBars` is required; `listSymbols` and
  `getSymbolInfo` are what make the chart's own symbol search, venue badges and
  timeframes work.
*/

export const ROOK_PROVIDER = 'rook'

export function createRookProvider(): DataProvider {
  return {
    info(): ProviderInfo {
      return {
        name: ROOK_PROVIDER,
        displayName: 'Rook snapshot',
        supportedTimeframes: [...TIMEFRAMES],
        capabilities: { enumerate: true, stream: false, symbolInfo: true },
      }
    },

    async listSymbols(): Promise<SymbolDescriptor[]> {
      return INSTRUMENTS.map((i) => ({
        ticker: i.symbol,
        description: `${i.name} · ${i.sector}`,
        type: 'stock',
        prefix: i.exchange,
      }))
    },

    async getSymbolInfo(ticker: string): Promise<SymbolInfo | undefined> {
      if (!instrumentFor(ticker)) return undefined
      return {
        ticker,
        timezone: 'America/New_York',
        session: '0930-1600',
        timeframes: { finest: '5', default: '5', list: [...TIMEFRAMES] },
        volume: true,
      }
    },

    async getBars(ticker: string, timeframe: string, _range: BarRange): Promise<OHLCV[]> {
      const symbol = ticker.toUpperCase()
      if (!instrumentFor(symbol)) return []
      // The snapshot holds 5-minute bars: anything finer has nothing to draw. Saying so
      // lets the chart fall back to the finest timeframe the desk does serve, instead of
      // painting an empty grid — the bottombar's `1D` range chip asks for `1m`.
      if (!(TIMEFRAMES as readonly string[]).includes(timeframe)) {
        throw new DataUnavailableError({
          reason: 'timeframe',
          symbol,
          timeframe,
          finest: DEFAULT_TIMEFRAME,
          default: DEFAULT_TIMEFRAME,
        })
      }
      // The whole snapshot goes back, `range` or not: a 5-minute symbol is at most 2,299
      // bars, and the chart asks for the window it is about to show. Answering with only
      // that window left the days before it blank — a `1D` switch from a `1h` view asked
      // for three weeks and drew an empty month before them. The chart clips what it shows.
      return chartHistory(symbol, timeframe)
    },

    /**
     * The regular session for each stored day, 09:30–16:00 New York, derived from
     * the bars themselves. Without this the shell cannot shade sessions or honour
     * its RTH/ETH switch; it is calendar data, not invented prices.
     */
    async getCalendar(ticker: string, range: { from: number; to: number }): Promise<ReadonlyArray<readonly [number, number]>> {
      const symbol = ticker.toUpperCase()
      if (!instrumentFor(symbol)) return []
      const sessions = [...pastSessionsFor(symbol, 30), barsFor(symbol)]
      const out: Array<readonly [number, number]> = []
      for (const bars of sessions) {
        if (bars.length === 0) continue
        const start = Date.parse(bars[0].start)
        const end = start + 6.5 * 60 * 60_000
        if (end <= range.from || start >= range.to) continue
        out.push([start, end])
      }
      return out
    },
  }
}
