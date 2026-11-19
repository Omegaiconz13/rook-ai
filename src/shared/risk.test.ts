import { describe, expect, test } from 'bun:test'

import type { Account, RiskLimits, SessionInfo, TradePlan } from './risk'
import { checkPlan } from './risk'

/*
  The worked examples in specs/001-ai-trading-desk/contracts/risk-engine.md.
  These numbers are the contract: if one changes, the spec changes first.
*/

const LIMITS: RiskLimits = {
  equityCents: 500_000,
  riskPerTradePct: 1,
  dailyLossPct: 3,
  positionCapPct: 50,
  cashBufferPct: 10,
  maxTradesPerDay: 3,
  minRewardRisk: 1.5,
  entryWindowStart: '09:35',
  entryWindowEnd: '11:30',
  flatBy: '15:55',
}

const ACCOUNT: Account = {
  equityCents: 500_000,
  dayPnlCents: 0,
  tradesToday: 0,
  riskUsedCents: 0,
  killSwitch: false,
  sessionDate: '2026-11-19',
}

const OPEN: SessionInfo = { state: 'open', nowEt: '10:12' }

function plan(overrides: Partial<TradePlan> = {}): TradePlan {
  const entryCents = 36_418
  const stopCents = 35_832
  const targetCents = 37_590
  return {
    id: 'plan-tsla',
    symbol: 'TSLA',
    direction: 'long',
    entryCents,
    stopCents,
    targetCents,
    riskPerShareCents: entryCents - stopCents,
    rMultiple: 2,
    setupId: 'TSLA-orb',
    status: 'draft',
    provenance: 'seed',
    ...overrides,
  }
}

const run = (over: Partial<Parameters<typeof checkPlan>[0]> = {}) =>
  checkPlan({ plan: plan(), limits: LIMITS, account: ACCOUNT, session: OPEN, history: [], ...over })

describe('worked example A — approved at 2R', () => {
  const v = run()
  test('approves six shares', () => expect(v.verdict).toBe('approved'))
  test('size is capped by the position cap', () => {
    expect(v.size).toBe(6)
    expect(v.decidingLimit).toBe('position-cap')
  })
  test('loss at stop is six shares at 5.86', () => expect(v.lossAtStopCents).toBe(3516))
  test('reward:risk is 2.00', () => expect(v.rewardRisk).toBe(2))
  test('reason names the limit', () => expect(v.reason).toBe('Approved 6 shares; position cap set the size.'))
  test('no rule id on an approval', () => expect(v.ruleId).toBeNull())
})

describe('worked example B — blocked at 1R', () => {
  const v = run({ plan: plan({ targetCents: 37_004, rMultiple: 1 }) })
  test('blocks on reward:risk', () => expect(v.ruleId).toBe('R-12'))
  test('reports no size', () => expect(v.size).toBeNull())
  test('message states both numbers', () => expect(v.reason).toBe('Reward:risk is 1.00, below your 1.50 minimum.'))
})

describe('worked example C — stop too wide for its reward', () => {
  const wide = plan({ stopCents: 35_000, riskPerShareCents: 1418 })
  const v = run({ plan: wide })
  test('sizes three shares before judging the target', () => expect(v.verdict).toBe('blocked'))
  test('still fails on reward:risk', () => expect(v.ruleId).toBe('R-12'))
})

describe('worked example D — daily loss already used', () => {
  const v = run({ account: { ...ACCOUNT, dayPnlCents: -16_200 } })
  test('blocks with R-04', () => expect(v.ruleId).toBe('R-04'))
  test('names the numbers', () => expect(v.reason).toBe('Daily loss limit used: $162.00 against a $150.00 limit.'))
})

describe('worked example E — kill switch', () => {
  const v = run({ account: { ...ACCOUNT, killSwitch: true } })
  test('blocks before sizing', () => {
    expect(v.ruleId).toBe('R-01')
    expect(v.size).toBeNull()
  })
})

describe('worked example F — outside the window', () => {
  test('blocks at 11:31', () => expect(run({ session: { state: 'open', nowEt: '11:31' } }).ruleId).toBe('R-02'))
  test('blocks when closed', () => expect(run({ session: { state: 'closed', nowEt: '16:10' } }).ruleId).toBe('R-02'))
})

describe('individual rules', () => {
  test('R-03 trade cap', () => {
    expect(run({ account: { ...ACCOUNT, tradesToday: 3 } }).ruleId).toBe('R-03')
  })
  test('R-05 no stop', () => {
    expect(run({ plan: plan({ stopCents: 0, riskPerShareCents: 36_418 }) }).ruleId).toBe('R-05')
  })
  test('R-06 stop above entry', () => {
    expect(run({ plan: plan({ stopCents: 36_500, riskPerShareCents: -82 }) }).ruleId).toBe('R-06')
  })
  test('R-08 stop wider than the risk budget', () => {
    const v = run({ plan: plan({ stopCents: 30_000, riskPerShareCents: 6418 }) })
    expect(v.ruleId).toBe('R-08')
  })
  test('R-09 position cap below one share', () => {
    const v = run({ limits: { ...LIMITS, positionCapPct: 5 } })
    expect(v.ruleId).toBe('R-09')
  })
  test('R-10 cash buffer below one share', () => {
    const v = run({ limits: { ...LIMITS, cashBufferPct: 95 } })
    expect(v.ruleId).toBe('R-10')
  })
  test('R-11 target below entry', () => {
    expect(run({ plan: plan({ targetCents: 36_000 }) }).ruleId).toBe('R-11')
  })
  test('R-13 duplicate ticket', () => {
    expect(run({ history: [{ symbol: 'TSLA', sessionDate: '2026-11-19' }] }).ruleId).toBe('R-13')
  })
  test('R-14 risk for the day would exceed the limit', () => {
    const v = run({ account: { ...ACCOUNT, riskUsedCents: 12_000 } })
    expect(v.ruleId).toBe('R-14')
  })
  test('R-15 past the flat-by time', () => {
    const v = run({ session: { state: 'open', nowEt: '15:56' }, limits: { ...LIMITS, entryWindowEnd: '16:00' } })
    expect(v.ruleId).toBe('R-15')
  })
})

describe('invariants', () => {
  test('a block never carries a size or deciding limit', () => {
    const cases = [
      run({ account: { ...ACCOUNT, killSwitch: true } }),
      run({ plan: plan({ targetCents: 37_004 }) }),
      run({ account: { ...ACCOUNT, dayPnlCents: -20_000 } }),
    ]
    for (const v of cases) {
      expect(v.verdict).toBe('blocked')
      expect(v.size).toBeNull()
      expect(v.decidingLimit).toBeNull()
      expect(v.ruleId).not.toBeNull()
    }
  })

  test('an approval fits the risk budget and any single cap', () => {
    const v = run()
    expect(v.size).toBeGreaterThanOrEqual(1)
    expect((v.size as number) * plan().riskPerShareCents).toBeLessThanOrEqual(50_00)
    expect(v.lossAtStopCents).toBeLessThanOrEqual(15_000)
  })

  test('identical inputs give identical verdicts', () => {
    const a = run()
    const b = run()
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  test('the engine never reads the clock', () => {
    const before = Date.now()
    const v = run()
    expect(Date.now() - before).toBeLessThan(1000)
    expect(v.checkedAt).toBeUndefined()
  })
})
