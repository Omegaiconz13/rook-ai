import { describe, expect, test } from 'bun:test'

import type { RiskLimits } from './risk'
import { dailyLossCents, maxRiskCents, money, price, rewardRisk, signedMoney, sizeFor, usdToCents } from './sizing'

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

describe('money in cents', () => {
  test('max risk is 1% of 5,000', () => expect(maxRiskCents(LIMITS)).toBe(5000))
  test('daily loss is 3% of 5,000', () => expect(dailyLossCents(LIMITS)).toBe(15_000))
  test('formats dollars', () => expect(money(3516)).toBe('$35.16'))
  test('formats a loss', () => expect(money(-16_200)).toBe('-$162.00'))
  test('formats a signed gain', () => expect(signedMoney(1250)).toBe('+$12.50'))
  test('formats a price', () => expect(price(36_418)).toBe('364.18'))
  test('parses typed dollars once', () => expect(usdToCents('364.18')).toBe(36_418))
  test('rounds a typed dollar amount to cents', () => expect(usdToCents('35.155')).toBe(3516))
})

describe('sizing', () => {
  const sized = sizeFor(36_418, 586, LIMITS)

  test('eight shares fit the $50 risk budget', () => expect(sized.caps.risk).toBe(8))
  test('six shares fit the 50% position cap', () => expect(sized.caps.position).toBe(6))
  test('twelve shares fit the cash buffer', () => expect(sized.caps.cash).toBe(12))
  test('the smallest cap wins', () => expect(sized.size).toBe(6))
  test('the position cap is named as the decider', () => expect(sized.decidingLimit).toBe('position-cap'))
  test('loss at stop is exact', () => expect(sized.lossAtStopCents).toBe(3516))
  test('notional stays inside the cap', () => expect(sized.size * 36_418).toBeLessThanOrEqual(250_000))

  test('ties favour the risk budget', () => {
    const tight = sizeFor(1000, 500, { ...LIMITS, equityCents: 500_000, positionCapPct: 100, cashBufferPct: 0 })
    expect(tight.caps.risk).toBe(10)
    expect(tight.size).toBe(10)
    expect(tight.decidingLimit).toBe('risk-per-trade')
  })

  test('a zero-width stop sizes nothing', () => {
    expect(sizeFor(36_418, 0, LIMITS).size).toBe(0)
  })
})

describe('reward to risk', () => {
  test('a 2R target reads 2.00', () => expect(rewardRisk(36_418, 35_832, 37_590)).toBe(2))
  test('a 1R target reads 1.00', () => expect(rewardRisk(36_418, 35_832, 37_004)).toBe(1))
  test('a wide stop reads below one', () => expect(rewardRisk(36_418, 35_000, 37_590)).toBe(0.83))
  test('a zero stop reads zero', () => expect(rewardRisk(100, 100, 200)).toBe(0))
})
