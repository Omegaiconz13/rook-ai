import { describe, expect, test } from 'bun:test'

import { MAX_RESULT_CHARS } from './types'
import { ok } from './result'
import { allTools, catalogLine, dispatch, toolByName, toolNames, toolsInSet } from './registry'
import { testContext } from './testctx'

function reason(name: string, args: unknown): string {
  const outcome = dispatch(name, args, testContext())
  if (outcome.ok) throw new Error(`expected a refusal for ${name}, got a result`)
  return outcome.why
}

describe('the registry', () => {
  test('lists the read tools under their names', () => {
    expect(toolNames()).toContain('get_quote')
    expect(toolByName('get_quote')?.tier).toBe(1)
    expect(toolsInSet('write')).toHaveLength(3)
    expect(allTools().length).toBe(toolNames().length)
  })

  test('writes a catalog line with arguments and tier', () => {
    const line = catalogLine(toolByName('get_quote')!)
    expect(line).toContain('get_quote(symbol:symbol, timeframe?:string)')
    expect(line).toContain('[tier 1]')
  })

  test('refuses a tool that does not exist, in words the model can use', () => {
    expect(reason('rm_rf', {})).toContain('No tool named "rm_rf"')
  })

  test('refuses a missing required argument', () => {
    expect(reason('get_quote', {})).toContain('Missing symbol')
  })

  test('refuses a symbol the desk does not trade', () => {
    expect(reason('get_quote', { symbol: 'DOGE' })).toContain("not one of the desk's instruments")
  })

  test('normalises a venue-prefixed ticker but refuses an empty one', () => {
    const outcome = dispatch('get_quote', { symbol: 'NASDAQ:TSLA' }, testContext())
    if (!outcome.ok) throw new Error(outcome.why)
    expect(outcome.data.symbol).toBe('TSLA')
    expect(reason('get_quote', { symbol: '   ' })).toContain('Missing symbol')
  })

  test('refuses a fractional share count rather than rounding it', () => {
    expect(reason('read_journal', { limit: 2.5 })).toContain('whole number')
  })

  test('refuses a number that is not finite', () => {
    expect(reason('read_journal', { limit: Number.POSITIVE_INFINITY })).toContain('finite number')
  })

  test('refuses a verdict outside the journal schema', () => {
    expect(reason('read_journal', { verdict: 'PROFITABLE' })).toContain('must be one of: APPROVED, BLOCKED, MANUAL')
  })

  test('ignores an unknown extra argument instead of failing the turn', () => {
    const outcome = dispatch('get_quote', { symbol: 'TSLA', mood: 'bullish' }, testContext())
    expect(outcome.ok).toBe(true)
  })

  test('caps a result at the budget and says it was cut', () => {
    const outcome = ok({ rows: 'x'.repeat(MAX_RESULT_CHARS + 500) })
    if (!outcome.ok) throw new Error(outcome.why)
    expect(outcome.data.truncated).toBe(true)
    expect(JSON.stringify(outcome.data).length).toBeLessThanOrEqual(MAX_RESULT_CHARS)
  })
})
