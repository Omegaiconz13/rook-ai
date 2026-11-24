import type { Bar, DailyBar } from './market'
import { INSTRUMENTS } from './market'
import type { TradePlan } from './risk'
import { barsFor, dailyFor } from './fixtures'

/*
  Setup detection on the sample session. Four families, each a written rule
  rather than a model's opinion:
    orb      first 5-minute close above the 09:30 opening range
    flag     a tight pullback after a run-up, entered on a close above the flag
    fvg      a three-bar gap price trades back into and closes above
    reclaim  first bar that reclaims the 20-day average after a close below it
  Stops and targets come from the rule, never from taste: stop at the range
  midpoint (ORB) or the flag/opening low, target at 2R.
*/

export type SetupFamily = 'orb' | 'flag' | 'fvg' | 'reclaim'
export type SetupStatus = 'waiting' | 'triggered' | 'expired'

export type Setup = {
  id: string
  symbol: string
  family: SetupFamily
  direction: 'long'
  triggerAt: string
  entryCents: number
  stopCents: number
  targetCents: number
  riskPerShareCents: number
  rMultiple: number
  rangeHighCents: number
  rangeLowCents: number
  status: SetupStatus
  provenance: 'seed'
}

export const FAMILY_LABEL: Record<SetupFamily, string> = {
  orb: 'Opening range',
  flag: 'Bull flag',
  fvg: 'Gap retest',
  reclaim: '20-day reclaim',
}

export const FAMILY_SHORT: Record<SetupFamily, string> = { orb: 'ORB', flag: 'Flag', fvg: 'FVG', reclaim: 'Reclaim' }

const ENTRY_WINDOW_BARS = 24 // 09:30 + 24 × 5m = 11:30 New York

function makeSetup(args: {
  symbol: string
  family: SetupFamily
  triggerAt: string
  entryCents: number
  stopCents: number
  rangeHighCents: number
  rangeLowCents: number
  status: SetupStatus
}): Setup | null {
  const { entryCents, stopCents } = args
  const riskPerShareCents = entryCents - stopCents
  if (riskPerShareCents <= 0) return null
  const targetCents = entryCents + 2 * riskPerShareCents
  return {
    id: `${args.symbol}-${args.family}`,
    symbol: args.symbol,
    family: args.family,
    direction: 'long',
    triggerAt: args.triggerAt,
    entryCents,
    stopCents,
    targetCents,
    riskPerShareCents,
    rMultiple: Math.round(((targetCents - entryCents) / riskPerShareCents) * 100) / 100,
    rangeHighCents: args.rangeHighCents,
    rangeLowCents: args.rangeLowCents,
    status: args.status,
    provenance: 'seed',
  }
}

function openingRangeSetup(symbol: string, bars: Bar[]): Setup | null {
  if (bars.length < 4) return null
  const range = bars.slice(0, 3)
  const high = Math.max(...range.map((b) => b.high))
  const low = Math.min(...range.map((b) => b.low))
  const stop = Math.floor((high + low) / 2)
  const scanTo = Math.min(ENTRY_WINDOW_BARS, bars.length - 1)

  for (let i = 3; i <= scanTo; i++) {
    if (bars[i].close > high) {
      return makeSetup({
        symbol,
        family: 'orb',
        triggerAt: bars[i].start,
        entryCents: bars[i].close,
        stopCents: stop,
        rangeHighCents: high,
        rangeLowCents: low,
        status: 'triggered',
      })
    }
  }
  return makeSetup({
    symbol,
    family: 'orb',
    triggerAt: bars[scanTo].start,
    entryCents: high,
    stopCents: stop,
    rangeHighCents: high,
    rangeLowCents: low,
    status: 'expired',
  })
}

function flagSetup(symbol: string, bars: Bar[]): Setup | null {
  if (bars.length < 12) return null
  const lead = bars[5].close / bars[0].close - 1
  if (lead < 0.01) return null

  // A partial session can end before 11:30, so the scan stops at its last bar:
  // reading `bars[24]` off an eighteen-bar session throws and takes the desk down.
  const scanTo = Math.min(ENTRY_WINDOW_BARS, bars.length - 1)
  for (let i = 6; i <= 14; i++) {
    const flag = bars.slice(i, i + 3)
    if (flag.length < 3) break
    if (!(flag[1].high < flag[0].high && flag[2].high < flag[1].high)) continue
    const flagHigh = Math.max(...flag.map((b) => b.high))
    const flagLow = Math.min(...flag.map((b) => b.low))
    if (flagHigh <= bars[4].close) continue

    for (let j = i + 3; j <= scanTo; j++) {
      if (bars[j].close > flagHigh) {
        return makeSetup({
          symbol,
          family: 'flag',
          triggerAt: bars[j].start,
          entryCents: bars[j].close,
          stopCents: flagLow,
          rangeHighCents: flagHigh,
          rangeLowCents: flagLow,
          status: 'triggered',
        })
      }
    }
  }
  return null
}

/*
  A three-bar imbalance: bar i's low sits above bar i-2's high, so a range was
  skipped rather than traded. The gap must be at least five basis points wide or
  it is noise. Entry is the first close back above the top of the gap after
  price wicks into it; stop is the far side of the gap; target is 2R. If price
  closes through the gap first, the gap is void.
*/
const MIN_GAP_BP = 5

function gapRetestSetup(symbol: string, bars: Bar[]): Setup | null {
  if (bars.length < 8) return null
  const scanTo = Math.min(ENTRY_WINDOW_BARS, bars.length - 1)

  for (let i = 2; i <= scanTo; i++) {
    const gapLow = bars[i - 2].high
    const gapHigh = bars[i].low
    if (gapHigh <= gapLow) continue
    if ((gapHigh - gapLow) * 10_000 < gapHigh * MIN_GAP_BP) continue

    for (let j = i + 1; j <= scanTo; j++) {
      if (bars[j].close < gapLow) break
      if (bars[j].low <= gapHigh && bars[j].close > gapHigh) {
        return makeSetup({
          symbol,
          family: 'fvg',
          triggerAt: bars[j].start,
          entryCents: bars[j].close,
          stopCents: gapLow,
          rangeHighCents: gapHigh,
          rangeLowCents: gapLow,
          status: 'triggered',
        })
      }
    }
  }
  return null
}

function reclaimSetup(symbol: string, bars: Bar[], daily: DailyBar[]): Setup | null {
  if (bars.length < 4 || daily.length < 21) return null
  const prior = daily.slice(-20)
  const sma = Math.round(prior.reduce((n, d) => n + d.close, 0) / prior.length)
  const yesterday = daily[daily.length - 1].close
  if (yesterday >= sma) return null
  const first = bars[0]
  if (first.close <= sma) return null

  const openingLow = Math.min(...bars.slice(0, 3).map((b) => b.low))
  return makeSetup({
    symbol,
    family: 'reclaim',
    triggerAt: first.start,
    entryCents: first.close,
    stopCents: openingLow,
    rangeHighCents: sma,
    rangeLowCents: openingLow,
    status: 'triggered',
  })
}

/** Every setup family for one symbol, in family order. */
export function setupsFor(symbol: string, bars: Bar[], daily: DailyBar[]): Setup[] {
  const found = [
    openingRangeSetup(symbol, bars),
    flagSetup(symbol, bars),
    gapRetestSetup(symbol, bars),
    reclaimSetup(symbol, bars, daily),
  ]
  return found.filter((s): s is Setup => s !== null)
}

const RANK: Record<SetupStatus, number> = { triggered: 0, waiting: 1, expired: 2 }

/** The whole desk, best first. */
export function deskSetups(): Setup[] {
  return INSTRUMENTS.flatMap((i) => setupsFor(i.symbol, barsFor(i.symbol), dailyFor(i.symbol))).sort(
    (a, b) => RANK[a.status] - RANK[b.status] || a.symbol.localeCompare(b.symbol) || a.family.localeCompare(b.family),
  )
}

export function setupById(id: string, setups: Setup[] = deskSetups()): Setup | undefined {
  return setups.find((s) => s.id === id)
}

export function planFromSetup(setup: Setup): TradePlan {
  return {
    id: `plan-${setup.id}`,
    symbol: setup.symbol,
    direction: setup.direction,
    entryCents: setup.entryCents,
    stopCents: setup.stopCents,
    targetCents: setup.targetCents,
    riskPerShareCents: setup.riskPerShareCents,
    rMultiple: setup.rMultiple,
    setupId: setup.id,
    status: 'draft',
    provenance: 'seed',
  }
}
