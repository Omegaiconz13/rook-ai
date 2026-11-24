import { describe, expect, test } from 'bun:test'

import type { ChartBar } from './chartfeed'
import { analyzeNinth, answerNinth } from './ninth'
import type { NinthContext } from './ninth'
import type { GateVerdict } from './risk'
import type { Setup } from './setups'

const bar = (time: number, close: number): ChartBar => ({ time, open: close, high: close, low: close, close })

const setup = (over: Partial<Setup> = {}): Setup => ({
  id: 'TSLA-orb',
  symbol: 'TSLA',
  family: 'orb',
  direction: 'long',
  triggerAt: '2026-11-19T14:45:00.000Z',
  entryCents: 54_441,
  stopCents: 54_160,
  targetCents: 55_003,
  riskPerShareCents: 281,
  rMultiple: 2,
  rangeHighCents: 54_441,
  rangeLowCents: 54_160,
  status: 'triggered',
  provenance: 'seed',
  ...over,
})

const ctx = (over: Partial<NinthContext> = {}): NinthContext => ({
  symbol: 'TSLA',
  timeframe: '5m',
  bars: [bar(1, 540), bar(2, 545.34)],
  levels: [
    { label: 'range high / entry', priceCents: 54_441 },
    { label: 'stop', priceCents: 54_160 },
    { label: 'target', priceCents: 55_003 },
  ],
  setups: [setup()],
  journal: [],
  gate: null,
  today: '2026-11-19',
  ...over,
})

const gate = (over: Partial<GateVerdict> = {}): GateVerdict => ({
  planId: 'plan-TSLA-orb',
  verdict: 'blocked',
  ruleId: 'R-05',
  reason: 'No stop on this plan. A trade without a stop is not checked.',
  size: null,
  decidingLimit: null,
  lossAtStopCents: null,
  rewardRisk: 2,
  ...over,
})

describe('answerNinth', () => {
  test('reads the levels the chart draws', () => {
    const answer = answerNinth('where are the levels?', ctx())
    expect(answer.text).toContain('Opening range rule')
    expect(answer.text).toContain('544.41')
    expect(answer.text).toContain('550.03')
    expect(answer.refs).toContain('levels:TSLA')
  })

  test('explains the gate before the levels when asked why it was blocked', () => {
    const answer = answerNinth('why was it blocked?', ctx({ gate: gate() }))
    expect(answer.text).toContain('R-05')
    expect(answer.text).toContain('blocked')
    expect(answer.refs).toContain('rule:R-05')
  })

  test('refuses to size a plan the gate has not seen', () => {
    const answer = answerNinth('how many shares?', ctx())
    expect(answer.text).toContain('will not estimate a size')
    expect(answer.text).not.toContain('shares.')
  })

  test('quotes the size and the reason when the gate approved the plan', () => {
    const answer = answerNinth('how many shares?', ctx({ gate: gate({ verdict: 'approved', ruleId: null, size: 6, reason: 'Approved 6 shares; position cap set the size.' }) }))
    expect(answer.text).toContain('approved 6 shares')
    expect(answer.refs).toContain('gate')
  })

  test('counts the journal instead of inventing trades', () => {
    const answer = answerNinth('what did I journal?', ctx())
    expect(answer.text).toContain('0 rows')
    expect(answer.text).toContain('journal is empty')
  })

  test('says no rule fired rather than inventing a setup', () => {
    const answer = answerNinth('any setups?', ctx({ setups: [] }))
    expect(answer.text).toContain('None of the four written rules')
  })

  test('quotes the last bar, not a forecast', () => {
    const answer = answerNinth('what is the price?', ctx())
    expect(answer.text).toContain('545.34')
    expect(answer.text).toContain('up 0.99%')
  })

  test('falls back to what it can read, and names that no model is connected', () => {
    const answer = answerNinth('should I buy?', ctx())
    expect(answer.text).toContain('No model is connected')
    expect(answer.text).not.toContain('you should')
  })
})

describe('analyzeNinth', () => {
  test('reads the quote, the rule and the levels in one pass', () => {
    const answer = analyzeNinth(ctx())
    expect(answer.text).toContain('545.34')
    expect(answer.text).toContain('entry 544.41')
    expect(answer.text).toContain('stop 541.60')
    expect(answer.text).toContain('target 550.03')
    expect(answer.text).toContain('2 to 1')
    expect(answer.refs).toContain('setup:TSLA-orb')
  })

  test('says nothing fired and keeps the setup out of its sources', () => {
    const answer = analyzeNinth(ctx({ setups: [], levels: [] }))
    expect(answer.text).toContain('No written rule fired')
    expect(answer.refs).not.toContain('setup:TSLA-orb')
  })

  test('names the gate rule that stopped the plan', () => {
    const answer = analyzeNinth(ctx({ gate: gate() }))
    expect(answer.text).toContain('R-05')
    expect(answer.refs).toContain('rule:R-05')
  })
})
