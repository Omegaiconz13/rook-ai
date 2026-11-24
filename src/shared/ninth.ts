import type { ChartBar } from './chartfeed'
import type { JournalRow } from './journal'
import type { GateVerdict } from './risk'
import { price } from './sizing'
import type { Setup } from './setups'
import { FAMILY_LABEL } from './setups'

/*
  Ninth is the desk's assistant. This module is its mouth with no model behind
  it: every sentence is assembled from values the desk already computed, and
  every answer names the data it read. Nothing here estimates, predicts or
  recomputes a price — if the context does not hold a number, the answer says so.
*/

export const NINTH_NAME = 'Ninth'

/** One level as the chart draws it, kept in integer cents like the rest of the desk. */
export type NinthLevel = { label: string; priceCents: number }

export type NinthContext = {
  symbol: string
  timeframe: string
  /** The active symbol's bars at the chart's timeframe, oldest first. */
  bars: ChartBar[]
  /** The written rule's levels, the same list the chart draws. */
  levels: NinthLevel[]
  /** Every setup family found for the symbol today. */
  setups: Setup[]
  journal: JournalRow[]
  /** The gate's verdict on the setup this symbol is showing, or null when no rule fired. */
  gate: GateVerdict | null
  /** The session date the desk is running (`SESSION_DATE`). */
  today: string
}

export type NinthAnswer = {
  text: string
  /** What the answer read, shown under it: the citation the desk demands. */
  refs: string[]
}

const digits = (value: number) => price(Math.round(value * 100))

function lastBar(ctx: NinthContext): ChartBar | null {
  return ctx.bars.length > 0 ? ctx.bars[ctx.bars.length - 1] : null
}

function activeSetup(ctx: NinthContext): Setup | undefined {
  return ctx.setups.find((setup) => setup.status === 'triggered') ?? ctx.setups[0]
}

function levelsAnswer(ctx: NinthContext): NinthAnswer {
  const setup = activeSetup(ctx)
  if (!setup || ctx.levels.length === 0) {
    return {
      text: `No written rule produced levels for ${ctx.symbol} today, so there is nothing to draw. The desk only draws what a setup found.`,
      refs: [`levels:${ctx.symbol}`],
    }
  }
  const lines = ctx.levels.map((level) => `${level.label} ${price(level.priceCents)}`).join(' · ')
  return {
    text: `${ctx.symbol} — the ${FAMILY_LABEL[setup.family]} rule, ${setup.status}. ${lines}.`,
    refs: [`levels:${ctx.symbol}`, `setup:${setup.id}`],
  }
}

function setupsAnswer(ctx: NinthContext): NinthAnswer {
  if (ctx.setups.length === 0) {
    return {
      text: `None of the four written rules fired on ${ctx.symbol} today. That is an answer, not a gap: the desk does not invent a setup to fill it.`,
      refs: [`setups:${ctx.symbol}`],
    }
  }
  const triggered = ctx.setups.filter((setup) => setup.status === 'triggered').length
  const rows = ctx.setups
    .map(
      (setup) =>
        `${FAMILY_LABEL[setup.family]} (${setup.status}) entry ${price(setup.entryCents)}, stop ${price(setup.stopCents)}, target ${price(setup.targetCents)}`,
    )
    .join('. ')
  return {
    text: `${triggered} of ${ctx.setups.length} setups triggered on ${ctx.symbol}. ${rows}.`,
    refs: [`setups:${ctx.symbol}`, 'rules'],
  }
}

/** Gate reasons are written as sentences; inside one of mine, one full stop is enough. */
const trimStop = (reason: string) => reason.replace(/\.$/, '')

function gateAnswer(ctx: NinthContext): NinthAnswer {
  if (!ctx.gate) {
    return {
      text: `No written rule gave the gate a plan on ${ctx.symbol} today, so there is no verdict to explain. I will not describe a refusal that never happened.`,
      refs: ['gate:none'],
    }
  }
  const { gate } = ctx
  if (gate.ruleId) {
    return {
      text: `${ctx.symbol}: the gate blocked the plan at ${gate.ruleId}. ${gate.reason}`,
      refs: ['gate', `rule:${gate.ruleId}`],
    }
  }
  return {
    text: `The gate approved ${gate.size} shares on ${ctx.symbol}. ${gate.reason}`,
    refs: ['gate', 'sizing'],
  }
}

function journalAnswer(ctx: NinthContext): NinthAnswer {
  const forSymbol = ctx.journal.filter((row) => row.symbol === ctx.symbol).length
  const blocked = ctx.journal.filter((row) => row.date === ctx.today && row.verdict === 'BLOCKED').length
  const last = ctx.journal[0]
  const tail = last
    ? ` Last row: ${last.date} ${last.symbol} ${last.verdict}${last.note ? ` — ${last.note}` : ''}.`
    : ' The journal is empty.'
  return {
    text: `${ctx.journal.length} rows in the journal, ${forSymbol} for ${ctx.symbol}. ${blocked} blocked on ${ctx.today}.${tail}`,
    refs: ['journal', `journal:${ctx.today}`],
  }
}

function riskAnswer(ctx: NinthContext): NinthAnswer {
  if (!ctx.gate) {
    return {
      text: 'I will not estimate a size: the gate sizes a plan from your written limits, and no rule has given it a plan on this symbol yet.',
      refs: ['gate:none'],
    }
  }
  const { gate } = ctx
  if (gate.ruleId) {
    return {
      text: `Size is zero: ${gate.ruleId} stopped the plan before sizing. Clear that rule and the gate will size it against your limits.`,
      refs: ['gate', `rule:${gate.ruleId}`],
    }
  }
  return {
    text: `The gate approved ${gate.size} shares. That number comes from your equity, the risk per trade and the distance from entry to stop — not from an opinion of mine.`,
    refs: ['gate', 'sizing'],
  }
}

function priceAnswer(ctx: NinthContext): NinthAnswer {
  const bar = lastBar(ctx)
  if (!bar) {
    return {
      text: `No bars are loaded for ${ctx.symbol} at ${ctx.timeframe}, so there is no price to read.`,
      refs: [`chart:${ctx.symbol}`],
    }
  }
  const previous = ctx.bars.length > 1 ? ctx.bars[ctx.bars.length - 2].close : null
  const change = previous === null ? null : ((bar.close - previous) / previous) * 100
  const move = change === null ? '' : `, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)}% from the bar before`
  return {
    text: `${ctx.symbol} ${ctx.timeframe}: last close ${digits(bar.close)}${move}. Open ${digits(bar.open)}, high ${digits(bar.high)}, low ${digits(bar.low)}.`,
    refs: [`chart:${ctx.symbol}:${ctx.timeframe}`],
  }
}

function helpAnswer(ctx: NinthContext): NinthAnswer {
  return {
    text: `No model is connected, so I answer only what the desk can compute: the levels on ${ctx.symbol}, the setups on the scan, the gate's verdict on this setup and the rule that decided it, the journal, and the last bar. Ask for one of those.`,
    refs: ['desk'],
  }
}

const STATUS_WORDS: Record<Setup['status'], string> = {
  triggered: 'triggered',
  waiting: 'waiting for its trigger',
  expired: 'expired',
}

/**
 * The whole read in one answer: the quote, the rule's levels, the last gate
 * verdict and the journal, in the order a trader reads them. The panel draws
 * these same numbers on the chart, so this is not a second opinion — it is the
 * desk's data in sentences.
 */
export function analyzeNinth(ctx: NinthContext): NinthAnswer {
  const bar = lastBar(ctx)
  if (!bar) {
    return {
      text: `No bars are loaded for ${ctx.symbol} at ${ctx.timeframe}, so there is nothing to analyse. I will not describe a chart I cannot read.`,
      refs: [`chart:${ctx.symbol}`],
    }
  }
  const previous = ctx.bars.length > 1 ? ctx.bars[ctx.bars.length - 2].close : null
  const change = previous === null ? null : ((bar.close - previous) / previous) * 100
  const quote = `${ctx.symbol} ${ctx.timeframe}: last close ${digits(bar.close)}${change === null ? '' : `, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(2)}%`}`
  const setup = activeSetup(ctx)
  if (!setup) {
    return {
      text: `${quote}. No written rule fired on ${ctx.symbol} today, so there is no entry, stop or target to draw — the desk only draws what a rule found.`,
      refs: [`chart:${ctx.symbol}:${ctx.timeframe}`, `setups:${ctx.symbol}`],
    }
  }

  const refs = [`chart:${ctx.symbol}:${ctx.timeframe}`, `setup:${setup.id}`, `levels:${ctx.symbol}`, 'journal']
  const rule = `The ${FAMILY_LABEL[setup.family]} rule is ${STATUS_WORDS[setup.status]}: entry ${price(setup.entryCents)}, stop ${price(setup.stopCents)}, target ${price(setup.targetCents)} — ${setup.rMultiple} to 1, from the rule's own prices.`
  const levels =
    ctx.levels.length > 0
      ? `On the chart: ${ctx.levels.map((level) => `${level.label} ${price(level.priceCents)}`).join(' · ')}.`
      : 'That rule produced no levels to draw.'
  let gate = 'No written rule has given the gate a plan on this symbol, so there is no verdict to read.'
  if (ctx.gate) {
    if (ctx.gate.ruleId) {
      gate = `The gate stopped it at ${ctx.gate.ruleId}: ${trimStop(ctx.gate.reason)}.`
      refs.push(`rule:${ctx.gate.ruleId}`)
    } else {
      gate = `The gate approved ${ctx.gate.size} shares: ${trimStop(ctx.gate.reason)}.`
      refs.push('gate')
    }
  }
  const blocked = ctx.journal.filter((row) => row.date === ctx.today && row.verdict === 'BLOCKED').length
  const journal = `${ctx.journal.length} journal rows, ${blocked} blocked on ${ctx.today}.`
  return { text: `${quote}. ${rule} ${levels} ${gate} ${journal}`, refs }
}

/**
 * Deterministic answers. Order matters: "why was it blocked" must reach the
 * memo before "entry" reaches the levels.
 */
export function answerNinth(question: string, ctx: NinthContext): NinthAnswer {
  const q = question.toLowerCase()
  if (/\b(block|blocked|refus|reject|veto|stop(?:ped)? (?:it|the trade))\b/.test(q)) return gateAnswer(ctx)
  if (/\b(journal|logged|wrote|written|record|note)\b/.test(q)) return journalAnswer(ctx)
  if (/\b(size|sizing|shares|position|risk|budget)\b/.test(q)) return riskAnswer(ctx)
  if (/\b(level|levels|entry|stop|target|range)\b/.test(q)) return levelsAnswer(ctx)
  if (/\b(setup|setups|scan|opportunit|triggered|waiting|expired)\b/.test(q)) return setupsAnswer(ctx)
  if (/\b(price|bar|candle|close|quote|now)\b/.test(q)) return priceAnswer(ctx)
  return helpAnswer(ctx)
}
