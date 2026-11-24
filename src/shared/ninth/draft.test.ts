import { describe, expect, test } from 'bun:test'

import { INSTRUMENTS } from '../market'
import { deskSetups } from '../setups'
import { DRAFT_FAMILIES, draftStrategy, draftText } from './draft'
import { testContext } from './testctx'
import type { DeskSnapshot } from './types'

const draft = (text: string, over: Partial<DeskSnapshot> = {}) => draftStrategy({ text, desk: testContext(over).desk })

function ok(text: string, over: Partial<DeskSnapshot> = {}) {
  const outcome = draft(text, over)
  if (!outcome.ok) throw new Error(outcome.why)
  return outcome.draft
}

function why(text: string, over: Partial<DeskSnapshot> = {}) {
  const outcome = draft(text, over)
  if (outcome.ok) throw new Error('expected a refusal')
  return outcome.why
}

describe('draft', () => {
  test('drafts the rule that fired, with the levels the desk produced', () => {
    const out = ok('draft the reclaim on TSLA')
    expect(out.family).toBe('reclaim')
    expect(out.setupId).toBe('TSLA-reclaim')
    expect(out.pine).toContain('//@version=5')
    expect(out.pine).toContain('entry  = 393.06')
    expect(out.pine).toContain('stop   = 388.32')
    expect(out.pine).toContain('target = 402.54')
    expect(out.pine).toContain('ta.sma(close, 20)')
    expect(out.pine).toContain('strategy.exit("exit", "long", stop=stop, limit=target)')
  })

  test('takes the symbol from the question, not from the chart', () => {
    expect(ok('reclaim TSLA', { symbol: 'NVDA' }).symbol).toBe('TSLA')
  })

  test('falls back to the chart’s symbol when the question names none', () => {
    expect(ok('reclaim', { symbol: 'TSLA' }).symbol).toBe('TSLA')
  })

  test('refuses a rule that expired without an entry', () => {
    expect(why('orb on TSLA')).toContain('expired without an entry')
  })

  test('asks which rule instead of guessing one', () => {
    expect(why('TSLA')).toContain('which written rule')
  })

  test('refuses a ticker the desk does not trade', () => {
    expect(why('orb on IBM')).toContain('IBM is not on the desk')
  })

  test('refuses when the family produced no setup at all', () => {
    const all = deskSetups()
    const missing = INSTRUMENTS.flatMap((instrument) =>
      DRAFT_FAMILIES.map((family) => ({ symbol: instrument.symbol, family })),
    ).find(({ symbol, family }) => !all.some((setup) => setup.symbol === symbol && setup.family === family))
    if (!missing) throw new Error('every family fired on every symbol: this test needs new data')
    expect(why(`${missing.family} ${missing.symbol}`)).toContain(`produced no setup on ${missing.symbol}`)
  })

  test('prints the script, then the replay and what it does not model', () => {
    const text = draftText(ok('reclaim TSLA'))
    expect(text.startsWith('Draft — TSLA · 20-day reclaim')).toBe(true)
    expect(text).toContain('strategy("TSLA 20-day reclaim draft"')
    expect(text).toContain('Replay of the desk')
    expect(text).toContain('10,000 runs (seed 19)')
    expect(text).toContain('- no slippage: entries and exits fill at the exact level')
    expect(text).toContain('- a bar that spans the stop and the target is scored stop-first')
    expect(text).toContain('Pine was not run here')
  })
})
