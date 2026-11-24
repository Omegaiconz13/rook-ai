import type { GateVerdict, TradePlan } from '../../risk'
import { dailyLossCents, DECIDING_LABEL, maxRiskCents, money, price, rewardRisk, sizeFor, usdToCents } from '../../sizing'
import { deskSetups, planFromSetup } from '../../setups'
import type { Setup } from '../../setups'
import { simulate } from '../../simulate'
import { num, str } from '../args'
import { fail, ok } from '../result'
import type { Args, ToolEntry, TurnContext } from '../types'
import { ruleLabel, verdictForPlan } from '../verdict'

/*
  Tier 2: the tools that decide. Every figure they return is produced by the
  function the desk already trusts — `checkPlan` for the verdict, `sizeFor` for
  the size, `rewardRisk` for R, `simulate` for the replay. None of them holds an
  opinion, and none of them can write: a decision here is a number, not an act.

  Prices are asked for in dollars because that is how a trader says them, and
  converted to integer cents once, at the boundary.
*/

function priceArg(args: Args, name: string): { cents?: number; why?: string } {
  const value = num(args, name)
  if (value === undefined) return {}
  if (value <= 0) return { why: `${name} must be a positive price in dollars, not ${value}.` }
  const cents = usdToCents(value)
  if (cents < 1) return { why: `${name} is below one cent, so there is no price to read.` }
  return { cents }
}

function setupFor(ctx: TurnContext, id: string): Setup | undefined {
  return ctx.desk.setups.find((setup) => setup.id === id) ?? deskSetups().find((setup) => setup.id === id)
}

/**
 * A plan from three prices, for a question about a trade no written rule
 * produced. It is marked `user` provenance and carries no setup id, so nothing
 * downstream can present it as a rule's own setup.
 */
function planFromPrices(args: Args, ctx: TurnContext): { plan?: TradePlan; why?: string } {
  const entry = priceArg(args, 'entry')
  const stop = priceArg(args, 'stop')
  const target = priceArg(args, 'target')
  const why = entry.why ?? stop.why ?? target.why
  if (why) return { why }
  if (entry.cents === undefined || stop.cents === undefined || target.cents === undefined) {
    return { why: 'Give either setupId, or all three of entry, stop and target in dollars.' }
  }
  const symbol = str(args, 'symbol') ?? ctx.desk.symbol
  return {
    plan: {
      id: `plan-ninth-${symbol}`,
      symbol,
      direction: 'long',
      entryCents: entry.cents,
      stopCents: stop.cents,
      targetCents: target.cents,
      riskPerShareCents: entry.cents - stop.cents,
      rMultiple: rewardRisk(entry.cents, stop.cents, target.cents),
      setupId: null,
      status: 'draft',
      provenance: 'user',
    },
  }
}

function verdictRow(verdict: GateVerdict, plan: TradePlan) {
  return {
    symbol: plan.symbol,
    planId: plan.id,
    setupId: plan.setupId,
    verdict: verdict.verdict,
    ruleId: verdict.ruleId,
    rule: ruleLabel(verdict.ruleId),
    reason: verdict.reason,
    size: verdict.size,
    decidingLimit: verdict.decidingLimit,
    decidingLabel: verdict.decidingLimit ? DECIDING_LABEL[verdict.decidingLimit] : null,
    lossAtStopCents: verdict.lossAtStopCents,
    lossAtStop: verdict.lossAtStopCents === null ? null : money(verdict.lossAtStopCents),
    rewardRisk: verdict.rewardRisk,
    plan: {
      entryCents: plan.entryCents,
      entry: price(plan.entryCents),
      stopCents: plan.stopCents,
      stop: price(plan.stopCents),
      targetCents: plan.targetCents,
      target: price(plan.targetCents),
      riskPerShare: price(plan.riskPerShareCents),
      rMultiple: plan.rMultiple,
    },
  }
}

const gateCheck: ToolEntry = {
  name: 'gate_check',
  set: 'decide',
  tier: 2,
  description: 'The gate’s verdict on a setup or a plan you quote, with the rule that decided it',
  args: {
    setupId: { type: 'string', desc: 'a setup id from list_setups, e.g. TSLA-reclaim' },
    symbol: { type: 'symbol', desc: 'the ticker for a plan you quote; the chart’s symbol when omitted' },
    entry: { type: 'number', desc: 'entry price in dollars, with stop and target' },
    stop: { type: 'number', desc: 'stop price in dollars' },
    target: { type: 'number', desc: 'target price in dollars' },
  },
  run: (args, ctx) => {
    const setupId = str(args, 'setupId')
    let plan: TradePlan
    if (setupId) {
      const setup = setupFor(ctx, setupId)
      if (!setup) {
        return fail(`No setup named "${setupId}" today. Call list_setups for the ids the rules produced.`, ['setups:desk'])
      }
      plan = planFromSetup(setup)
    } else {
      const built = planFromPrices(args, ctx)
      if (!built.plan) return fail(built.why as string, ['gate'])
      plan = built.plan
    }

    const verdict = verdictForPlan(ctx.desk, plan)
    return ok(verdictRow(verdict, plan), ['gate', verdict.ruleId ? `rule:${verdict.ruleId}` : 'sizing'])
  },
}

const sizePlan: ToolEntry = {
  name: 'size_plan',
  set: 'decide',
  tier: 2,
  description: 'How many whole shares fit your risk, position cap and cash buffer at a given entry and stop',
  args: {
    entry: { type: 'number', required: true, desc: 'entry price in dollars' },
    stop: { type: 'number', required: true, desc: 'stop price in dollars, below the entry' },
    symbol: { type: 'symbol', desc: 'the ticker being sized; the chart’s symbol when omitted' },
  },
  run: (args, ctx) => {
    const entry = priceArg(args, 'entry')
    const stop = priceArg(args, 'stop')
    const why = entry.why ?? stop.why
    if (why) return fail(why, ['sizing'])
    if (entry.cents === undefined || stop.cents === undefined) {
      return fail('Give both entry and stop in dollars.', ['sizing'])
    }
    if (stop.cents >= entry.cents) {
      return fail(`Stop ${price(stop.cents)} is at or above the entry ${price(entry.cents)} for a long, so there is no risk to size.`, [
        'sizing',
      ])
    }

    const riskPerShare = entry.cents - stop.cents
    const sizing = sizeFor(entry.cents, riskPerShare, ctx.desk.limits)
    return ok(
      {
        symbol: str(args, 'symbol') ?? ctx.desk.symbol,
        entryCents: entry.cents,
        entry: price(entry.cents),
        stopCents: stop.cents,
        stop: price(stop.cents),
        riskPerShareCents: riskPerShare,
        riskPerShare: price(riskPerShare),
        size: sizing.size,
        fits: sizing.size > 0,
        decidingLimit: sizing.decidingLimit,
        decidingLabel: DECIDING_LABEL[sizing.decidingLimit],
        lossAtStopCents: sizing.lossAtStopCents,
        lossAtStop: money(sizing.lossAtStopCents),
        caps: {
          risk: sizing.caps.risk,
          position: sizing.caps.position,
          cash: sizing.caps.cash,
        },
        budget: {
          riskPerTrade: money(maxRiskCents(ctx.desk.limits)),
          dailyLoss: money(dailyLossCents(ctx.desk.limits)),
          equity: money(ctx.desk.limits.equityCents),
        },
      },
      ['sizing', 'limits'],
    )
  },
}

const simulatePlan: ToolEntry = {
  name: 'simulate_plan',
  set: 'decide',
  tier: 2,
  description: 'Replay a setup 10,000 times on the sample sessions and print what the replay does not model',
  args: {
    setupId: { type: 'string', required: true, desc: 'a setup id from list_setups' },
    runs: { type: 'integer', desc: 'how many replays, 1,000 to 20,000; default 10,000' },
    seed: { type: 'integer', desc: 'reproduce an earlier replay with the same seed' },
  },
  run: (args, ctx) => {
    const setupId = str(args, 'setupId') as string
    const setup = setupFor(ctx, setupId)
    if (!setup) {
      return fail(`No setup named "${setupId}" today, so there is nothing to replay.`, ['setups:desk'])
    }
    const result = simulate({
      plan: planFromSetup(setup),
      runs: num(args, 'runs'),
      seed: num(args, 'seed'),
    })
    return ok(
      {
        symbol: result.symbol,
        setupId,
        runs: result.runs,
        seed: result.seed,
        targetFirst: result.targetFirst,
        stopFirst: result.stopFirst,
        neither: result.neither,
        avgR: result.avgR,
        bootstrap: result.bootstrap,
        historical: {
          occurrences: result.historicalOccurrences,
          wins: result.historicalWins,
          losses: result.historicalLosses,
          neither: result.historicalNeither,
        },
        verdictLine: result.verdictLine,
        // Stage 4 of the safety stack: a replay without its assumptions is a bug.
        assumptions: result.assumptions,
      },
      [`sim:${setupId}`, `setup:${setupId}`],
    )
  },
}

const rMultiple: ToolEntry = {
  name: 'r_multiple',
  set: 'decide',
  tier: 2,
  description: 'Reward:risk for three prices, rounded the way the desk rounds it',
  args: {
    entry: { type: 'number', required: true, desc: 'entry price in dollars' },
    stop: { type: 'number', required: true, desc: 'stop price in dollars, below the entry' },
    target: { type: 'number', required: true, desc: 'target price in dollars, above the entry' },
  },
  run: (args) => {
    const entry = priceArg(args, 'entry')
    const stop = priceArg(args, 'stop')
    const target = priceArg(args, 'target')
    const why = entry.why ?? stop.why ?? target.why
    if (why) return fail(why, ['sizing'])
    if (entry.cents === undefined || stop.cents === undefined || target.cents === undefined) {
      return fail('Give entry, stop and target in dollars.', ['sizing'])
    }
    if (stop.cents >= entry.cents) {
      return fail(`Stop ${price(stop.cents)} is at or above the entry ${price(entry.cents)} for a long.`, ['sizing'])
    }
    if (target.cents <= entry.cents) {
      return fail(`Target ${price(target.cents)} is not above the entry, so there is no reward to measure.`, ['sizing'])
    }
    return ok(
      {
        entryCents: entry.cents,
        entry: price(entry.cents),
        stopCents: stop.cents,
        stop: price(stop.cents),
        targetCents: target.cents,
        target: price(target.cents),
        riskPerShareCents: entry.cents - stop.cents,
        riskPerShare: price(entry.cents - stop.cents),
        rewardPerShare: price(target.cents - entry.cents),
        r: rewardRisk(entry.cents, stop.cents, target.cents),
      },
      ['sizing'],
    )
  },
}

export const DECIDE_TOOLS: ToolEntry[] = [gateCheck, sizePlan, simulatePlan, rMultiple]
