import { describe, expect, test } from 'bun:test'

import { dispatch } from '../registry'
import { journalRow, testContext } from '../testctx'
import type { ToolOutcome } from '../types'
import { READ_TOOLS } from './read'

function data(outcome: ToolOutcome): Record<string, unknown> {
  if (!outcome.ok) throw new Error(`expected ok, got: ${outcome.why}`)
  return outcome.data
}

function reason(outcome: ToolOutcome): string {
  if (outcome.ok) throw new Error('expected a refusal, got a result')
  return outcome.why
}

type Row = Record<string, unknown>

describe('the read set', () => {
  test('is seven tools, every one tier 1 and side-effect free', () => {
    expect(READ_TOOLS).toHaveLength(7)
    for (const tool of READ_TOOLS) {
      expect(tool.set).toBe('read')
      expect(tool.tier).toBe(1)
    }
  })
})

describe('get_quote', () => {
  test('reads the last stored bar for a symbol, in cents and in dollars', () => {
    const quote = data(dispatch('get_quote', { symbol: 'nasdaq:TSLA' }, testContext()))
    expect(quote.symbol).toBe('TSLA')
    expect(quote.timeframe).toBe('5')
    expect(quote.closeCents).toBe(37_942)
    expect(quote.close).toBe('379.42')
    expect(quote.open).toBe('379.35')
    expect(quote.high).toBe('379.57')
    expect(quote.low).toBe('378.59')
  })

  test('computes the change from the bar before, not from a daily reference', () => {
    const ctx = testContext({
      bars: [
        { time: 1, open: 100, high: 105, low: 99, close: 100 },
        { time: 2, open: 100, high: 111, low: 100, close: 110 },
      ],
    })
    const quote = data(dispatch('get_quote', { symbol: 'TSLA' }, ctx))
    expect(quote.previousClose).toBe('100.00')
    expect(quote.changePct).toBe(10)
    expect(quote.direction).toBe('up')
  })

  test('accepts a timeframe label and reads that series', () => {
    const quote = data(dispatch('get_quote', { symbol: 'TSLA', timeframe: '15m' }, testContext()))
    expect(quote.timeframe).toBe('15')
    expect(quote.label).toBe('15m')
  })

  test('refuses a timeframe the desk does not serve', () => {
    expect(reason(dispatch('get_quote', { symbol: 'TSLA', timeframe: '3h' }, testContext()))).toContain(
      'not a timeframe the desk serves',
    )
  })
})

describe('list_levels', () => {
  test('returns the levels the chart draws, unchanged', () => {
    const result = data(dispatch('list_levels', { symbol: 'TSLA' }, testContext()))
    const levels = result.levels as Row[]
    expect(result.count).toBe(5)
    expect(levels.map((level) => level.price)).toEqual(['388.30', '388.32', '393.06', '388.32', '402.54'])
    expect(levels[3].priceCents).toBe(38_832)
  })

  test('refuses another symbol rather than computing a second set', () => {
    expect(reason(dispatch('list_levels', { symbol: 'NVDA' }, testContext()))).toContain(
      "computed only for the chart's symbol",
    )
  })

  test('says no rule produced levels instead of drawing something', () => {
    expect(reason(dispatch('list_levels', { symbol: 'TSLA' }, testContext({ levels: [] })))).toContain(
      'No written rule produced levels',
    )
  })
})

describe('list_setups', () => {
  test('returns both of TSLA’s rules with the rule’s own prices, triggered first', () => {
    const result = data(dispatch('list_setups', { symbol: 'TSLA' }, testContext()))
    const setups = result.setups as Row[]
    expect(result.count).toBe(2)
    expect(result.triggered).toBe(1)
    expect(setups.map((setup) => setup.id)).toEqual(['TSLA-reclaim', 'TSLA-orb'])
    expect(setups.map((setup) => setup.status)).toEqual(['triggered', 'expired'])
    expect(setups[0].entry).toBe('393.06')
    expect(setups[0].stop).toBe('388.32')
    expect(setups[0].target).toBe('402.54')
    expect(setups[0].rMultiple).toBe(2)
  })

  test('reads the whole desk when no symbol is asked for', () => {
    const result = data(dispatch('list_setups', {}, testContext()))
    expect(result.count).toBe(14)
    expect(result.triggered).toBe(8)
  })

  test('reports a rule that only expired instead of hiding it', () => {
    const result = data(dispatch('list_setups', { symbol: 'AAPL' }, testContext()))
    const setups = result.setups as Row[]
    expect(result.triggered).toBe(0)
    expect(setups.map((setup) => setup.status)).toEqual(['expired'])
  })
})

describe('scan_desk', () => {
  test('gives one best setup per symbol and names the quiet ones', () => {
    const result = data(dispatch('scan_desk', {}, testContext()))
    const best = result.best as Row[]
    expect(result.symbols).toBe(8)
    expect(result.triggered).toBe(6)
    expect(result.quiet).toEqual([])
    expect(best[0].symbol).toBe('AMD')
    expect(best.map((setup) => setup.symbol)).toEqual(['AMD', 'META', 'MSFT', 'NVDA', 'QQQ', 'TSLA', 'AAPL', 'SPY'])
  })
})

describe('read_journal', () => {
  const journal = [
    journalRow({ tradeId: 'a', gateRule: 'R-12', verdict: 'BLOCKED', took: false, note: 'reward too thin' }),
    journalRow({ tradeId: 'b', symbol: 'NVDA', date: '2026-11-18' }),
    journalRow({ tradeId: 'c', date: '2026-11-18' }),
  ]

  test('counts every verdict and filters by symbol without re-sorting', () => {
    const result = data(dispatch('read_journal', { symbol: 'TSLA' }, testContext({ journal })))
    const rows = result.rows as Row[]
    expect(result.counts).toMatchObject({ total: 3, matched: 2, approved: 1, blocked: 1, manual: 0, took: 1 })
    expect(rows.map((row) => row.tradeId)).toEqual(['a', 'c'])
  })

  test('filters by date and verdict', () => {
    const result = data(
      dispatch('read_journal', { date: '2026-11-18', verdict: 'APPROVED' }, testContext({ journal })),
    )
    expect(result.counts).toMatchObject({ matched: 2, approved: 2, blocked: 0 })
  })

  test('caps rows and says the answer was cut', () => {
    const result = data(dispatch('read_journal', { limit: 1 }, testContext({ journal })))
    expect((result.rows as Row[]).length).toBe(1)
    expect(result.truncated).toBe(true)
  })

  test('says the journal is empty instead of describing rows it does not have', () => {
    const result = data(dispatch('read_journal', {}, testContext()))
    expect(result.empty).toBe(true)
    expect(result.rows).toEqual([])
  })

  test('refuses a date that is not a date', () => {
    expect(reason(dispatch('read_journal', { date: 'yesterday' }, testContext({ journal })))).toContain('YYYY-MM-DD')
  })
})

describe('read_news', () => {
  test('returns the seeded headlines, labelled fictional, and skips unknown tickers', () => {
    const result = data(dispatch('read_news', { symbols: ['TSLA', 'DOGE'] }, testContext()))
    const items = result.items as Row[]
    expect(result.count).toBe(2)
    expect(result.skipped).toEqual(['DOGE'])
    expect(items.every((item) => item.symbol === 'TSLA')).toBe(true)
    expect(String(result.note)).toContain('fictional')
  })
})

describe('read_account', () => {
  test('reads the limits and the account, and says which clock it is on', () => {
    const account = data(dispatch('read_account', {}, testContext()))
    expect(account.equity).toBe('$5000.00')
    expect(account.tradesToday).toBe(1)
    expect(account.maxTradesPerDay).toBe(3)
    expect(account.dailyLossLimit).toBe('$150.00')
    expect(account.killSwitch).toBe(false)
    expect(account.market).toBe('Session open')
    expect(account.clock).toBe('demo')
    expect(account.entryWindow).toBe('09:35–11:30')
  })

  test('reports a live clock when the session is not simulated', () => {
    expect(data(dispatch('read_account', {}, testContext({ simulated: false }))).clock).toBe('live')
  })
})
