import type { RiskLimits } from './risk'

/*
  Position sizing and money formatting. Integer cents in, integer shares out.
  No rounding happens until a value is displayed, so the browser and the Worker
  compute the same numbers.
*/

export type DecidingLimit = 'risk-per-trade' | 'position-cap' | 'cash-buffer'

export const DECIDING_LABEL: Record<DecidingLimit, string> = {
  'risk-per-trade': 'risk per trade',
  'position-cap': 'position cap',
  'cash-buffer': 'cash buffer',
}

export function maxRiskCents(limits: RiskLimits): number {
  return Math.round((limits.equityCents * limits.riskPerTradePct) / 100)
}

export function dailyLossCents(limits: RiskLimits): number {
  return Math.round((limits.equityCents * limits.dailyLossPct) / 100)
}

export type Sizing = {
  size: number
  decidingLimit: DecidingLimit
  lossAtStopCents: number
  caps: { risk: number; position: number; cash: number }
}

/** Whole shares that fit risk, position cap and cash buffer. Ties favour risk. */
export function sizeFor(entryCents: number, riskPerShareCents: number, limits: RiskLimits): Sizing {
  const risk = riskPerShareCents > 0 ? Math.floor(maxRiskCents(limits) / riskPerShareCents) : 0
  const position = Math.floor((limits.equityCents * limits.positionCapPct) / 100 / entryCents)
  const cash = Math.floor((limits.equityCents * (100 - limits.cashBufferPct)) / 100 / entryCents)
  const size = Math.max(0, Math.min(risk, position, cash))
  const decidingLimit: DecidingLimit = size === risk ? 'risk-per-trade' : size === position ? 'position-cap' : 'cash-buffer'
  return { size, decidingLimit, lossAtStopCents: size * riskPerShareCents, caps: { risk, position, cash } }
}

/** (target − entry) / (entry − stop), rounded to 2 dp for display. */
export function rewardRisk(entryCents: number, stopCents: number, targetCents: number): number {
  const risk = entryCents - stopCents
  if (risk <= 0) return 0
  return Math.round(((targetCents - entryCents) / risk) * 100) / 100
}

export function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

export function signedMoney(cents: number): string {
  return `${cents > 0 ? '+' : ''}${money(cents)}`
}

export function price(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function usdToCents(value: string | number): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}
