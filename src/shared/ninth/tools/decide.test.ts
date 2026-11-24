import { describe, expect, test } from 'bun:test'

import { SIM_ASSUMPTIONS } from '../../simulate'
import { dispatch } from '../registry'
import { testContext } from '../testctx'
import type { ToolOutcome } from '../types'
import { DECIDE_TOOLS } from './decide'

function data(outcome: ToolOutcome): Record<string, unknown> {
  if (!outcome.ok) throw new Error(`expected ok, got: ${outcome.why}`)
  return outcome.data
}

function reason(outcome: ToolOutcome): string {
  if (outcome.ok) throw new Error('expected a refusal, got a result')
  return outcome.why
}

describe('the decide set', () => {
  test('is four tools, every one tier 2 and unable to write', () => {
    expect(DECIDE_TOOLS).toHaveLength(4)
    for (const tool of DECIDE_TOOLS) {
      expect(tool.set).toBe('decide')
      expect(tool.tier).toBe(2)
    }
  })
})

describe('gate_check', () => {
  test('approves the TSLA reclaim at the position cap, quoting the gate’s own numbers', () => {
    const outcome = dispatch('gate_check', { setupId: 'TSLA-reclaim' }, testContext())
    expect(outcome.ok).toBe(true)
    expect(data(outcome)).toMatchObject({
      symbol: 'TSLA',
      verdict: 'approved',
      ruleId: null,
      size: 6,
      decidingLimit: 'position-cap',
      decidingLabel: 'position cap',
      lossAtStop: '$28.44',
      rewardRisk: 2,
    })
    expect(outcome.refs).toContain('gate')
  })

  test('names the first rule that stopped the plan, and its plain-language label', () => {
    const ctx = testContext({
      account: { equityCents: 500_000, dayPnlCents: 0, tradesToday: 0, riskUsedCents: 0, killSwitch: true, sessionDate: '2026-11-19' },
    })
    const outcome = dispatch('gate_check', { setupId: 'TSLA-reclaim' }, ctx)
    expect(data(outcome)).toMatchObject({ verdict: 'blocked', ruleId: 'R-01', rule: 'Kill switch is off', size: null })
    expect(outcome.refs).toContain('rule:R-01')
  })

  test('blocks a thin reward at R-12 when the prices are quoted', () => {
    const outcome = dispatch('gate_check', { entry: 100, stop: 95, target: 106 }, testContext())
    const verdict = data(outcome)
    expect(verdict).toMatchObject({ verdict: 'blocked', ruleId: 'R-12', rewardRisk: 1.2 })
    expect(String(verdict.reason)).toContain('below your 1.50 minimum')
  })

  test('blocks a target under the entry at R-11', () => {
    expect(data(dispatch('gate_check', { entry: 100, stop: 95, target: 99 }, testContext()))).toMatchObject({
      verdict: 'blocked',
      ruleId: 'R-11',
    })
  })

  test('refuses a setup id that no rule produced', () => {
    expect(reason(dispatch('gate_check', { setupId: 'TSLA-moon' }, testContext()))).toContain('No setup named')
  })

  test('asks for a setup or three prices rather than guessing a plan', () => {
    expect(reason(dispatch('gate_check', {}, testContext()))).toContain('either setupId, or all three of entry, stop and target')
  })

  test('refuses a zero price instead of sizing it', () => {
    expect(reason(dispatch('gate_check', { entry: 0, stop: 95, target: 106 }, testContext()))).toContain(
      'positive price in dollars',
    )
  })
})

describe('size_plan', () => {
  test('reads the three caps and says which one decided', () => {
    const sizing = data(dispatch('size_plan', { entry: 393.06, stop: 388.32 }, testContext()))
    expect(sizing).toMatchObject({
      size: 6,
      decidingLimit: 'position-cap',
      decidingLabel: 'position cap',
      lossAtStop: '$28.44',
      riskPerShare: '4.74',
      caps: { risk: 10, position: 6, cash: 11 },
      budget: { riskPerTrade: '$50.00', dailyLoss: '$150.00', equity: '$5000.00' },
    })
  })

  test('says zero when the position cap allows no whole share', () => {
    expect(data(dispatch('size_plan', { entry: 3000, stop: 2999.99 }, testContext()))).toMatchObject({
      size: 0,
      fits: false,
      decidingLimit: 'position-cap',
      lossAtStop: '$0.00',
    })
  })

  test('refuses a stop above the entry', () => {
    expect(reason(dispatch('size_plan', { entry: 100, stop: 101 }, testContext()))).toContain('at or above the entry')
  })
})

describe('r_multiple', () => {
  test('rounds reward:risk the way the desk rounds it', () => {
    expect(data(dispatch('r_multiple', { entry: 393.06, stop: 388.32, target: 402.54 }, testContext()))).toMatchObject({
      r: 2,
      riskPerShare: '4.74',
      rewardPerShare: '9.48',
    })
  })

  test('refuses a target that carries no reward', () => {
    expect(reason(dispatch('r_multiple', { entry: 100, stop: 95, target: 100 }, testContext()))).toContain(
      'not above the entry',
    )
  })
})

describe('simulate_plan', () => {
  test('replays the setup and always prints the assumptions it ran under', () => {
    const result = data(dispatch('simulate_plan', { setupId: 'TSLA-reclaim', runs: 1000, seed: 19 }, testContext()))
    expect(result.symbol).toBe('TSLA')
    expect(result.runs).toBe(1000)
    expect(result.assumptions).toEqual([...SIM_ASSUMPTIONS])
    expect(Number(result.targetFirst) + Number(result.stopFirst) + Number(result.neither)).toBeCloseTo(100, 0)
    expect(String(result.verdictLine).length).toBeGreaterThan(0)
  })

  test('is reproducible for the same seed', () => {
    const first = data(dispatch('simulate_plan', { setupId: 'TSLA-reclaim', runs: 1000, seed: 7 }, testContext()))
    const second = data(dispatch('simulate_plan', { setupId: 'TSLA-reclaim', runs: 1000, seed: 7 }, testContext()))
    expect(second.targetFirst).toBe(first.targetFirst)
    expect(second.avgR).toBe(first.avgR)
    expect(second.bootstrap).toEqual(first.bootstrap)
  })

  test('refuses to replay a setup that does not exist', () => {
    expect(reason(dispatch('simulate_plan', { setupId: 'TSLA-moon' }, testContext()))).toContain(
      'nothing to replay',
    )
  })
})
