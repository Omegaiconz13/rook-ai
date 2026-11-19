import { describe, expect, test } from 'bun:test'

import type { Bar } from './market'
import type { GateVerdict, TradePlan } from './risk'
import { cancelTicket, confirmTicket, proposeTicket, replayAgainstSession, ticketProblem } from './ticket'

const plan: TradePlan = {
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
}

const verdict: GateVerdict = {
  planId: 'plan-tsla',
  verdict: 'approved',
  ruleId: null,
  reason: 'Approved 6 shares; position cap set the size.',
  size: 6,
  decidingLimit: 'position-cap',
  lossAtStopCents: 3516,
  rewardRisk: 2,
}

/** A bar at minute `i` with a chosen range. */
function bar(i: number, low: number, high: number, close?: number): Bar {
  const start = new Date(Date.UTC(2026, 10, 19, 15, 30 + i * 5)).toISOString()
  return { start, open: close ?? (low + high) / 2, high, low, close: close ?? (low + high) / 2, volume: 1000 }
}

const ticket = () =>
  proposeTicket({ plan, size: 6, sessionDate: '2026-11-19', createdAt: '2026-11-19T15:30:00Z', fillFrom: '2026-11-19T15:35:00Z', id: 't1' })

describe('proposal', () => {
  test('max loss is size × risk per share', () => {
    expect(ticket().maxLossCents).toBe(6 * 586)
  })
  test('a proposal is not a confirmation', () => {
    expect(ticket().state).toBe('proposed')
    expect(confirmTicket(ticket()).state).toBe('confirmed')
  })
  test('the size must match the gate', () => {
    expect(ticketProblem(ticket(), verdict)).toBeNull()
    expect(ticketProblem({ ...ticket(), size: 5, maxLossCents: 2930 }, verdict)).toContain('approved 6')
  })
  test('a bigger loss than the gate approved is refused', () => {
    expect(ticketProblem({ ...ticket(), maxLossCents: 9999 }, verdict)).toContain('larger')
  })
  test('a blocked verdict cannot be ticketed', () => {
    expect(ticketProblem(ticket(), { ...verdict, verdict: 'blocked', size: null, lossAtStopCents: null })).toContain('not approved')
  })
})

describe('replay', () => {
  test('a buy limit fills when a bar trades down to the entry', () => {
    const bars = [bar(1, 36_500, 36_600), bar(2, 36_400, 36_520)]
    const t = replayAgainstSession(ticket(), bars)
    expect(t.fillAt).toBe(bars[1].start)
    expect(t.fillCents).toBe(plan.entryCents)
    expect(t.state).toBe('closed')
  })
  test('no touch means nothing filled', () => {
    const t = replayAgainstSession(ticket(), [bar(1, 36_500, 36_700), bar(2, 36_800, 36_900)])
    expect(t.state).toBe('expired')
    expect(t.fillCents).toBeNull()
  })
  test('a later stop closes at −1R', () => {
    const bars = [bar(1, 36_400, 36_450), bar(2, 35_800, 36_420)]
    const t = replayAgainstSession(ticket(), bars)
    expect(t.exitReason).toBe('stop')
    expect(t.exitCents).toBe(plan.stopCents)
    expect(t.rResult).toBe(-1)
  })
  test('a later target closes at +2R', () => {
    const bars = [bar(1, 36_400, 36_450), bar(2, 36_430, 37_600)]
    const t = replayAgainstSession(ticket(), bars)
    expect(t.exitReason).toBe('target')
    expect(t.rResult).toBe(2)
  })
  test('a bar that spans both levels is scored as the stop', () => {
    const bars = [bar(1, 36_400, 36_450), bar(2, 35_800, 37_700)]
    expect(replayAgainstSession(ticket(), bars).exitReason).toBe('stop')
  })
  test('a session that never resolves exits flat at the last close', () => {
    const bars = [bar(1, 36_400, 36_450), bar(2, 36_500, 36_560, 36_550)]
    const t = replayAgainstSession(ticket(), bars)
    expect(t.exitReason).toBe('flat')
    expect(t.rResult).toBeCloseTo((36_550 - 36_418) / 586, 2)
  })
  test('a cancelled ticket is not replayed', () => {
    const cancelled = cancelTicket(ticket(), 'Kill switch engaged.')
    expect(replayAgainstSession(cancelled, [bar(1, 36_400, 36_450)])).toEqual(cancelled)
  })
})
