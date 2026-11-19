import type { Provenance, SessionState, Side } from './market'
import { dailyLossCents, maxRiskCents, money, price, rewardRisk, sizeFor } from './sizing'
import type { DecidingLimit } from './sizing'
import { inEntryWindow, pastFlatBy } from './time'

/*
  The risk gate. Pure functions, no clock, no network, no model: the same call
  runs in the browser and in the Worker and must return the same verdict.
  Contract: specs/001-ai-trading-desk/contracts/risk-engine.md
*/

export type PlanStatus = 'draft' | 'checked' | 'approved' | 'blocked' | 'ticketed'

export type TradePlan = {
  id: string
  symbol: string
  direction: Side
  entryCents: number
  stopCents: number
  targetCents: number
  riskPerShareCents: number
  rMultiple: number
  setupId: string | null
  status: PlanStatus
  provenance: Provenance
}

export type RiskLimits = {
  equityCents: number
  riskPerTradePct: number
  dailyLossPct: number
  positionCapPct: number
  cashBufferPct: number
  maxTradesPerDay: number
  minRewardRisk: number
  entryWindowStart: string
  entryWindowEnd: string
  flatBy: string
}

export type Account = {
  equityCents: number
  dayPnlCents: number
  tradesToday: number
  riskUsedCents: number
  killSwitch: boolean
  sessionDate: string
}

export type SessionInfo = { state: SessionState; nowEt: string }

export type RuleId =
  | 'R-01' | 'R-02' | 'R-03' | 'R-04' | 'R-05' | 'R-06' | 'R-07' | 'R-08'
  | 'R-09' | 'R-10' | 'R-11' | 'R-12' | 'R-13' | 'R-14' | 'R-15'

export type GateVerdict = {
  planId: string
  verdict: 'approved' | 'blocked'
  ruleId: RuleId | null
  reason: string
  size: number | null
  decidingLimit: DecidingLimit | null
  lossAtStopCents: number | null
  rewardRisk: number
  checkedAt?: string
}

export const RULES: { id: RuleId; label: string }[] = [
  { id: 'R-01', label: 'Kill switch is off' },
  { id: 'R-02', label: 'Market open and inside the entry window' },
  { id: 'R-03', label: 'Trade cap for the day' },
  { id: 'R-04', label: 'Daily loss limit not used' },
  { id: 'R-05', label: 'A stop is attached' },
  { id: 'R-06', label: 'Stop sits below the entry' },
  { id: 'R-07', label: 'Risk per share is positive' },
  { id: 'R-08', label: 'Stop fits the risk budget' },
  { id: 'R-09', label: 'Position cap allows at least one share' },
  { id: 'R-10', label: 'Cash buffer allows at least one share' },
  { id: 'R-11', label: 'Target sits above the entry' },
  { id: 'R-12', label: 'Reward:risk meets the minimum' },
  { id: 'R-13', label: 'No duplicate ticket on this symbol' },
  { id: 'R-14', label: "Today's risk still fits the limit" },
  { id: 'R-15', label: 'Before the flat-by time' },
]

export type CheckInput = {
  plan: TradePlan
  limits: RiskLimits
  account: Account
  session: SessionInfo
  history: { symbol: string; sessionDate: string }[]
}

function blocked(input: CheckInput, ruleId: RuleId, reason: string, rr: number): GateVerdict {
  return {
    planId: input.plan.id,
    verdict: 'blocked',
    ruleId,
    reason,
    size: null,
    decidingLimit: null,
    lossAtStopCents: null,
    rewardRisk: rr,
  }
}

export function checkPlan({ plan, limits, account, session, history }: CheckInput): GateVerdict {
  const entry = plan.entryCents
  const stop = plan.stopCents
  const target = plan.targetCents
  const rps = entry - stop
  const rr = rewardRisk(entry, stop, target)

  if (account.killSwitch) return blocked({ plan, limits, account, session, history }, 'R-01', 'Kill switch is on. Reset it before checking plans.', rr)
  if (session.state !== 'open') {
    return blocked({ plan, limits, account, session, history }, 'R-02', 'Market is closed. The session opens at 09:30 New York.', rr)
  }
  if (!inEntryWindow(session.nowEt, limits.entryWindowStart, limits.entryWindowEnd)) {
    return blocked(
      { plan, limits, account, session, history },
      'R-02',
      `Outside the entry window (${limits.entryWindowStart}–${limits.entryWindowEnd} New York).`,
      rr,
    )
  }
  if (account.tradesToday >= limits.maxTradesPerDay) {
    return blocked(
      { plan, limits, account, session, history },
      'R-03',
      `Trade cap reached: ${account.tradesToday} of ${limits.maxTradesPerDay} taken today.`,
      rr,
    )
  }
  const dayLoss = dailyLossCents(limits)
  if (-account.dayPnlCents >= dayLoss) {
    return blocked(
      { plan, limits, account, session, history },
      'R-04',
      `Daily loss limit used: ${money(-account.dayPnlCents)} against a ${money(dayLoss)} limit.`,
      rr,
    )
  }
  if (!stop || stop <= 0) return blocked({ plan, limits, account, session, history }, 'R-05', 'No stop on this plan. A trade without a stop is not checked.', rr)
  if (stop >= entry) {
    return blocked({ plan, limits, account, session, history }, 'R-06', `Stop ${price(stop)} is at or above the entry for a long.`, rr)
  }
  if (rps <= 0) return blocked({ plan, limits, account, session, history }, 'R-07', 'Stop is too close: risk per share is zero.', rr)

  const budget = maxRiskCents(limits)
  const sizing = sizeFor(entry, rps, limits)
  if (sizing.caps.risk < 1) {
    return blocked(
      { plan, limits, account, session, history },
      'R-08',
      `Stop too wide: risking ${money(budget)} allows 0 shares at ${money(rps)} per share.`,
      rr,
    )
  }
  if (sizing.caps.position < 1) {
    return blocked(
      { plan, limits, account, session, history },
      'R-09',
      `Position cap allows 0 shares at ${price(entry)}.`,
      rr,
    )
  }
  if (sizing.caps.cash < 1) return blocked({ plan, limits, account, session, history }, 'R-10', 'Cash buffer leaves no room for one share.', rr)
  if (target <= entry) {
    return blocked(
      { plan, limits, account, session, history },
      'R-11',
      `Target ${price(target)} is not above the entry; there is no reward to measure.`,
      rr,
    )
  }
  if (rr < limits.minRewardRisk) {
    return blocked(
      { plan, limits, account, session, history },
      'R-12',
      `Reward:risk is ${rr.toFixed(2)}, below your ${limits.minRewardRisk.toFixed(2)} minimum.`,
      rr,
    )
  }
  if (history.some((h) => h.symbol === plan.symbol)) {
    return blocked(
      { plan, limits, account, session, history },
      'R-13',
      `A ticket for ${plan.symbol} was already confirmed today.`,
      rr,
    )
  }
  if (account.riskUsedCents + sizing.lossAtStopCents > dayLoss) {
    return blocked(
      { plan, limits, account, session, history },
      'R-14',
      `This trade would put today's risk at ${money(account.riskUsedCents + sizing.lossAtStopCents)} against a ${money(dayLoss)} limit.`,
      rr,
    )
  }
  if (pastFlatBy(session.nowEt, limits.flatBy)) {
    return blocked(
      { plan, limits, account, session, history },
      'R-15',
      `Past your flat-by time (${limits.flatBy}). No new entries.`,
      rr,
    )
  }

  const label = sizing.decidingLimit === 'risk-per-trade' ? 'risk per trade' : sizing.decidingLimit === 'position-cap' ? 'position cap' : 'cash buffer'
  return {
    planId: plan.id,
    verdict: 'approved',
    ruleId: null,
    reason: `Approved ${sizing.size} ${sizing.size === 1 ? 'share' : 'shares'}; ${label} set the size.`,
    size: sizing.size,
    decidingLimit: sizing.decidingLimit,
    lossAtStopCents: sizing.lossAtStopCents,
    rewardRisk: rr,
  }
}
