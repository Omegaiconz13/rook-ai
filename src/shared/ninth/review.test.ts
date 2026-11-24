import { describe, expect, test } from 'bun:test'

import { SESSION_DATE } from '../market'
import { reviewSetup, reviewText } from './review'
import { journalRow, testContext, TEST_LIMITS } from './testctx'
import type { DeskSnapshot } from './types'

const review = (over: Partial<DeskSnapshot> = {}, argument?: string) => reviewSetup({ desk: testContext(over).desk, argument })

function record(over: Partial<DeskSnapshot> = {}, argument?: string) {
  const outcome = review(over, argument)
  if (!outcome.ok) throw new Error(outcome.why)
  return outcome.record
}

const role = (over: Partial<DeskSnapshot>, name: 'setup' | 'risk' | 'counter' | 'journal') => {
  const found = record(over).roles.find((entry) => entry.role === name)
  if (!found) throw new Error(`missing role ${name}`)
  return found.lines
}

describe('review', () => {
  test('reviews the setup that fired, in four fixed roles and that order', () => {
    const out = record()
    expect(out.setupId).toBe('TSLA-reclaim')
    expect(out.symbol).toBe('TSLA')
    expect(out.roles.map((entry) => entry.role)).toEqual(['setup', 'risk', 'counter', 'journal'])
    expect(out.headline).toContain('Review — TSLA')
    expect(out.headline).toContain('reclaim')
  })

  test('quotes the rule’s own levels and its R', () => {
    const lines = role({}, 'setup')
    expect(lines[0]).toContain('20-day reclaim')
    expect(lines[1]).toContain('entry 393.06')
    expect(lines[1]).toContain('stop 388.32')
    expect(lines[1]).toContain('target 402.54')
    expect(lines[1]).toContain('20-day average')
    expect(lines[2]).toContain('Risk 4.74 per share')
    expect(lines[2]).toContain('R 2.00')
  })

  test('quotes the gate’s verdict rather than an opinion about it', () => {
    const lines = role({}, 'risk')
    expect(lines[0]).toContain('Approved: 6 shares')
    expect(lines[0]).toContain('position cap set the size')
    expect(lines[1]).toContain('$28.44')
    expect(lines[2]).toContain('risk 10 · position 6 · cash 11')
  })

  test('names the rule and the sentence when the gate blocked', () => {
    const tight = { ...TEST_LIMITS, positionCapPct: 0 }
    const lines = role({ limits: tight }, 'risk')
    expect(lines[0]).toContain('Blocked by R-09')
    expect(lines[0]).toContain('Position cap allows at least one share')
    expect(lines[1]).toContain('no loss at a stop')
  })

  test('builds the counter-case from the replay and the clock, not from adjectives', () => {
    const lines = role({}, 'counter')
    expect(lines[0]).toBe('10,000 replays (seed 19): target first 15.1% · stop first 44% · average 0.06R.')
    expect(lines[1]).toContain('historical')
    expect(lines[2]).toContain('343 minutes to flat-by at 15:55')
    expect(lines[2]).toContain('scored stop-first')
  })

  test('counts today’s journal rows for the symbol', () => {
    const lines = role(
      {
        journal: [
          journalRow({ tradeId: 'trade-2', verdict: 'BLOCKED', gateRule: 'R-09', took: false, note: 'sized out' }),
          journalRow(),
        ],
      },
      'journal',
    )
    expect(lines[0]).toBe(`2 rows for TSLA on ${SESSION_DATE}: APPROVED ×1 · BLOCKED ×1.`)
    expect(lines[1]).toContain('BLOCKED (R-09)')
    expect(lines[1]).toContain('"sized out"')
  })

  test('says the journal is empty instead of inventing a history', () => {
    expect(role({}, 'journal')[0]).toContain('No rows for TSLA')
  })

  test('refuses a setup the rule did not fire, and says what happened instead', () => {
    const outcome = review({}, 'TSLA-orb')
    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('expected a refusal')
    expect(outcome.why).toContain('nothing to review')
    expect(outcome.why).toContain('opening range expired')
    expect(outcome.refs).toEqual(['setups:TSLA'])
  })

  test('refuses a symbol the desk does not trade', () => {
    const outcome = review({}, 'IBM')
    if (outcome.ok) throw new Error('expected a refusal')
    expect(outcome.why).toContain('IBM is not on the desk')
  })

  test('answers for another symbol’s setup by id', () => {
    const outcome = reviewSetup({ desk: testContext({ symbol: 'NVDA' }).desk, argument: 'TSLA-reclaim' })
    if (!outcome.ok) throw new Error(outcome.why)
    expect(outcome.record.symbol).toBe('TSLA')
  })

  test('prints a heading, four sections and a footer', () => {
    const text = reviewText(record())
    expect(text.startsWith('Review — TSLA')).toBe(true)
    for (const title of ['Setup', 'Risk', 'Counter-case', 'Journal']) expect(text).toContain(`\n${title}\n- `)
    expect(text).toContain('Read-only: four fixed roles')
  })

  test('names every source it read in its refs', () => {
    expect(record().refs).toEqual(['setup:TSLA-reclaim', 'gate', 'sim:TSLA-reclaim', 'journal:TSLA', 'limits'])
  })
})
