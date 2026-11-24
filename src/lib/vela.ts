import { createTheme } from '@luxalgo/vela'
import type { Vela, VelaTheme } from '@luxalgo/vela'

import { bareTicker, sessionWindow } from '../shared/chartfeed'
import { barsFor, dailyFor } from '../shared/fixtures'
import { setupsFor } from '../shared/setups'
import type { Setup, SetupFamily } from '../shared/setups'

/*
  One theme for every chart. The library paints its own canvas, so it cannot read
  CSS variables at paint time: the values are read once from Rook's tokens here,
  which keeps styles.css the single source of truth.
*/
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const FONT = "'Albert Sans', ui-sans-serif, system-ui, sans-serif"

/** The seven colours the chart surface needs. */
export function chartTheme(): VelaTheme {
  return {
    background: token('--color-bg', '#050906'),
    textColor: token('--color-soft', '#cfdbd1'),
    gridColor: 'rgb(190 255 200 / 0.06)',
    borderColor: token('--color-line-strong', 'rgb(190 255 200 / 0.18)'),
    upColor: token('--color-leaf', '#7ee068'),
    downColor: token('--color-danger', '#ff7a6b'),
    fontFamily: FONT,
  }
}

/**
 * The theme for the library's chrome as well: same colours, Rook's leaf as the
 * accent, Rook's radii and type. Without this the menus, chips and the active
 * cell outline come back in the library's default blue.
 */
export function chartUiTheme() {
  return createTheme({
    base: chartTheme(),
    accent: token('--color-leaf', '#7ee068'),
    radius: 'sm',
    font: FONT,
  })
}

export const chartCandleColors = () => ({
  upColor: token('--color-leaf', '#7ee068'),
  downColor: token('--color-danger', '#ff7a6b'),
})

/**
 * The four colours the plan levels use, read from the tokens so the chart
 * canvas, the legend and the rest of the page cannot drift apart.
 */
export function levelColors() {
  return {
    range: token('--color-level-range', 'rgb(207 219 209 / 0.55)'),
    entry: token('--color-leaf-text', '#8deb77'),
    stop: token('--color-danger', '#ff7a6b'),
    target: token('--color-leaf', '#7ee068'),
  }
}

/** A level the rule wrote, in the units the desk stores (integer cents). */
export type LevelSpec = {
  priceCents: number
  label: string
  color: string
  dashed?: boolean
}

/**
 * What the two "range" fields mean depends on the family: a reclaim setup's pair
 * is the 20-day SMA it reclaimed and the opening low, not a high and a low (the
 * SMA sits *below* the opening low there). Naming them "high"/"low" would print
 * an inverted range on the chart.
 */
const RANGE_LABELS: Record<SetupFamily, { high: string; low: string }> = {
  orb: { high: 'range high', low: 'range low' },
  flag: { high: 'flag high', low: 'flag low' },
  fvg: { high: 'gap high', low: 'gap low' },
  reclaim: { high: '20-day SMA', low: 'opening low' },
}

const RULE_LABEL: Record<SetupFamily, string> = {
  orb: 'opening range',
  flag: 'flag',
  fvg: 'gap retest',
  reclaim: '20-day reclaim',
}

/** The setup the desk is trading on this symbol: the triggered one, else the first. */
export function activeSetupFor(symbol: string): Setup | undefined {
  const upper = bareTicker(symbol)
  const setups = setupsFor(upper, barsFor(upper), dailyFor(upper))
  return setups.find((s) => s.status === 'triggered') ?? setups[0]
}

/** The rule behind the levels drawn on a symbol's chart. */
export function ruleLabelFor(symbol: string): string {
  const setup = activeSetupFor(symbol)
  return setup ? `${RULE_LABEL[setup.family]} rule` : 'written rule'
}

/**
 * The setup levels for a symbol, straight from the written rules: the range the
 * setup was found in, its entry, its stop and its target. No level is added that
 * the rule did not produce.
 */
export function setupLevelsFor(symbol: string): LevelSpec[] {
  const setup = activeSetupFor(symbol)
  if (!setup) return []
  const names = RANGE_LABELS[setup.family]
  const color = levelColors()
  const levels: LevelSpec[] = [
    { priceCents: setup.rangeHighCents, label: names.high, color: color.range, dashed: true },
    { priceCents: setup.rangeLowCents, label: names.low, color: color.range, dashed: true },
    { priceCents: setup.entryCents, label: 'entry', color: color.entry },
    { priceCents: setup.stopCents, label: 'stop', color: color.stop },
    { priceCents: setup.targetCents, label: 'target', color: color.target },
  ]

  // A rule can put two levels on the same price (the ORB entry *is* the range
  // high). One line, one joined label, so nothing overprints.
  const merged: LevelSpec[] = []
  for (const level of levels) {
    const hit = merged.find((l) => l.priceCents === level.priceCents)
    if (hit) {
      hit.label = `${hit.label} / ${level.label}`
      continue
    }
    merged.push({ ...level })
  }
  return merged
}

/**
 * Draw these levels as locked horizontal lines, replacing the ones drawn last
 * time. Returns the ids it owns, so a caller can clear only its own lines and
 * leave anything the trader drew alone.
 *
 * No text on the lines: a rule can put three levels a few cents apart, and any
 * label placed on them overprints at coarse zoom or is clipped by the price
 * scale. The caller lists the levels next to the chart instead, where a number
 * is always readable and always in the same place.
 */
export function drawLevels(chart: Vela, levels: LevelSpec[], owned: string[], window?: { from: number; to: number }): string[] {
  for (const id of owned) chart.drawings.remove(id)
  if (levels.length === 0) return []
  // `add` is an interactive drawing method: it needs a renderer that paints drawings.
  if (!chart.drawings.supported) return []

  const range = window ?? chart.getVisibleRange() ?? null
  const from = range?.from ?? Date.now()
  const span = Math.max(1, (range?.to ?? from) - from)
  const ids: string[] = []
  const time = from + span * 0.2

  for (const level of levels) {
    const drawing = chart.drawings.add('hline', {
      paneId: 'price',
      anchors: [{ time, price: level.priceCents / 100 }],
      style: { lineColor: level.color, lineWidth: 1, lineStyle: level.dashed ? 'dashed' : 'solid' },
    })
    if (!drawing) continue
    chart.drawings.lock(drawing.id)
    ids.push(drawing.id)
  }

  return ids
}

/**
 * The ids each chart's rule levels are drawn under. Module-level so the chart
 * page and Ninth share one owner: whichever draws last replaces the lines
 * instead of stacking a second set on the same prices.
 */
const levelOwned = new WeakMap<Vela, string[]>()

/** The setup levels for a symbol, drawn and locked, anchored on its desk session. */
export function drawSetupLevels(chart: Vela, symbol: string, window?: { from: number; to: number }): string[] {
  const ids = drawLevels(chart, setupLevelsFor(symbol), levelOwned.get(chart) ?? [], window ?? sessionWindow(symbol) ?? undefined)
  levelOwned.set(chart, ids)
  return ids
}

/** The active setup's three prices in chart units, or null when no rule fired. */
export function positionPricesFor(symbol: string): { entry: number; stop: number; target: number } | null {
  const setup = activeSetupFor(symbol)
  return setup ? { entry: setup.entryCents / 100, stop: setup.stopCents / 100, target: setup.targetCents / 100 } : null
}

const positionOwned = new WeakMap<Vela, string[]>()

/**
 * Draw the setup as the chart's own position tool: one object whose entry, stop
 * and target are the rule's prices, so the risk and the reward are drawn ahead
 * of the entry rather than as three loose lines. It is left unlocked — a handle
 * can be dragged to test another stop, and Analyze draws it again from the rule.
 * Returns the ids it owns (none when the renderer cannot draw, or no rule fired).
 */
export function drawSetupPosition(chart: Vela, symbol: string, window?: { from: number; to: number }): string[] {
  for (const id of positionOwned.get(chart) ?? []) chart.drawings.remove(id)
  positionOwned.set(chart, [])
  // `add` is an interactive drawing method: it needs a renderer that paints drawings.
  if (!chart.drawings.supported) return []
  const setup = activeSetupFor(symbol)
  if (!setup) return []

  const color = levelColors()
  const range = window ?? chart.getVisibleRange() ?? null
  const from = range?.from ?? Date.now()
  const span = Math.max(1, (range?.to ?? from) - from)
  // Entry where the rule fills, the stop and target to its right, so the box
  // reads left to right as the trade the rule described. Both stay inside the
  // middle of the frame: the tool's labels are painted at the box's right edge
  // and run further right, so an edge-anchored box prints them off-screen.
  const entry = from + span * 0.5
  const end = from + span * 0.9

  const drawing = chart.drawings.add('position', {
    paneId: 'price',
    anchors: [
      { time: entry, price: setup.entryCents / 100 },
      { time: end, price: setup.stopCents / 100 },
      { time: end, price: setup.targetCents / 100 },
    ],
    style: { lineColor: color.range, lineWidth: 1, lineStyle: 'solid', fillColor: color.target, fillOpacity: 0.08 },
    // No size in the label: the tool would compute one from a balance it does
    // not have here, and an invented number is the one thing the desk refuses.
    props: {
      showText: true,
      showHeader: true,
      showPrices: true,
      showLossSize: false,
      showTargetLabel: true,
      showStopLabel: true,
      profitColor: color.target,
      lossColor: color.stop,
    },
  })
  if (!drawing) return []
  positionOwned.set(chart, [drawing.id])
  return [drawing.id]
}
