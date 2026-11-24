import { describe, expect, test } from 'bun:test'

import { ask, runRoom, SEAT_ORDER } from './packet'
import type { Account, RiskLimits, SessionInfo, TradePlan } from './risk'

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

const run = (over: Partial<TradePlan> = {}, limits: RiskLimits = LIMITS) =>
  runRoom({ plan: plan(over), limits, account: ACCOUNT, session: OPEN, history: [] })

describe('seat order and format', () => {
  const { memo } = run()
  test('eight seats in the documented order', () => {
    expect(memo.notes.map((n) => n.role)).toEqual(SEAT_ORDER)
  })
  test('every note cites a packet field', () => {
    for (const n of memo.notes) expect(n.packetRef.length).toBeGreaterThan(3)
  })
  test('every note carries evidence or an explicit none', () => {
    for (const n of memo.notes) expect(Array.isArray(n.evidence)).toBe(true)
  })
  test('the risk gate is not a seat', () => {
    expect(memo.notes.some((n) => (n.role as string) === 'risk')).toBe(false)
  })
})

describe('memo rules', () => {
  test('a passing 2R plan on a live setup is approved, TAKE, and scored 3–5', () => {
    const { memo } = run({ setupId: 'TSLA-reclaim' })
    expect(memo.gate.verdict).toBe('approved')
    expect(memo.decision).toBe('TAKE')
    expect(memo.rubricScore).toBeGreaterThanOrEqual(3)
    expect(memo.rubricScore).toBeLessThanOrEqual(5)
  })

  test('a blocked 1R plan is PASS, scored 1–2, and names the rule', () => {
    const { memo } = run({ targetCents: 37_004, rMultiple: 1 })
    expect(memo.gate.ruleId).toBe('R-12')
    expect(memo.decision).toBe('PASS')
    expect(memo.rubricScore).toBeLessThanOrEqual(2)
    expect(memo.notes.find((n) => n.role === 'decider')?.reason).toContain('R-12')
  })

  test('no memo ever takes a blocked plan', () => {
    const cases = [
      run({ targetCents: 37_004 }),
      run({}, { ...LIMITS, minRewardRisk: 3 }),
    ]
    for (const { memo } of cases) {
      if (memo.gate.verdict === 'blocked') expect(memo.decision).toBe('PASS')
    }
  })

  test('the chief never claims an order was sent', () => {
    const { memo } = run()
    const chief = memo.notes.find((n) => n.role === 'chief')
    expect(chief?.reason).toContain('No order')
  })

  test('the counter-case is always present and cites a level', () => {
    for (const { memo } of [run(), run({ targetCents: 37_004 })]) {
      expect(memo.counterCase.length).toBeGreaterThan(20)
      expect(memo.counterCase).toMatch(/\d+\.\d{2}/)
    }
  })

  test('the trader refuses to size a blocked plan', () => {
    const { memo } = run({ targetCents: 37_004 })
    const trader = memo.notes.find((n) => n.role === 'trader')
    expect(trader?.verdict).toBe('block')
    expect(trader?.reason).toContain('No card')
  })

  test('the setup seat knows an expired setup', () => {
    const { memo } = run({ symbol: 'AAPL', setupId: 'AAPL-orb' })
    const setup = memo.notes.find((n) => n.role === 'setup')
    expect(setup?.verdict).toBe('block')
  })

  test('a blocking setup seat vetoes a plan the score would otherwise take', () => {
    const { memo } = run({ symbol: 'AAPL', setupId: 'AAPL-orb' })
    expect(memo.gate.verdict).toBe('approved')
    expect(memo.rubricScore).toBeGreaterThanOrEqual(3)
    expect(memo.decision).toBe('PASS')
    expect(memo.notes.find((n) => n.role === 'decider')?.reason).toContain('setup seat')
    expect(memo.notes.find((n) => n.role === 'chief')?.reason).toContain('setup seat')
  })

  test('no memo ever takes a plan whose setup seat blocks it', () => {
    for (const { memo } of [run(), run({ setupId: 'TSLA-reclaim' }), run({ symbol: 'AAPL', setupId: 'AAPL-orb' })]) {
      const setup = memo.notes.find((n) => n.role === 'setup')
      if (setup?.verdict === 'block') expect(memo.decision).toBe('PASS')
    }
  })
})

describe('score factors', () => {
  test('the factors add up to the memo score', () => {
    for (const { memo } of [run(), run({ targetCents: 37_004 })]) {
      expect(memo.factors.reduce((n, f) => n + f.points, 0)).toBe(memo.rubricScore)
    }
  })
  test('each factor appears once and stays inside its weight', () => {
    const { memo } = run()
    expect(new Set(memo.factors.map((f) => f.id)).size).toBe(memo.factors.length)
    for (const f of memo.factors) {
      expect(f.points).toBeGreaterThanOrEqual(0)
      expect(f.points).toBeLessThanOrEqual(f.max)
      expect(f.detail.length).toBeGreaterThan(3)
    }
  })
  test('a blocked plan earns nothing from the gate', () => {
    const { memo } = run({ targetCents: 37_004 })
    expect(memo.factors.find((f) => f.id === 'gate')?.points).toBe(0)
  })
  test('the analyst seat describes the last candle', () => {
    const { memo } = run()
    const analyst = memo.notes.find((n) => n.role === 'analyst')
    const text = analyst?.evidence.join(' ') ?? ''
    expect(text).toContain('ATR14')
    expect(text).toContain('last five closes')
  })
})

describe('determinism', () => {
  test('the same packet gives the same score, decision and notes', () => {
    const a = run()
    const b = run()
    expect(a.memo.rubricScore).toBe(b.memo.rubricScore)
    expect(a.memo.decision).toBe(b.memo.decision)
    expect(JSON.stringify(a.memo.notes)).toBe(JSON.stringify(b.memo.notes))
  })
})

describe('ask the desk', () => {
  const { packet, memo } = run()

  test('answers why a plan was blocked, with the rule', () => {
    const blocked = run({ targetCents: 37_004 })
    const a = ask(blocked.packet, blocked.memo, 'Why did you block this?')
    expect(a.answer).toContain('R-12')
    expect(a.refs).toContain('gate.ruleId')
  })

  test('answers sizing from the gate', () => {
    const a = ask(packet, memo, 'How many shares?')
    expect(a.answer).toContain('6 shares')
  })

  test('answers the target question with the R multiple', () => {
    expect(ask(packet, memo, 'What is the target?').answer).toContain('2.00R')
  })

  test('answers about the calendar', () => {
    expect(ask(packet, memo, 'Any news?').refs).toContain('news.blackout')
  })

  test('answers the suggested case-against question instead of refusing it', () => {
    const a = ask(packet, memo, 'What is the case against?')
    expect(a.refs).toContain('memo.counterCase')
    expect(a.answer).toContain(memo.counterCase)
  })

  test('refuses what the packet does not contain', () => {
    const a = ask(packet, memo, 'What will the market do tomorrow?')
    expect(a.refs).toEqual([])
    expect(a.answer).toContain('not in this packet')
  })
})
