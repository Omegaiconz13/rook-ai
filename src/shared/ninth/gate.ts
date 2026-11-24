import type { ToolGuard } from './registry'
import { fail } from './result'
import type { Tier, ToolEntry, ToolOutcome } from './types'
import { MAX_WRITES_PER_TURN } from './types'

/*
  The permission gate. Every model-dispatched tool call passes through here
  before its handler runs, in this order:

    1. kill switch        any tier ≥ 2 is blocked, and so is every write
    2. per-turn write cap at most three write-tier calls in one turn
    3. tier              1 runs · 2 confirm once a session · 3 confirm each ·
                         4 rejected from any model-dispatched call
    4. verdict            a tool that mentions a ticket or a size must carry a
                         verdict produced in this turn

  The one invariant: a model-supplied claim of confirmation is not a
  confirmation. A tier 2 or 3 call does not proceed because the model says
  "confirmed"; it proceeds when `confirmPending` is handed a token that the
  *runtime* minted and a person spent. Tier 4 never mints one at all.
*/

/** A confirmation stays spendable for ten minutes, then it is dead. */
export const PENDING_TTL_MS = 10 * 60_000

export type PendingCall = {
  token: string
  tool: string
  /** The model's arguments, validated when the confirmation is spent. */
  args: unknown
  tier: Tier
  traceId: string
  createdAt: number
}

export type GateState = {
  traceId: string
  killSwitch: boolean
  /** Tier-2 tools a person already confirmed for this session. */
  confirmed: string[]
  /** Write-tier calls that have run in this turn. */
  writes: number
  /** A verdict produced in this turn, when a tool required one. */
  verdict: { planId: string; ruleId: string | null; at: number } | null
  pending: PendingCall[]
}

export type GateBlock = {
  code: 'kill-switch' | 'write-cap' | 'tier-4' | 'needs-confirmation' | 'no-verdict'
  why: string
  /** Present only when a person can confirm this call. */
  token?: string
}

export type ConfirmResult =
  | { ok: true; tool: string; args: unknown }
  | { ok: false; why: string }

export function openGate(args: { traceId: string; killSwitch: boolean; confirmed?: string[] }): GateState {
  return {
    traceId: args.traceId,
    killSwitch: args.killSwitch,
    confirmed: [...(args.confirmed ?? [])],
    writes: 0,
    verdict: null,
    pending: [],
  }
}

const newToken = () => crypto.randomUUID()

/** What the gate decides about one call, or null when it may run. */
export function checkToolCall(state: GateState, tool: ToolEntry, args: unknown, now = Date.now()): GateBlock | null {
  if (tool.tier >= 2 && state.killSwitch) {
    return {
      code: 'kill-switch',
      why: `The kill switch is on, so ${tool.name} is blocked. Reset it on the desk before anything is decided or written.`,
    }
  }

  if (tool.set === 'write' && state.writes >= MAX_WRITES_PER_TURN) {
    return {
      code: 'write-cap',
      why: `This turn already made ${MAX_WRITES_PER_TURN} writes, which is the limit. Tell the reader what is left rather than doing it.`,
    }
  }

  if (tool.tier === 4) {
    return {
      code: 'tier-4',
      why: `${tool.name} can only be started by a person in the desk. Propose it, then let the desk's own confirm dialog confirm it.`,
    }
  }

  if (tool.needsVerdict && !state.verdict) {
    return {
      code: 'no-verdict',
      why: `${tool.name} needs a gate verdict from this turn. Call gate_check first and quote the rule id it returned.`,
    }
  }

  const confirmEach = tool.tier === 3
  const confirmOnce = tool.tier === 2 && !state.confirmed.includes(tool.name)
  if (confirmEach || confirmOnce) {
    const existing = state.pending.find((call) => call.tool === tool.name)
    if (existing) return { code: 'needs-confirmation', why: waiting(tool, existing), token: existing.token }

    const call: PendingCall = {
      token: newToken(),
      tool: tool.name,
      args,
      tier: tool.tier,
      traceId: state.traceId,
      createdAt: now,
    }
    state.pending.push(call)
    return { code: 'needs-confirmation', why: waiting(tool, call), token: call.token }
  }

  return null
}

function waiting(tool: ToolEntry, call: PendingCall): string {
  const once = call.tier === 2 ? ' This is confirmed once per session.' : ' This one is confirmed every time.'
  return `${tool.name} is waiting for a person to confirm it in the desk. Say what it would change and stop there.${once}`
}

/**
 * Spend a confirmation token. The runtime calls this when a person clicks; the
 * model never does. A token is single-use, expires after ten minutes, and only
 * a tier-2 confirmation is remembered for the session.
 */
export function confirmPending(state: GateState, token: string, now = Date.now()): ConfirmResult {
  const index = state.pending.findIndex((call) => call.token === token)
  if (index < 0) return { ok: false, why: 'That confirmation is not pending. It may already have been used.' }

  const call = state.pending[index]
  state.pending.splice(index, 1)
  if (now - call.createdAt > PENDING_TTL_MS) {
    return { ok: false, why: 'That confirmation expired. Ask again and confirm the new one.' }
  }

  if (call.tier === 2 && !state.confirmed.includes(call.tool)) state.confirmed.push(call.tool)
  return { ok: true, tool: call.tool, args: call.args }
}

/** Record a write the turn actually performed, for the per-turn cap. */
export function noteWrite(state: GateState): void {
  state.writes += 1
}

/** Record a verdict produced in this turn, so a ticket tool may use it. */
export function noteVerdict(state: GateState, verdict: { planId: string; ruleId: string | null }, now = Date.now()): void {
  state.verdict = { ...verdict, at: now }
}

/** The shape a blocked call takes back to the model: a tool-shaped error, not a throw. */
export function blockedOutcome(block: GateBlock): ToolOutcome {
  return fail(block.why, ['gate'], block.code)
}

/** The hook `dispatch` accepts, bound to one turn's gate state. */
export function gateGuard(state: GateState): ToolGuard {
  return (tool: ToolEntry, args: unknown) => {
    const block = checkToolCall(state, tool, args)
    return block ? blockedOutcome(block) : null
  }
}

