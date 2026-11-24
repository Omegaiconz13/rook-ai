import { INSTRUMENTS } from '../market'
import { DECIDING_LABEL, money, price, sizeFor } from '../sizing'
import { deskSetups, FAMILY_LABEL, planFromSetup } from '../setups'
import type { Setup } from '../setups'
import { SIM_ASSUMPTIONS, simulate } from '../simulate'
import { etClock, minutesOf } from '../time'
import type { DeskSnapshot } from './types'
import { ruleLabel, verdictForPlan } from './verdict'

/*
  Review: four fixed read-only roles over the setup a written rule actually
  produced — setup, risk, counter-case, journal. It is Minara's Institution Mode
  roundtable without the roundtable: the roles are fixed, none of them may write,
  and every sentence carries a number the desk already computed.

  There is no model here on purpose. A review assembled from the gate, the replay
  and the journal cannot drift from them, costs nothing, and can be tested. What
  a model would add — a fluent argument — is exactly what a reviewer should not
  be handed as if it were evidence.
*/

export type ReviewRole = {
  role: 'setup' | 'risk' | 'counter' | 'journal'
  title: string
  lines: string[]
}

export type ReviewRecord = {
  symbol: string
  setupId: string
  headline: string
  roles: ReviewRole[]
  footer: string
  refs: string[]
}

export type ReviewOutcome = { ok: true; record: ReviewRecord } | { ok: false; why: string; refs: string[] }

/** The desk's own setups first, then any other symbol the written rules produced. */
function setupsOnDesk(desk: DeskSnapshot): Setup[] {
  const found = new Map<string, Setup>()
  for (const setup of desk.setups) found.set(setup.id, setup)
  for (const setup of deskSetups()) if (!found.has(setup.id)) found.set(setup.id, setup)
  return [...found.values()]
}

function verdictCounts(rows: { verdict: string }[]): string {
  const order = ['APPROVED', 'BLOCKED', 'MANUAL']
  return order
    .map((verdict) => ({ verdict, count: rows.filter((row) => row.verdict === verdict).length }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.verdict} ×${entry.count}`)
    .join(' · ')
}

export function reviewSetup(args: { desk: DeskSnapshot; argument?: string }): ReviewOutcome {
  const { desk } = args
  const asked = (args.argument ?? '').trim()
  const symbols = INSTRUMENTS.map((instrument) => instrument.symbol)
  const all = setupsOnDesk(desk)

  let symbol = desk.symbol
  let chosen: Setup | undefined
  if (asked) {
    const wanted = asked.toUpperCase()
    chosen = all.find((setup) => setup.id.toUpperCase() === wanted)
    if (chosen) {
      symbol = chosen.symbol
    } else if (symbols.includes(wanted)) {
      symbol = wanted
    } else {
      return { ok: false, why: `${asked} is not on the desk. It trades ${symbols.join(', ')}.`, refs: ['setups:desk'] }
    }
  }

  const own = all.filter((setup) => setup.symbol === symbol)
  const fired = chosen ?? own.find((setup) => setup.status === 'triggered')
  if (!fired || fired.status !== 'triggered') {
    const what =
      own.length === 0
        ? `no rule produced a setup on ${symbol}`
        : own
            .map((setup) => `${FAMILY_LABEL[setup.family].toLowerCase()} ${setup.status} at ${etClock(setup.triggerAt)}`)
            .join(' · ')
    return {
      ok: false,
      why: `The rules did not fire on ${symbol}, so there is nothing to review: ${what}. A review only covers a setup the rule actually produced.`,
      refs: [`setups:${symbol}`],
    }
  }

  const plan = planFromSetup(fired)
  const verdict = verdictForPlan(desk, plan)
  const sizing = sizeFor(fired.entryCents, fired.riskPerShareCents, desk.limits)
  const sim = simulate({ plan })
  const rows = desk.journal.filter((row) => row.symbol === fired.symbol && row.date === desk.today)
  const minutesLeft = minutesOf(desk.limits.flatBy) - minutesOf(desk.session.nowEt)

  const rangeLine =
    fired.family === 'reclaim'
      ? `20-day average ${price(fired.rangeHighCents)} · opening low ${price(fired.rangeLowCents)}`
      : `Range ${price(fired.rangeHighCents)} / ${price(fired.rangeLowCents)}`

  const riskLines: string[] =
    verdict.verdict === 'approved'
      ? [
          `Approved: ${verdict.size} ${verdict.size === 1 ? 'share' : 'shares'}; ${
            verdict.decidingLimit ? DECIDING_LABEL[verdict.decidingLimit] : 'the size'
          } set the size.`,
          `Loss at stop ${money(verdict.lossAtStopCents ?? 0)}. R ${plan.rMultiple.toFixed(2)} against your ${desk.limits.minRewardRisk.toFixed(2)} minimum.`,
          `Caps at ${price(fired.entryCents)}: risk ${sizing.caps.risk} · position ${sizing.caps.position} · cash ${sizing.caps.cash} shares.`,
        ]
      : [
          `Blocked by ${verdict.ruleId} (${ruleLabel(verdict.ruleId)}): ${verdict.reason}`,
          'No size was produced, so there is no loss at a stop to quote.',
        ]

  const record: ReviewRecord = {
    symbol: fired.symbol,
    setupId: fired.id,
    headline: `Review — ${fired.symbol} · ${FAMILY_LABEL[fired.family].toLowerCase()}, ${fired.status} ${etClock(fired.triggerAt)} ET`,
    roles: [
      {
        role: 'setup',
        title: 'Setup',
        lines: [
          `${FAMILY_LABEL[fired.family]} (${fired.family}), ${fired.status} at ${etClock(fired.triggerAt)} ET on ${desk.today}.`,
          `${rangeLine} · entry ${price(fired.entryCents)} · stop ${price(fired.stopCents)} · target ${price(fired.targetCents)}.`,
          `Risk ${price(fired.riskPerShareCents)} per share; R ${fired.rMultiple.toFixed(2)} by the rule.`,
        ],
      },
      { role: 'risk', title: 'Risk', lines: riskLines },
      {
        role: 'counter',
        title: 'Counter-case',
        lines: [
          `${sim.runs.toLocaleString('en-US')} replays (seed ${sim.seed}): target first ${sim.targetFirst}% · stop first ${sim.stopFirst}% · average ${sim.avgR}R.`,
          sim.verdictLine,
          minutesLeft > 0
            ? `${minutesLeft} minutes to flat-by at ${desk.limits.flatBy}; ${SIM_ASSUMPTIONS[2]}.`
            : `Past flat-by at ${desk.limits.flatBy}: no new entries, so this is history, not a plan.`,
        ],
      },
      {
        role: 'journal',
        title: 'Journal',
        lines:
          rows.length === 0
            ? [`No rows for ${fired.symbol} on ${desk.today} yet, so there is nothing to compare this against.`]
            : [
                `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} for ${fired.symbol} on ${desk.today}: ${verdictCounts(rows)}.`,
                `Most recent: ${rows[0].verdict}${rows[0].gateRule ? ` (${rows[0].gateRule})` : ''} · ${rows[0].setup} · ${
                  rows[0].size
                } ${rows[0].size === 1 ? 'share' : 'shares'}${rows[0].note ? ` · "${rows[0].note}"` : ''}.`,
              ],
      },
    ],
    footer: 'Read-only: four fixed roles over the desk’s own numbers. Nothing here is an order, a size or advice.',
    refs: [
      `setup:${fired.id}`,
      'gate',
      ...(verdict.ruleId ? [`rule:${verdict.ruleId}`] : []),
      `sim:${fired.id}`,
      `journal:${fired.symbol}`,
      'limits',
    ],
  }

  return { ok: true, record }
}

/** The record as the panel prints it: a heading, four sections, a footer. */
export function reviewText(record: ReviewRecord): string {
  const lines = [record.headline, '']
  for (const role of record.roles) {
    lines.push(role.title)
    for (const line of role.lines) lines.push(`- ${line}`)
    lines.push('')
  }
  lines.push(record.footer)
  return lines.join('\n')
}
