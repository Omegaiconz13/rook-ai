import { describe, expect, test } from 'bun:test'

import { COMFORT_SAMPLE, MIN_SAMPLE, percent, rateOf, wilson } from './stats'

describe('wilson interval', () => {
  test('five of ten sits at the centre with a wide interval', () => {
    const { low, high } = wilson(5, 10)
    expect(low).toBeCloseTo(0.2366, 3)
    expect(high).toBeCloseTo(0.7634, 3)
  })
  test('no samples covers the whole range instead of inventing a point', () => {
    expect(wilson(0, 0)).toEqual({ low: 0, high: 1 })
  })
  test('a clean sheet still has a floor', () => {
    const { low, high } = wilson(10, 10)
    expect(low).toBeCloseTo(0.7225, 3)
    expect(high).toBe(1)
  })
  test('no hits still has a ceiling', () => {
    const { low, high } = wilson(0, 10)
    expect(low).toBe(0)
    expect(high).toBeCloseTo(0.2775, 3)
  })
  test('the interval always contains the proportion and is ordered', () => {
    for (const [s, n] of [
      [1, 3],
      [7, 9],
      [18, 20],
      [3, 40],
    ] as const) {
      const { low, high } = wilson(s, n)
      expect(low).toBeLessThanOrEqual(s / n)
      expect(high).toBeGreaterThanOrEqual(s / n)
      expect(low).toBeLessThan(high)
    }
  })
  test('more samples narrow the interval', () => {
    const small = wilson(5, 10)
    const large = wilson(50, 100)
    expect(large.high - large.low).toBeLessThan(small.high - small.low)
  })
})

describe('rates', () => {
  test('below ten samples it refuses to report a percentage', () => {
    const r = rateOf('Hit rate', 2, 3)
    expect(r.reliable).toBe(false)
    expect(r.line).toBe(`Hit rate: 3 of ${MIN_SAMPLE} samples — no read yet.`)
  })
  test('ten or more samples carry N and the interval', () => {
    const r = rateOf('Hit rate', 12, 20)
    expect(r.reliable).toBe(true)
    expect(r.comfortable).toBe(false)
    expect(r.pct).toBe(60)
    expect(r.line).toBe('Hit rate: 60% (N=20, 95% CI 39–78%) · sample still small')
  })
  test('thirty or more samples drop the warning', () => {
    const r = rateOf('Hit rate', 18, COMFORT_SAMPLE)
    expect(r.comfortable).toBe(true)
    expect(r.line).toContain('N=30')
    expect(r.line).not.toContain('still small')
  })
  test('two halves that disagree are printed, not averaged away', () => {
    const hits = [...Array.from({ length: 9 }, () => true), ...Array.from({ length: 9 }, () => false)]
    const r = rateOf('Hit rate', 9, hits.length, hits)
    expect(r.n).toBe(18)
    expect(r.halves?.agree).toBe(false)
    expect(r.line).toContain('halves disagree')
  })
  test('two halves that agree are not flagged', () => {
    const hits = Array.from({ length: 20 }, (_, i) => i % 2 === 0)
    const r = rateOf('Hit rate', 10, hits.length, hits)
    expect(r.halves?.agree).toBe(true)
    expect(r.line).not.toContain('halves disagree')
  })
  test('percent keeps one decimal', () => {
    expect(percent(2 / 3)).toBe(66.7)
    expect(percent(1)).toBe(100)
  })
})
