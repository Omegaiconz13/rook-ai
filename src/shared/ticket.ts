import type { Bar } from './market'
import type { GateVerdict, TradePlan } from './risk'

/*
  Paper tickets. A ticket is the gate's approved plan turned into a size, and
  every fill here is simulated against the sample session's own later bars:
  a buy limit fills when a bar trades down to the entry, then the stop or the
  target decides the result. No order ever leaves the browser.
*/

export type TicketState = 'proposed' | 'confirmed' | 'filled' | 'closed' | 'cancelled' | 'expired'

export type PaperTicket = {
  id: string
  sessionDate: string
  plan: TradePlan
  size: number
  maxLossCents: number
  state: TicketState
  createdAt: string
  /** The bar to start simulating from (the setup's trigger, or the open). */
  fillFrom: string
  fillAt: string | null
  fillCents: number | null
  /** The journal row this ticket writes its result back to. */
  tradeId: string | null
  closedAt: string | null
  exitCents: number | null
  exitReason: 'stop' | 'target' | 'flat' | null
  rResult: number | null
  cancelReason: string | null
}

export const TICKET_LABEL: Record<TicketState, string> = {
  proposed: 'Proposed',
  confirmed: 'Confirmed',
  filled: 'Filled',
  closed: 'Closed',
  cancelled: 'Cancelled',
  expired: 'Not filled',
}

export function proposeTicket(args: {
  plan: TradePlan
  size: number
  sessionDate: string
  createdAt: string
  fillFrom: string
  id?: string
  tradeId?: string | null
}): PaperTicket {
  const size = Math.max(0, Math.floor(args.size))
  return {
    id: args.id ?? `ticket-${crypto.randomUUID()}`,
    sessionDate: args.sessionDate,
    plan: args.plan,
    size,
    maxLossCents: size * (args.plan.entryCents - args.plan.stopCents),
    state: 'proposed',
    createdAt: args.createdAt,
    fillFrom: args.fillFrom,
    fillAt: null,
    fillCents: null,
    tradeId: args.tradeId ?? null,
    closedAt: null,
    exitCents: null,
    exitReason: null,
    rResult: null,
    cancelReason: null,
  }
}

export function confirmTicket(ticket: PaperTicket): PaperTicket {
  return ticket.state === 'proposed' ? { ...ticket, state: 'confirmed' } : ticket
}

/** The confirmation dialog must be able to prove the gate agrees with the ticket. */
export function ticketProblem(ticket: PaperTicket, verdict: GateVerdict): string | null {
  if (verdict.verdict !== 'approved' || verdict.size === null || verdict.lossAtStopCents === null) {
    return 'The gate has not approved this plan, so there is nothing to ticket.'
  }
  if (ticket.size !== verdict.size) {
    return `This ticket is for ${ticket.size} shares; the gate approved ${verdict.size}.`
  }
  if (ticket.maxLossCents > verdict.lossAtStopCents) {
    return 'The loss at the stop is larger than the gate approved.'
  }
  if (ticket.plan.stopCents >= ticket.plan.entryCents) {
    return 'The stop must sit below the entry for a long.'
  }
  return null
}

export function cancelTicket(ticket: PaperTicket, reason: string): PaperTicket {
  if (ticket.state === 'closed' || ticket.state === 'cancelled') return ticket
  return { ...ticket, state: 'cancelled', cancelReason: reason }
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Walk the session's bars from `fillFrom` and settle the ticket.
 * A buy limit fills when a bar trades at or below the entry. After the fill the
 * stop is checked before the target on every bar, so a bar that spans both is
 * scored as a loss rather than a win.
 */
export function replayAgainstSession(ticket: PaperTicket, bars: Bar[]): PaperTicket {
  if (ticket.state === 'closed' || ticket.state === 'cancelled') return ticket
  const entry = ticket.plan.entryCents
  const stop = ticket.plan.stopCents
  const target = ticket.plan.targetCents
  if (stop >= entry || entry <= 0) return { ...ticket, state: 'cancelled', cancelReason: 'Invalid levels.' }

  const fromMs = Date.parse(ticket.fillFrom)
  const from = Math.max(0, bars.findIndex((b) => Date.parse(b.start) >= fromMs))
  if (bars.length === 0 || from >= bars.length) return { ...ticket, state: 'expired' }

  let fillIdx = -1
  for (let i = from; i < bars.length; i++) {
    if (bars[i].low <= entry) {
      fillIdx = i
      break
    }
  }
  if (fillIdx === -1) return { ...ticket, state: 'expired' }

  const risk = entry - stop
  const filled: PaperTicket = {
    ...ticket,
    state: 'filled',
    fillAt: bars[fillIdx].start,
    fillCents: entry,
  }

  for (let i = fillIdx; i < bars.length; i++) {
    if (bars[i].low <= stop) {
      return { ...filled, state: 'closed', closedAt: bars[i].start, exitCents: stop, exitReason: 'stop', rResult: -1 }
    }
    if (bars[i].high >= target) {
      return { ...filled, state: 'closed', closedAt: bars[i].start, exitCents: target, exitReason: 'target', rResult: round2((target - entry) / risk) }
    }
  }

  const last = bars[bars.length - 1]
  return {
    ...filled,
    state: 'closed',
    closedAt: last.start,
    exitCents: last.close,
    exitReason: 'flat',
    rResult: round2((last.close - entry) / risk),
  }
}

/** Short human line for a settled ticket. */
export function ticketLine(ticket: PaperTicket): string {
  if (ticket.state === 'closed' && ticket.rResult !== null && ticket.exitReason) {
    const where = ticket.exitReason === 'stop' ? 'stopped out' : ticket.exitReason === 'target' ? 'target hit' : 'flat at the close'
    return `${where} · ${ticket.rResult > 0 ? '+' : ''}${ticket.rResult.toFixed(2)}R`
  }
  if (ticket.state === 'expired') return 'Entry never traded, so nothing filled'
  if (ticket.state === 'cancelled') return ticket.cancelReason ?? 'Cancelled'
  if (ticket.state === 'filled') return `Filled at ${ticket.fillCents ? `$${(ticket.fillCents / 100).toFixed(2)}` : 'the entry'}`
  return 'Waiting on the entry'
}
