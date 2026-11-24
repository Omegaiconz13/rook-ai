import { checkPlan, RULES } from '../risk'
import type { Account, GateVerdict, RuleId, TradePlan } from '../risk'
import type { DeskSnapshot } from './types'

/*
  One verdict, one place. `gate_check` and Review both need the gate's answer on
  the setup the desk is showing, and a second copy of this call is how the two
  would start disagreeing. The account is built exactly as the Gate page builds
  it: equity always comes from the written limits, never from a stale snapshot.
*/

export function gateAccount(desk: DeskSnapshot): Account {
  return { ...desk.account, equityCents: desk.limits.equityCents }
}

export function verdictForPlan(desk: DeskSnapshot, plan: TradePlan): GateVerdict {
  return checkPlan({
    plan,
    limits: desk.limits,
    account: gateAccount(desk),
    session: desk.session,
    history: desk.confirmed.filter((entry) => entry.sessionDate === desk.today),
  })
}

/** The sentence a rule id stands for, or null when nothing blocked. */
export function ruleLabel(ruleId: RuleId | null): string | null {
  if (!ruleId) return null
  return RULES.find((rule) => rule.id === ruleId)?.label ?? null
}
