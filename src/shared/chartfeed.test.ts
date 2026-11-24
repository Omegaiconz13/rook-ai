import { describe, expect, test } from 'bun:test'

import { aggregateBars, bareTicker, chartHistory, dailyBars, historyFor, sessionWindow, timeframeFor, TIMEFRAMES, toChartBars } from './chartfeed'
import { barsFor } from './fixtures'
import type { Bar } from './market'

/** A 5-minute bar on a session that opens at 09:30 New York (14:30 UTC in November). */
function bar(day: string, index: number, open: number, high: number, low: number, close: number, volume = 100): Bar {
  const start = new Date(`${day}T14:30:00Z`).getTime() + index * 5 * 60_000
  return { start: new Date(start).toISOString(), open, high, low, close, volume }
}

const DAY_ONE = '2026-11-16'
const DAY_TWO = '2026-11-17'

const BARS: Bar[] = [
  bar(DAY_ONE, 0, 10_000, 10_100, 9_950, 10_050, 300),
  bar(DAY_ONE, 1, 10_050, 10_200, 10_000, 10_150, 400),
  bar(DAY_ONE, 2, 10_150, 10_180, 10_080, 10_100, 500),
  bar(DAY_ONE, 3, 10_100, 10_260, 10_050, 10_220, 600),
  bar(DAY_ONE, 4, 10_220, 10_300, 10_190, 10_240, 700),
  bar(DAY_ONE, 5, 10_240, 10_250, 10_090, 10_120, 800),
  bar(DAY_TWO, 0, 10_000, 10_050, 9_900, 9_950, 100),
  bar(DAY_TWO, 1, 9_950, 10_010, 9_900, 10_000, 200),
  bar(DAY_TWO, 2, 10_000, 10_080, 9_980, 10_050, 300),
]

describe('toChartBars', () => {
  test('converts integer cents to price units and ISO times to epoch ms', () => {
    const [first] = toChartBars([BARS[0]])
    expect(first.open).toBe(100)
    expect(first.high).toBe(101)
    expect(first.low).toBe(99.5)
    expect(first.close).toBe(100.5)
    expect(first.time).toBe(Date.parse(BARS[0].start))
    expect(first.volume).toBe(300)
  })
})

describe('aggregateBars', () => {
  test('merges three 5-minute bars into one honest 15-minute candle', () => {
    const out = aggregateBars(BARS.slice(0, 3), 15)
    expect(out).toHaveLength(1)
    // time is the first bar's real open time, not a synthesised grid point
    expect(out[0].time).toBe(Date.parse(BARS[0].start))
    expect(out[0].open).toBe(100) // first bar's open
    expect(out[0].high).toBe(102) // max high of the three
    expect(out[0].low).toBe(99.5) // min low of the three
    expect(out[0].close).toBe(101) // last bar's close
    expect(out[0].volume).toBe(300 + 400 + 500)
  })

  test('never merges across an overnight gap', () => {
    const out = aggregateBars(BARS, 15)
    // six bars on day one and three on day two: two + one buckets
    expect(out).toHaveLength(3)
    const secondDay = out.filter((b) => new Date(b.time).toISOString().slice(0, 10) === DAY_TWO)
    expect(secondDay).toHaveLength(1)
    expect(secondDay[0].time).toBe(Date.parse(BARS[6].start))
    expect(secondDay[0].open).toBe(100)
    expect(secondDay[0].close).toBe(100.5)
    expect(secondDay[0].volume).toBe(600)
    // the first day keeps its own last close, untouched by the next morning
    expect(out[1].close).toBe(101.2)
  })

  test('every bucket keeps ascending times and sane OHLC', () => {
    for (const timeframe of ['15', '30', '60'] as const) {
      const out = aggregateBars(BARS, Number(timeframe))
      for (let i = 0; i < out.length; i++) {
        const b = out[i]
        expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close))
        expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close))
        if (i > 0) expect(b.time).toBeGreaterThan(out[i - 1].time)
      }
    }
  })

  test('five minutes is the base series, unchanged', () => {
    expect(aggregateBars(BARS, 5)).toEqual(toChartBars(BARS))
  })
})

describe('dailyBars', () => {
  test('one candle per session, aggregated from its own 5-minute bars', () => {
    const out = dailyBars(BARS)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ open: 100, high: 103, low: 99.5, close: 101.2 })
    expect(out[0].volume).toBe(300 + 400 + 500 + 600 + 700 + 800)
    expect(out[1]).toMatchObject({ open: 100, high: 100.8, low: 99, close: 100.5 })
    expect(new Date(out[0].time).toISOString().slice(0, 10)).toBe(DAY_ONE)
  })

  test('stamps the bar at midnight UTC, because a daily bar is a date', () => {
    const out = dailyBars(BARS)
    expect(new Date(out[0].time).toISOString()).toBe(`${DAY_ONE}T00:00:00.000Z`)
  })
})

describe('timeframeFor', () => {
  test('accepts the id and the label the topbar shows', () => {
    expect(timeframeFor('5')).toBe('5')
    expect(timeframeFor('5m')).toBe('5')
    expect(timeframeFor('1h')).toBe('60')
    expect(timeframeFor('1D')).toBe('1D')
    expect(timeframeFor('7')).toBeUndefined()
  })
})

describe('chartHistory', () => {
  const symbol = 'TSLA'

  test('five minutes returns every bar the snapshot holds', () => {
    const bars = chartHistory(symbol, '5')
    expect(bars.length).toBe(historyFor(symbol).length)
    expect(bars.length).toBeGreaterThan(1_000)
    expect(bars.length).toBe(toChartBars(historyFor(symbol)).length)
  })

  test('daily returns one candle per stored session', () => {
    expect(chartHistory(symbol, '1D')).toHaveLength(30)
  })

  test('every served timeframe is ascending and has honest candles', () => {
    for (const timeframe of TIMEFRAMES) {
      const bars = chartHistory(symbol, timeframe)
      expect(bars.length).toBeGreaterThan(0)
      for (let i = 0; i < bars.length; i++) {
        expect(bars[i].high).toBeGreaterThanOrEqual(Math.max(bars[i].open, bars[i].close))
        expect(bars[i].low).toBeLessThanOrEqual(Math.min(bars[i].open, bars[i].close))
        if (i > 0) expect(bars[i].time).toBeGreaterThan(bars[i - 1].time)
      }
    }
  })

  test('unknown symbol and unknown timeframe are empty, not invented', () => {
    expect(chartHistory('ZZZZ', '5')).toEqual([])
    expect(chartHistory(symbol, '7')).toEqual([])
  })
})

describe('bareTicker and sessionWindow', () => {
  test('strips the chart venue prefix the desk does not use', () => {
    expect(bareTicker('NASDAQ:TSLA')).toBe('TSLA')
    expect(bareTicker('tsla')).toBe('TSLA')
  })

  test('frames the desk session, not the whole history', () => {
    const window = sessionWindow('NASDAQ:TSLA')
    const session = barsFor('TSLA')
    expect(window).not.toBeNull()
    expect(window!.from).toBe(Date.parse(session[0].start))
    expect(window!.to).toBeGreaterThan(window!.from)
    expect(sessionWindow('ZZZZ')).toBeNull()
  })
})
