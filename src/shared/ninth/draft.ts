import { INSTRUMENTS } from '../market'
import { price } from '../sizing'
import { deskSetups, FAMILY_LABEL, planFromSetup } from '../setups'
import type { Setup, SetupFamily } from '../setups'
import { simulate } from '../simulate'
import type { SimResult } from '../simulate'
import type { DeskSnapshot } from './types'

/*
  Draft: plain English in, a Pine v5 draft out, then the desk's own replay of the
  same rule. Minara's Strategy Studio ends in a deployment; ours ends at a script
  a reader can edit and a replay that says what it does not model.

  The script is deliberately boring: the family's written condition, the levels
  the rule produced today, one entry and one exit. It is a draft, so it carries
  no optimisation, no default quantity, and a header that says it places nothing.
*/

export const DRAFT_FAMILIES: SetupFamily[] = ['orb', 'flag', 'fvg', 'reclaim']

const WORDS: Record<SetupFamily, string[]> = {
  orb: ['orb', 'opening range', 'range break', 'breakout'],
  flag: ['flag', 'pullback'],
  fvg: ['fvg', 'fair value gap', 'gap', 'imbalance'],
  reclaim: ['reclaim', '20-day', '20 day', 'sma'],
}

/** Words that look like a ticker and are not one. */
const NOT_A_SYMBOL = new Set(['ORB', 'FVG', 'SMA', 'DAY', 'ET', 'PINE'])

const CONDITION: Record<SetupFamily, string[]> = {
  orb: [
    '// The rule: the first 5-minute close above the 09:30 opening range.',
    'var float rangeHigh = na',
    'var float rangeLow  = na',
    'if ta.change(time("D")) != 0',
    '    rangeHigh := high',
    '    rangeLow  := low',
    'else',
    '    rangeHigh := math.max(rangeHigh, high)',
    '    rangeLow  := math.min(rangeLow, low)',
    'long = ta.crossover(close, rangeHigh)',
  ],
  flag: [
    '// The rule: a tight pullback after a run-up, entered on a close above the flag.',
    'runUp    = close / close[6] - 1 > 0.01',
    'flagHigh = ta.highest(high, 3)[1]',
    'long     = runUp and close > flagHigh',
  ],
  fvg: [
    '// The rule: a three-bar gap price trades back into and closes above.',
    'gapLow  = high[2]',
    'gapHigh = low',
    'gap     = gapHigh > gapLow and (gapHigh - gapLow) * 10000 >= gapHigh * 5',
    'long    = gap and low <= gapHigh and close > gapHigh',
  ],
  reclaim: [
    '// The rule: the first close back above the 20-day average after a close below it.',
    'sma20 = ta.sma(close, 20)',
    'long  = close > sma20 and close[1] <= sma20[1]',
  ],
}

export type Draft = {
  symbol: string
  family: SetupFamily
  setupId: string
  pine: string
  sim: SimResult
  assumptions: string[]
  refs: string[]
}

export type DraftOutcome = { ok: true; draft: Draft } | { ok: false; why: string; refs: string[] }

function pineFor(setup: Setup, today: string): string {
  const label = FAMILY_LABEL[setup.family]
  return [
    '//@version=5',
    `// Paper draft from Ninth — ${setup.symbol} · ${label}. No orders leave this desk; not advice.`,
    `strategy("${setup.symbol} ${label} draft", overlay=true, process_orders_on_close=true, margin_long=0, margin_short=0)`,
    '',
    `// The levels the rule produced on ${today}:`,
    `entry  = ${price(setup.entryCents)}`,
    `stop   = ${price(setup.stopCents)}`,
    `target = ${price(setup.targetCents)}`,
    '',
    ...CONDITION[setup.family],
    '',
    'if long and strategy.position_size == 0',
    '    strategy.entry("long", strategy.long, limit=entry)',
    '    strategy.exit("exit", "long", stop=stop, limit=target)',
  ].join('\n')
}

function familyIn(text: string): SetupFamily | undefined {
  const asked = text.toLowerCase()
  return DRAFT_FAMILIES.find((family) => WORDS[family].some((word) => asked.includes(word)))
}

export function draftStrategy(args: { text: string; desk: DeskSnapshot }): DraftOutcome {
  const asked = args.text.trim()
  const family = familyIn(asked)
  if (!family) {
    return {
      ok: false,
      why: 'Say which written rule to draft: opening range (orb), bull flag (flag), gap retest (fvg) or 20-day reclaim (reclaim). E.g. /draft TSLA orb.',
      refs: ['setups:desk'],
    }
  }

  // A word the reader wrote in capitals is a ticker. One that is not on the desk
  // is a symbol it does not trade, not a word to ignore: drafting TSLA for an IBM
  // question would be a wrong answer. Lower-case words are never read as tickers.
  const words = asked.match(/\b[A-Z]{2,5}\b/g) ?? []
  const symbols = new Set(INSTRUMENTS.map((instrument) => instrument.symbol))
  const unknown = words.find((word) => !symbols.has(word) && !NOT_A_SYMBOL.has(word))
  if (unknown) {
    return {
      ok: false,
      why: `${unknown} is not on the desk. It trades ${[...symbols].join(', ')}.`,
      refs: ['setups:desk'],
    }
  }
  const symbol = words.find((word) => symbols.has(word)) ?? args.desk.symbol

  const setups = new Map<string, Setup>()
  for (const setup of args.desk.setups) setups.set(setup.id, setup)
  for (const setup of deskSetups()) if (!setups.has(setup.id)) setups.set(setup.id, setup)

  const setup = [...setups.values()].find((candidate) => candidate.symbol === symbol && candidate.family === family)
  const label = FAMILY_LABEL[family].toLowerCase()

  if (!setup) {
    return {
      ok: false,
      why: `The ${label} rule produced no setup on ${symbol} today, so there is nothing to draft.`,
      refs: [`setups:${symbol}`],
    }
  }
  if (setup.status !== 'triggered') {
    return {
      ok: false,
      why: `The ${label} rule on ${symbol} is ${
        setup.status === 'expired' ? 'expired without an entry' : 'still waiting'
      }, so there is nothing to draft. A draft only covers a rule that fired.`,
      refs: [`setup:${setup.id}`],
    }
  }

  const sim = simulate({ plan: planFromSetup(setup) })
  return {
    ok: true,
    draft: {
      symbol,
      family,
      setupId: setup.id,
      pine: pineFor(setup, args.desk.today),
      sim,
      assumptions: [...sim.assumptions],
      refs: [`setup:${setup.id}`, `sim:${setup.id}`],
    },
  }
}

/** The draft as the panel prints it: the script, then the replay and its limits. */
export function draftText(draft: Draft): string {
  const { sim } = draft
  const lines = [
    `Draft — ${draft.symbol} · ${FAMILY_LABEL[draft.family]} (paper only, not advice)`,
    '',
    draft.pine,
    '',
    `Replay of the desk's rule, not of this script: ${sim.runs.toLocaleString('en-US')} runs (seed ${sim.seed}), target first ${
      sim.targetFirst
    }% · stop first ${sim.stopFirst}% · neither ${sim.neither}% · average ${sim.avgR}R.`,
    sim.verdictLine,
    'What the replay does not model:',
    ...draft.assumptions.map((assumption) => `- ${assumption}`),
    'The script is a draft to edit: nothing on this desk places an order, and Pine was not run here.',
  ]
  return lines.join('\n')
}
