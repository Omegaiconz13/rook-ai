import { barsFor, dailyFor, prevCloseFor } from './fixtures'
import type { Blackout, CalendarEvent, NewsItem } from './news'
import { blackoutFor, CALENDAR, headlinesFor, regimeFor } from './news'
import type { Account, GateVerdict, RiskLimits, SessionInfo, TradePlan } from './risk'
import { checkPlan } from './risk'
import type { Setup, SetupFamily } from './setups'
import { FAMILY_LABEL, setupsFor } from './setups'
import { money, price } from './sizing'
import { inEntryWindow } from './time'

/*
  The room. Eight seats read one packet and write fixed-format notes; the risk
  gate sits between the trader and the decider and cannot be overruled. Every
  note cites the packet field it used, and the memo always carries the
  strongest point against the trade.

  Everything here is deterministic: the same packet produces the same notes and
  the same score, with no model call and no clock read.
*/

export type SeatRole = 'analyst' | 'news' | 'setup' | 'bull' | 'bear' | 'trader' | 'decider' | 'chief'

export const SEAT_ORDER: SeatRole[] = ['analyst', 'news', 'setup', 'bull', 'bear', 'trader', 'decider', 'chief']

export const SEAT_TITLE: Record<SeatRole, string> = {
  analyst: 'Analyst',
  news: 'News & calendar',
  setup: 'Setup & rules',
  bull: 'Bull',
  bear: 'Bear',
  trader: 'Trader',
  decider: 'Decider',
  chief: 'Chief',
}

export type SeatNote = {
  role: SeatRole
  title: string
  verdict: 'pass' | 'block' | 'info'
  reason: string
  evidence: string[]
  packetRef: string
}

export type Packet = {
  plan: TradePlan
  gate: GateVerdict
  limits: RiskLimits
  account: Account
  session: SessionInfo
  setup: Setup | null
  regime: ReturnType<typeof regimeFor>
  blackout: Blackout
  news: NewsItem[]
  calendar: CalendarEvent[]
  reading: CandleReading | null
}

export type FactorId = 'gate' | 'reward' | 'calendar' | 'setup'

/** One named contribution to the memo score, with its weight and its reason. */
export type Factor = { id: FactorId; label: string; points: number; max: number; detail: string }

export type Memo = {
  id: string
  planId: string
  gate: GateVerdict
  notes: SeatNote[]
  factors: Factor[]
  rubricScore: number
  decision: 'TAKE' | 'PASS'
  counterCase: string
  createdAt: string
}

export type RoomResult = { packet: Packet; memo: Memo }

export type CandleReading = {
  bodyCents: number
  upperWickCents: number
  lowerWickCents: number
  /** Percent of the bar's range where the close sits: 0 = the low, 100 = the high. */
  closeInRange: number
  rangeVsAtr: number
  gapCents: number
  pattern: string
  sequence: string
}

/**
 * The last candle, described rather than shown. A reader who cannot see the
 * chart still gets body, wicks, close position, range against ATR, the session
 * gap and the last five closes in order.
 */
export function candleReading(symbol: string): CandleReading | null {
  const bars = barsFor(symbol)
  if (bars.length < 15) return null

  const last = bars[bars.length - 1]
  const prev = bars[bars.length - 2]
  const range = last.high - last.low
  const recent = bars.slice(-15)
  const trueRanges = recent.slice(1).map((bar, i) => {
    const before = recent[i]
    return Math.max(bar.high - bar.low, Math.abs(bar.high - before.close), Math.abs(bar.low - before.close))
  })
  const atr = trueRanges.reduce((n, r) => n + r, 0) / trueRanges.length

  const pattern =
    last.high > prev.high && last.low < prev.low
      ? 'outside bar'
      : last.high < prev.high && last.low > prev.low
        ? 'inside bar'
        : last.close > prev.close
          ? 'higher close'
          : last.close < prev.close
            ? 'lower close'
            : 'unchanged close'

  return {
    bodyCents: Math.abs(last.close - last.open),
    upperWickCents: last.high - Math.max(last.open, last.close),
    lowerWickCents: Math.min(last.open, last.close) - last.low,
    closeInRange: range > 0 ? Math.round(((last.close - last.low) / range) * 100) : 50,
    rangeVsAtr: atr > 0 ? Math.round((range / atr) * 10) / 10 : 0,
    gapCents: bars[0].open - prevCloseFor(symbol),
    pattern,
    sequence: bars
      .slice(-5)
      .map((b) => (b.close > b.open ? 'up' : b.close < b.open ? 'down' : 'flat'))
      .join(' '),
  }
}

function signedPrice(cents: number): string {
  return `${cents >= 0 ? '+' : '−'}${price(Math.abs(cents))}`
}

export type RoomInput = {
  plan: TradePlan
  limits: RiskLimits
  account: Account
  session: SessionInfo
  history: { symbol: string; sessionDate: string }[]
}

function findSetup(plan: TradePlan): Setup | null {
  const setups = setupsFor(plan.symbol, barsFor(plan.symbol), dailyFor(plan.symbol))
  if (plan.setupId) return setups.find((s) => s.id === plan.setupId) ?? null
  return setups.find((s) => s.family === 'orb') ?? null
}

/**
 * The setup seat's veto: a written setup that expired before a trigger blocks
 * the plan. The decider may not outvote that with the score, so a run whose
 * setup seat says "blocks" can only end in PASS.
 */
export function setupVeto(setup: Setup | null): boolean {
  return setup !== null && setup.status === 'expired'
}

function priorHighCents(symbol: string): number {
  const daily = dailyFor(symbol)
  return daily.slice(-5).reduce((m, d) => Math.max(m, d.close), 0)
}

function nextEvent(blackout: Blackout): string {
  const next = CALENDAR.find((e) => e.impact === 'high')
  if (blackout) return `${blackout.label} at ${blackout.at} New York`
  return next ? `${next.label} at ${next.at} New York, outside your window` : 'no high-impact event on the calendar'
}

function buildNotes(packet: Packet, counterCase: string, score: number, decision: 'TAKE' | 'PASS'): SeatNote[] {
  const { plan, gate, limits, setup, regime, blackout, news, reading } = packet
  const bars = barsFor(plan.symbol)
  const opening = bars.slice(0, 3)
  const rangeHigh = setup?.rangeHighCents ?? Math.max(...opening.map((b) => b.high))
  const rangeLow = setup?.rangeLowCents ?? Math.min(...opening.map((b) => b.low))
  const last = bars[bars.length - 1]
  const priorHigh = priorHighCents(plan.symbol)
  const family: SetupFamily | null = setup?.family ?? null
  const veto = setupVeto(setup)

  const analyst: SeatNote = {
    role: 'analyst',
    title: SEAT_TITLE.analyst,
    verdict: 'info',
    reason: `${regime === 'trend' ? 'Trend' : regime === 'range' ? 'Range' : regime === 'quiet' ? 'Quiet' : 'Event'} session: last print ${price(last?.close ?? plan.entryCents)}, ${(last?.close ?? 0) >= rangeHigh ? 'above' : 'inside'} the opening range.`,
    evidence: [
      `opening range ${price(rangeLow)}–${price(rangeHigh)}`,
      `prior close ${price(prevCloseFor(plan.symbol))}`,
      `${bars.length} five-minute bars in the session`,
      ...(reading
        ? [
            `last bar ${reading.pattern}: body ${price(reading.bodyCents)}, wicks ${price(reading.upperWickCents)}/${price(reading.lowerWickCents)}`,
            `close at ${reading.closeInRange}% of the bar, range ${reading.rangeVsAtr.toFixed(1)}× ATR14, session gap ${signedPrice(reading.gapCents)}`,
            `last five closes ${reading.sequence}`,
          ]
        : []),
    ],
    packetRef: 'market.regime',
  }

  const newsSeat: SeatNote = blackout
    ? {
        role: 'news',
        title: SEAT_TITLE.news,
        verdict: 'block',
        reason: `High-impact release inside your window: ${blackout.label} at ${blackout.at} New York.`,
        evidence: [blackout.label, `window ${limits.entryWindowStart}–${limits.entryWindowEnd}`],
        packetRef: 'news.blackout',
      }
    : {
        role: 'news',
        title: SEAT_TITLE.news,
        verdict: 'pass',
        reason: `No high-impact release inside ${limits.entryWindowStart}–${limits.entryWindowEnd}. Next: ${nextEvent(blackout)}.`,
        evidence: news.length ? news.slice(0, 2).map((n) => `${n.at} ${n.title}`) : ['No sample headlines for this symbol.'],
        packetRef: 'news.blackout',
      }

  const setupSeat: SeatNote = !setup
    ? {
        role: 'setup',
        title: SEAT_TITLE.setup,
        verdict: 'info',
        reason: 'No written setup matched these levels; this is a manual plan, so only the gate and your limits apply.',
        evidence: ['manual levels'],
        packetRef: 'setup.status',
      }
    : veto
      ? {
          role: 'setup',
          title: SEAT_TITLE.setup,
          verdict: 'block',
          reason: `The ${FAMILY_LABEL[setup.family].toLowerCase()} setup expired; the entry window closed before a trigger.`,
          evidence: [`trigger window ended ${limits.entryWindowEnd}`, `range high ${price(rangeHigh)}`],
          packetRef: 'setup.status',
        }
      : {
          role: 'setup',
          title: SEAT_TITLE.setup,
          verdict: 'pass',
          reason: `${FAMILY_LABEL[setup.family]} matched: close ${price(plan.entryCents)} beyond ${price(rangeHigh)}, stop at ${price(plan.stopCents)}.`,
          evidence: [`family ${family ?? 'orb'}`, `status ${setup.status}`, `2R target ${price(plan.targetCents)}`],
          packetRef: 'setup.status',
        }

  const bull: SeatNote = gate.size
    ? {
        role: 'bull',
        title: SEAT_TITLE.bull,
        verdict: 'pass',
        reason: `Best case: ${gate.size} shares risk ${money(gate.lossAtStopCents ?? 0)} to make ${money((plan.targetCents - plan.entryCents) * gate.size)} at the target.`,
        evidence: [`reward ${price(plan.targetCents - plan.entryCents)} per share`, `achieved ${gate.rewardRisk.toFixed(2)}R`],
        packetRef: 'gate.size',
      }
    : {
        role: 'bull',
        title: SEAT_TITLE.bull,
        verdict: 'info',
        reason: `Best case: the break holds and the stop is only ${price(plan.entryCents - plan.stopCents)} away. No size was approved to express it.`,
        evidence: [`risk per share ${price(plan.entryCents - plan.stopCents)}`],
        packetRef: 'plan.stopCents',
      }

  const bear: SeatNote = {
    role: 'bear',
    title: SEAT_TITLE.bear,
    verdict: blackout || plan.targetCents > priorHigh ? 'block' : 'info',
    reason: counterCase,
    evidence: [`highest close of the last five sessions ${price(priorHigh)}`, `target ${price(plan.targetCents)}`],
    packetRef: 'memo.counterCase',
  }

  const trader: SeatNote = gate.size
    ? {
        role: 'trader',
        title: SEAT_TITLE.trader,
        verdict: 'pass',
        reason: `Conditional card: buy ${gate.size} at ${price(plan.entryCents)}, stop ${price(plan.stopCents)}, target ${price(plan.targetCents)}, flat by ${limits.flatBy}.`,
        evidence: [`size ${gate.size}`, `max loss ${money(gate.lossAtStopCents ?? 0)}`, `set by ${gate.decidingLimit}`],
        packetRef: 'gate.size',
      }
    : {
        role: 'trader',
        title: SEAT_TITLE.trader,
        verdict: 'block',
        reason: 'No card. The gate blocked the plan, so there is nothing to size and nothing to send.',
        evidence: [`gate ${gate.ruleId ?? 'blocked'}`],
        packetRef: 'gate.ruleId',
      }

  const decider: SeatNote = {
    role: 'decider',
    title: SEAT_TITLE.decider,
    verdict: decision === 'TAKE' ? 'pass' : 'block',
    reason:
      decision === 'TAKE'
        ? `${score}/5. The gate cleared the size and the strongest case against is written below.`
        : `${score}/5. ${
            gate.verdict === 'blocked'
              ? `The gate blocked it at ${gate.ruleId}: ${gate.reason}`
              : veto
                ? `The setup seat blocked it: the ${(family ? FAMILY_LABEL[family] : 'written').toLowerCase()} setup expired before a trigger, and no score outvotes a blocking seat.`
                : 'The case against is stronger than the case for, so the plan passes.'
          }`,
    evidence: [`rubric ${score}`, `gate ${gate.verdict}`, `R ${gate.rewardRisk.toFixed(2)}`],
    packetRef: 'memo.rubricScore',
  }

  const chief: SeatNote = {
    role: 'chief',
    title: SEAT_TITLE.chief,
    verdict: decision === 'TAKE' ? 'pass' : 'block',
    reason:
      decision === 'TAKE'
        ? `Checks complete in order. ${gate.size} shares cleared for a paper ticket. No order was sent, and none can be sent from this demo.`
        : `Line stopped at ${gate.ruleId ?? (veto ? 'the setup seat' : 'the decider')}. No memo authorises size. No order was sent.`,
    evidence: ['seats ran in order', 'paper only'],
    packetRef: 'memo.decision',
  }

  return [analyst, newsSeat, setupSeat, bull, bear, trader, decider, chief]
}

/**
 * The five points, each with a name and a weight. Four factors, five points:
 * the gate is worth two because it can stop the plan on its own. Nothing is
 * averaged, so the memo shows the arithmetic that produced its score.
 */
export function factorsFor(gate: GateVerdict, limits: RiskLimits, blackout: Blackout, setup: Setup | null): Factor[] {
  return [
    {
      id: 'gate',
      label: 'Risk gate',
      points: gate.verdict === 'approved' ? 2 : 0,
      max: 2,
      detail: gate.verdict === 'approved' ? `approved by ${gate.decidingLimit}` : `blocked at ${gate.ruleId}`,
    },
    {
      id: 'reward',
      label: 'Reward:risk',
      points: gate.rewardRisk >= limits.minRewardRisk ? 1 : 0,
      max: 1,
      detail: `${gate.rewardRisk.toFixed(2)}R against your ${limits.minRewardRisk.toFixed(2)} minimum`,
    },
    {
      id: 'calendar',
      label: 'Calendar',
      points: blackout ? 0 : 1,
      max: 1,
      detail: blackout ? `${blackout.label} inside the window` : 'no high-impact release inside the window',
    },
    {
      id: 'setup',
      label: 'Written setup',
      points: setup?.status === 'triggered' ? 1 : 0,
      max: 1,
      detail: setup ? `${FAMILY_LABEL[setup.family].toLowerCase()}, ${setup.status}` : 'manual levels, no setup matched',
    },
  ]
}

export function runRoom(input: RoomInput): RoomResult {
  const { plan, limits, account, session, history } = input
  const setup = findSetup(plan)
  const gate = checkPlan({ plan, limits, account, session, history })
  const blackout = blackoutFor(limits.entryWindowStart, limits.entryWindowEnd)
  const packet: Packet = {
    plan,
    gate,
    limits,
    account,
    session,
    setup,
    regime: regimeFor(barsFor(plan.symbol)),
    blackout,
    news: headlinesFor(plan.symbol),
    calendar: CALENDAR,
    reading: candleReading(plan.symbol),
  }

  const priorHigh = priorHighCents(plan.symbol)
  const counterCase =
    plan.targetCents > priorHigh
      ? `The target ${price(plan.targetCents)} sits ${price(plan.targetCents - priorHigh)} above the highest close of the last five sessions (${price(priorHigh)}); that level usually takes more than one attempt.`
      : `The stop at ${price(plan.stopCents)} sits inside the opening range, where the first pullback of the session usually trades.`

  const factors = factorsFor(gate, limits, blackout, setup)
  const score = factors.reduce((n, f) => n + f.points, 0)
  const decision: 'TAKE' | 'PASS' =
    gate.verdict === 'approved' && score >= 3 && !setupVeto(setup) ? 'TAKE' : 'PASS'
  const notes = buildNotes(packet, counterCase, score, decision)

  return {
    packet,
    memo: {
      id: crypto.randomUUID(),
      planId: plan.id,
      gate,
      notes,
      factors,
      rubricScore: score,
      decision,
      counterCase,
      createdAt: new Date().toISOString(),
    },
  }
}

export type Answer = { answer: string; refs: string[] }

const OUT_OF_SCOPE =
  "That is not in this packet. The desk answers from the plan, the gate, the setup and the session it has, and it will not guess beyond them."

/** Grounded Q&A: keyword-matched answers that cite the packet field they used. */
export function ask(packet: Packet, memo: Memo, question: string): Answer {
  const q = question.toLowerCase()
  const { plan, gate, limits, setup, blackout, news, regime } = packet
  const veto = setupVeto(setup)

  if (/why|block|refus|rule|gate/.test(q)) {
    if (gate.verdict === 'blocked') {
      return {
        answer: `The gate blocked this plan at **${gate.ruleId}**: ${gate.reason} It runs before any size is calculated, so there is nothing to argue with.`,
        refs: ['gate.ruleId', 'gate.reason'],
      }
    }
    return {
      answer: `Nothing blocked it at the gate. All fifteen rules passed and **${gate.decidingLimit}** set the size at ${gate.size} shares. ${
        veto && setup
          ? `The setup seat still blocks it — the ${FAMILY_LABEL[setup.family].toLowerCase()} setup expired before a trigger — so the memo reads PASS whatever the score.`
          : `The decider's score is ${memo.rubricScore}/5.`
      }`,
      refs: ['gate.verdict', 'gate.decidingLimit', 'memo.rubricScore'],
    }
  }

  if (/case against|against|counter/.test(q)) {
    return {
      answer: `The strongest case against: “${memo.counterCase}” The memo scores ${memo.rubricScore}/5 and reads **${memo.decision}**.`,
      refs: ['memo.counterCase', 'memo.rubricScore'],
    }
  }

  if (/size|share|position|how many|risk/.test(q)) {
    if (!gate.size) {
      return {
        answer: `No size exists for this plan. The gate refused it at **${gate.ruleId}**, and blocked plans never carry a share count.`,
        refs: ['gate.size'],
      }
    }
    return {
      answer: `**${gate.size} shares**, capped by the ${gate.decidingLimit}. The loss at the stop is **${money(gate.lossAtStopCents ?? 0)}**, and today's total risk stays inside your ${limits.dailyLossPct}% daily limit.`,
      refs: ['gate.size', 'gate.lossAtStopCents'],
    }
  }

  if (/stop/.test(q)) {
    return {
      answer: `The stop is **${price(plan.stopCents)}**, ${price(plan.entryCents - plan.stopCents)} under the entry. That distance is what the size came from, not a round number that looked tidy.`,
      refs: ['plan.stopCents', 'plan.riskPerShareCents'],
    }
  }

  if (/target|reward|r:r|ratio/.test(q)) {
    return {
      answer: `The target is **${price(plan.targetCents)}**, which is ${gate.rewardRisk.toFixed(2)}R against your ${limits.minRewardRisk.toFixed(2)} minimum. ${gate.rewardRisk < limits.minRewardRisk ? 'That is below the minimum, which is why R-12 blocks it.' : 'It clears the minimum.'}`,
      refs: ['plan.targetCents', 'gate.rewardRisk'],
    }
  }

  if (/news|event|calendar|blackout/.test(q)) {
    return {
      answer: blackout
        ? `There is a blackout: **${blackout.label}** at ${blackout.at} New York sits inside your entry window.`
        : `No high-impact release sits inside ${limits.entryWindowStart}–${limits.entryWindowEnd}. ${news.length ? `The latest sample headline: “${news[0].title}”.` : 'No sample headlines for this symbol.'}`,
      refs: ['news.blackout', 'news.items'],
    }
  }

  if (/setup|range|entry|break/.test(q)) {
    if (!setup) return { answer: 'These levels are manual; no written setup matched them, so only the gate applies.', refs: ['setup.status'] }
    return {
      answer: `This is a **${FAMILY_LABEL[setup.family].toLowerCase()}** setup with status ${setup.status}: the opening range was ${price(setup.rangeLowCents)}–${price(setup.rangeHighCents)} and the trigger was ${price(setup.entryCents)}. The session reads as ${regime}.`,
      refs: ['setup.status', 'market.regime'],
    }
  }

  if (/memo|decision|take|pass|score/.test(q)) {
    return {
      answer: `The memo says **${memo.decision}** with a score of ${memo.rubricScore}/5. ${veto ? 'The setup seat blocked it, and the score does not outvote a blocking seat. ' : ''}The strongest case against is: “${memo.counterCase}”`,
      refs: ['memo.decision', 'memo.counterCase'],
    }
  }

  return { answer: OUT_OF_SCOPE, refs: [] }
}

/** Used by the seeds' entry-window checks in the UI copy. */
export function insideWindow(session: SessionInfo, limits: RiskLimits): boolean {
  return inEntryWindow(session.nowEt, limits.entryWindowStart, limits.entryWindowEnd)
}
