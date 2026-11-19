import { describe, expect, test } from 'bun:test'

import { barsFor, generatedBarsFor, generatedDailyFor } from './fixtures'
import type { Bar } from './market'
import { deskSetups, planFromSetup, setupsFor } from './setups'

// These cases pin the generator, not the shipped dataset: the worked example in
// the risk-engine contract is the generated session, so it stays exact.
const tsla = setupsFor('TSLA', generatedBarsFor('TSLA'), generatedDailyFor('TSLA'))
const orb = tsla.find((s) => s.family === 'orb')

describe('TSLA opening-range setup', () => {
  test('is found', () => expect(orb).toBeDefined())
  test('opening range matches the worked example', () => {
    expect(orb?.rangeHighCents).toBe(36_218)
    expect(orb?.rangeLowCents).toBe(35_447)
  })
  test('enters on the first 5-minute close above the range', () => expect(orb?.entryCents).toBe(36_418))
  test('stops at the range midpoint, rounded down', () => expect(orb?.stopCents).toBe(35_832))
  test('targets 2R', () => expect(orb?.targetCents).toBe(37_590))
  test('risk per share is 5.86', () => expect(orb?.riskPerShareCents).toBe(586))
  test('reads 2.00R', () => expect(orb?.rMultiple).toBe(2))
  test('is triggered inside the session', () => expect(orb?.status).toBe('triggered'))
})

describe('the desk', () => {
  const setups = deskSetups()

  test('every setup points the right way', () => {
    for (const s of setups) {
      expect(s.direction).toBe('long')
      expect(s.stopCents).toBeLessThan(s.entryCents)
      expect(s.targetCents).toBeGreaterThan(s.entryCents)
    }
  })
  test('triggered setups sort before expired ones', () => {
    const firstExpired = setups.findIndex((s) => s.status === 'expired')
    if (firstExpired >= 0) expect(setups.slice(firstExpired).every((s) => s.status === 'expired')).toBe(true)
  })
  test('a plan copies the levels without inventing any', () => {
    const setup = setups.find((s) => s.status === 'triggered')
    if (!setup) throw new Error('expected a triggered setup')
    const plan = planFromSetup(setup)
    expect(plan.entryCents).toBe(setup.entryCents)
    expect(plan.stopCents).toBe(setup.stopCents)
    expect(plan.targetCents).toBe(setup.targetCents)
    expect(plan.rMultiple).toBe(2)
  })
})

describe('gap-retest setups', () => {
  const gaps = deskSetups().filter((s) => s.family === 'fvg')

  test('every one is a long with the stop at the gap floor and a 2R target', () => {
    for (const s of gaps) {
      expect(s.direction).toBe('long')
      expect(s.rangeLowCents).toBe(s.stopCents)
      expect(s.stopCents).toBeLessThan(s.rangeHighCents)
      expect(s.entryCents).toBeGreaterThan(s.rangeHighCents)
      expect(s.targetCents).toBe(s.entryCents + 2 * (s.entryCents - s.stopCents))
    }
  })

  test('each trigger bar wicks into the gap and closes above it', () => {
    for (const s of gaps) {
      const bars = barsFor(s.symbol)
      const j = bars.findIndex((b) => b.start === s.triggerAt)
      expect(j).toBeGreaterThan(2)
      expect(bars[j].low).toBeLessThanOrEqual(s.rangeHighCents)
      expect(bars[j].close).toBe(s.entryCents)
    }
  })

  test('a synthetic three-bar gap is detected with its own levels', () => {
    const flat = (i: number): Bar => ({
      start: `2026-11-19T14:${String(30 + i).padStart(2, '0')}:00Z`,
      open: 10_000,
      high: 10_000,
      low: 9_999,
      close: 10_000,
      volume: 1_000,
    })
    const bars = Array.from({ length: 12 }, (_, i) => flat(i))
    bars[6] = { start: bars[6].start, open: 10_100, high: 10_120, low: 10_050, close: 10_100, volume: 1_000 }
    bars[7] = { start: bars[7].start, open: 10_100, high: 10_120, low: 10_020, close: 10_080, volume: 1_000 }

    const fvg = setupsFor('TEST', bars, []).find((s) => s.family === 'fvg')
    expect(fvg?.status).toBe('triggered')
    expect(fvg?.rangeLowCents).toBe(10_000)
    expect(fvg?.rangeHighCents).toBe(10_050)
    expect(fvg?.entryCents).toBe(10_080)
    expect(fvg?.stopCents).toBe(10_000)
    expect(fvg?.riskPerShareCents).toBe(80)
    expect(fvg?.targetCents).toBe(10_240)
  })

  test('a gap narrower than five basis points is ignored', () => {
    const flat = (i: number): Bar => ({
      start: `2026-11-19T14:${String(30 + i).padStart(2, '0')}:00Z`,
      open: 10_000,
      high: 10_000,
      low: 9_999,
      close: 10_000,
      volume: 1_000,
    })
    const bars = Array.from({ length: 12 }, (_, i) => flat(i))
    bars[6] = { start: bars[6].start, open: 10_002, high: 10_020, low: 10_002, close: 10_010, volume: 1_000 }
    bars[7] = { start: bars[7].start, open: 10_010, high: 10_030, low: 10_000, close: 10_020, volume: 1_000 }
    expect(setupsFor('TEST', bars, []).some((s) => s.family === 'fvg')).toBe(false)
  })
})

describe('the generated session is deterministic', () => {
  test('bars repeat exactly', () => {
    expect(JSON.stringify(generatedBarsFor('TSLA'))).toBe(JSON.stringify(generatedBarsFor('TSLA')))
  })
  test('a session has 78 five-minute bars', () => expect(generatedBarsFor('TSLA')).toHaveLength(78))
  test('every bar has a positive range', () => {
    for (const b of generatedBarsFor('NVDA')) {
      expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close))
      expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close))
    }
  })
  test('unknown symbols return nothing', () => expect(generatedBarsFor('ZZZZ')).toEqual([]))
})
