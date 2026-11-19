import { describe, expect, test } from 'bun:test'

import { HAS_REAL_DATA, META, marketBars, marketDaily, marketPastSessions, marketPrevClose, marketSymbols } from './dataset'
import { barsFor, dailyFor, pastSessionsFor, prevCloseFor } from './fixtures'
import { INSTRUMENTS, SESSION_DATE } from './market'

const BAR_MS = 5 * 60 * 1000
const symbols = marketSymbols()

describe('market dataset', () => {
  test('is a yfinance snapshot with a fetch time', () => {
    expect(HAS_REAL_DATA).toBe(true)
    expect(META.source).toBe('yfinance')
    expect(Number.isNaN(Date.parse(META.fetchedAt))).toBe(false)
    expect(META.sessionDate).toBe(SESSION_DATE)
  })

  test('covers the whole desk universe', () => {
    for (const i of INSTRUMENTS) expect(symbols).toContain(i.symbol)
  })

  test('every symbol has a session, past sessions and daily closes', () => {
    for (const s of symbols) {
      expect(marketBars(s).length).toBeGreaterThan(0)
      expect(marketPastSessions(s).length).toBeGreaterThanOrEqual(20)
      expect(marketDaily(s).length).toBeGreaterThan(20)
    }
  })

  test('bars run forward on a five-minute grid, and a gap stays a gap', () => {
    for (const s of symbols) {
      const bars = marketBars(s)
      for (let i = 1; i < bars.length; i++) {
        const step = Date.parse(bars[i].start) - Date.parse(bars[i - 1].start)
        expect(step).toBeGreaterThanOrEqual(BAR_MS)
        expect(step % BAR_MS).toBe(0)
      }
      expect(bars.every((b) => b.volume > 0)).toBe(true)
    }
  })

  test('every bar is internally consistent', () => {
    for (const s of symbols) {
      for (const b of marketBars(s)) {
        expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close))
        expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close))
        expect(b.low).toBeGreaterThan(0)
      }
    }
  })

  test('past sessions all sit before the desk session', () => {
    for (const s of symbols) {
      for (const session of marketPastSessions(s)) {
        expect(session[0].start.slice(0, 10) < SESSION_DATE).toBe(true)
      }
    }
  })

  test('the desk reads the dataset, not the generator', () => {
    expect(JSON.stringify(barsFor('TSLA'))).toBe(JSON.stringify(marketBars('TSLA')))
    expect(dailyFor('AAPL')).toEqual(marketDaily('AAPL'))
    expect(pastSessionsFor('SPY').length).toBe(marketPastSessions('SPY').length)
    expect(prevCloseFor('TSLA')).toBe(marketPrevClose('TSLA'))
    expect(prevCloseFor('TSLA')).toBeGreaterThan(0)
  })

  test('the change line compares against the previous close, not today', () => {
    const daily = marketDaily('NVDA')
    const before = daily.filter((d) => d.date < SESSION_DATE)
    expect(marketPrevClose('NVDA')).toBe(before[before.length - 1].close)
  })
})
