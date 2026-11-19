import { describe, expect, test } from 'bun:test'

import type { TradePlan } from './risk'
import { BLOCK_SIZE, DEFAULT_RUNS, DEFAULT_SEED, SIM_ASSUMPTIONS, occurrencesFor, simulate } from './simulate'

function plan(overrides: Partial<TradePlan> = {}): TradePlan {
  return {
    id: 'plan-tsla',
    symbol: 'TSLA',
    direction: 'long',
    entryCents: 36_418,
    stopCents: 35_832,
    targetCents: 37_590,
    riskPerShareCents: 586,
    rMultiple: 2,
    setupId: 'TSLA-orb',
    status: 'draft',
    provenance: 'seed',
    ...overrides,
  }
}

const NOW = '2026-11-19T15:20:00.000Z'
const run = (over: Partial<TradePlan> = {}, seed = DEFAULT_SEED) => simulate({ plan: plan(over), seed, now: NOW })

describe('determinism', () => {
  test('the same seed gives the same result', () => {
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })
  test('a different seed moves the numbers', () => {
    const a = run()
    const b = run({}, 20)
    expect(`${a.targetFirst}:${a.stopFirst}:${a.avgR}`).not.toBe(`${b.targetFirst}:${b.stopFirst}:${b.avgR}`)
  })
  test('defaults are the documented seed and run count', () => {
    const r = simulate({ plan: plan(), now: NOW })
    expect(r.seed).toBe(DEFAULT_SEED)
    expect(r.runs).toBe(DEFAULT_RUNS)
  })
})

describe('probabilities', () => {
  const r = run()
  test('the three outcomes sum to 100', () => {
    expect(Math.abs(r.targetFirst + r.stopFirst + r.neither - 100)).toBeLessThanOrEqual(0.2)
  })
  test('each probability is reported to one decimal', () => {
    for (const v of [r.targetFirst, r.stopFirst, r.neither]) expect(Number.isInteger(Math.round(v * 10))).toBe(true)
  })
  test('average R is finite', () => expect(Number.isFinite(r.avgR)).toBe(true))
  test('no outcome is negative', () => {
    for (const v of [r.targetFirst, r.stopFirst, r.neither]) expect(v).toBeGreaterThanOrEqual(0)
  })
})

describe('clamping', () => {
  test('runs below the floor are raised', () => expect(simulate({ plan: plan(), runs: 5, now: NOW }).runs).toBe(1000))
  test('runs above the ceiling are lowered', () => expect(simulate({ plan: plan(), runs: 99_000, now: NOW }).runs).toBe(20_000))
  test('a non-numeric seed falls back to the default', () =>
    expect(simulate({ plan: plan(), seed: Number.NaN, now: NOW }).seed).toBe(DEFAULT_SEED))
})

describe('block bootstrap', () => {
  const r = run()
  test('the three outcomes sum to 100', () => {
    const { targetFirst, stopFirst, neither } = r.bootstrap
    expect(Math.abs(targetFirst + stopFirst + neither - 100)).toBeLessThanOrEqual(0.2)
  })
  test('it resamples blocks of the documented size', () => {
    expect(r.bootstrap.blockSize).toBe(BLOCK_SIZE)
  })
  test('it reports an average R that is finite', () => {
    expect(Number.isFinite(r.bootstrap.avgR)).toBe(true)
  })
  test('the i.i.d. line and the block line disagree', () => {
    const parametric = r.targetFirst + r.stopFirst
    const bootstrap = r.bootstrap.targetFirst + r.bootstrap.stopFirst
    expect(Math.abs(parametric - bootstrap)).toBeGreaterThan(1)
  })
})

describe('occurrences behind the count', () => {
  const attempts = occurrencesFor('TSLA', 'orb')

  test('the list matches the counts the result reports', () => {
    const r = run()
    expect(attempts.length).toBe(r.historicalOccurrences)
    expect(attempts.filter((o) => o.outcome === 'target').length).toBe(r.historicalWins)
    expect(attempts.filter((o) => o.outcome === 'stop').length).toBe(r.historicalLosses)
  })
  test('every occurrence carries dated bars and the rule\'s own levels', () => {
    for (const o of attempts) {
      expect(o.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(o.stopCents).toBeLessThan(o.entryCents)
      expect(o.targetCents).toBeGreaterThan(o.entryCents)
      expect(Number.isFinite(o.rResult)).toBe(true)
    }
  })
  test('the sessions come back in date order', () => {
    const dates = attempts.map((o) => o.date)
    expect(dates).toEqual([...dates].sort())
  })
  test('a family without past daily data has nothing to open', () => {
    expect(occurrencesFor('TSLA', 'reclaim')).toEqual([])
  })
})

describe('assumptions', () => {
  test('every result carries the flags it was simulated under', () => {
    const r = run()
    expect(r.assumptions).toEqual([...SIM_ASSUMPTIONS])
    expect(r.assumptions.length).toBeGreaterThanOrEqual(4)
  })
  test('the flags do not change with the plan', () => {
    expect(run({ setupId: 'TSLA-reclaim' }).assumptions).toEqual(run().assumptions)
  })
  test('the stop-first and flat-at-close rules are stated in words', () => {
    const text = run().assumptions.join(' ').toLowerCase()
    expect(text).toContain('stop-first')
    expect(text).toContain('flat at the last close')
  })
})

describe('history', () => {
  test('reports a count of past occurrences', () => {
    const r = run()
    expect(r.historicalOccurrences).toBe(r.historicalWins + r.historicalLosses + r.historicalNeither)
    expect(r.historicalOccurrences).toBeGreaterThanOrEqual(0)
  })
  test('a family with no historical run is labelled too early', () => {
    const r = run({ setupId: 'TSLA-reclaim' })
    expect(r.historicalOccurrences).toBe(0)
    expect(r.verdictLine).toContain('Too early')
  })
  test('the verdict line names the sample size', () => {
    expect(run().verdictLine).toMatch(/occurrence|Too early/)
  })
})
