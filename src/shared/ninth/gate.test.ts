import { describe, expect, test } from 'bun:test'

import {
  blockedOutcome,
  checkToolCall,
  confirmPending,
  gateGuard,
  noteVerdict,
  noteWrite,
  openGate,
  PENDING_TTL_MS,
} from './gate'
import { dispatch } from './registry'
import { fail, ok } from './result'
import { testContext } from './testctx'
import type { ToolEntry } from './types'
import { MAX_WRITES_PER_TURN } from './types'

const tool = (over: Partial<ToolEntry> & { name: string }): ToolEntry => ({
  set: 'write',
  tier: 3,
  description: 'a test tool',
  args: {},
  run: () => ok({}),
  ...over,
})

const gate = (over: { killSwitch?: boolean; confirmed?: string[] } = {}) =>
  openGate({ traceId: 'trace-1', killSwitch: over.killSwitch ?? false, confirmed: over.confirmed })

describe('tier 1 and 2', () => {
  test('lets a read run even with the kill switch on', () => {
    expect(checkToolCall(gate({ killSwitch: true }), tool({ name: 'get_quote', set: 'read', tier: 1 }), {})).toBeNull()
  })

  test('blocks a decision under the kill switch, with the rule that stopped it', () => {
    const block = checkToolCall(gate({ killSwitch: true }), tool({ name: 'gate_check', set: 'decide', tier: 2 }), {})
    expect(block).toMatchObject({ code: 'kill-switch' })
    expect(block?.why).toContain('kill switch is on')
    expect(block?.token).toBeUndefined()
  })

  test('asks a person to confirm a tier-2 tool once, then remembers it for the session', () => {
    const state = gate()
    const entry = tool({ name: 'memory_write', set: 'write', tier: 2 })
    const block = checkToolCall(state, entry, { text: 'no shorts before 10:00' })
    expect(block).toMatchObject({ code: 'needs-confirmation' })
    expect(block?.token).toBeTruthy()

    const confirm = confirmPending(state, block?.token as string)
    expect(confirm).toEqual({ ok: true, tool: 'memory_write', args: { text: 'no shorts before 10:00' } })
    expect(checkToolCall(state, entry, {})).toBeNull()
    expect(state.confirmed).toEqual(['memory_write'])
  })

  test('reuses the pending token instead of minting one per retry', () => {
    const state = gate()
    const entry = tool({ name: 'limits_update', set: 'write', tier: 2 })
    const first = checkToolCall(state, entry, {})
    const second = checkToolCall(state, entry, {})
    expect(second?.token).toBe(first?.token as string)
    expect(state.pending).toHaveLength(1)
  })
})

describe('tier 3 and 4', () => {
  test('asks again for every tier-3 call, even after a confirmation', () => {
    const state = gate()
    const entry = tool({ name: 'journal_append', tier: 3 })
    const block = checkToolCall(state, entry, {})
    expect(block?.code).toBe('needs-confirmation')
    confirmPending(state, block?.token as string)

    const again = checkToolCall(state, entry, {})
    expect(again?.code).toBe('needs-confirmation')
    expect(again?.token).not.toBe(block?.token as string)
  })

  test('rejects a tier-4 call from the model path and never mints a token', () => {
    const state = gate()
    const block = checkToolCall(state, tool({ name: 'ticket_confirm', tier: 4, needsVerdict: true }), {})
    expect(block).toMatchObject({ code: 'tier-4' })
    expect(block?.why).toContain('started by a person')
    expect(block?.token).toBeUndefined()
    expect(state.pending).toHaveLength(0)
  })

  test('turns a block into a tool-shaped error the model can repeat', () => {
    const outcome = blockedOutcome({ code: 'tier-4', why: 'Only a person can confirm this.' })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.blocked).toBe('tier-4')
    expect(outcome.why).toBe('Only a person can confirm this.')
  })
})

describe('the write cap', () => {
  test('stops the fourth write in one turn', () => {
    const state = gate()
    const entry = tool({ name: 'clear', tier: 4, set: 'write' })
    for (let i = 0; i < MAX_WRITES_PER_TURN; i++) noteWrite(state)
    const block = checkToolCall(state, { ...entry, tier: 3 }, {})
    expect(block?.code).toBe('write-cap')
    expect(block?.why).toContain(`${MAX_WRITES_PER_TURN} writes`)
  })

  test('does not count a decide call as a write', () => {
    const state = gate()
    // Decide tools are tier 2, so the first one in a session asks once; the
    // point here is that asking costs no write budget.
    const block = checkToolCall(state, tool({ name: 'size_plan', set: 'decide', tier: 2 }), {})
    expect(block?.code).toBe('needs-confirmation')
    expect(state.writes).toBe(0)
  })
})

describe('the token', () => {
  test('is single use', () => {
    const state = gate()
    const block = checkToolCall(state, tool({ name: 'journal_append', tier: 3 }), {})
    expect(confirmPending(state, block?.token as string).ok).toBe(true)
    const second = confirmPending(state, block?.token as string)
    expect(second.ok).toBe(false)
    if (second.ok) throw new Error('unreachable')
    expect(second.why).toContain('not pending')
  })

  test('expires after ten minutes', () => {
    const state = gate()
    const block = checkToolCall(state, tool({ name: 'journal_append', tier: 3 }), {}, 1_000)
    const late = confirmPending(state, block?.token as string, 1_000 + PENDING_TTL_MS + 1)
    expect(late.ok).toBe(false)
    if (late.ok) throw new Error('unreachable')
    expect(late.why).toContain('expired')
  })

  test('refuses a token nobody minted', () => {
    expect(confirmPending(gate(), 'made-up').ok).toBe(false)
  })
})

describe('the verdict requirement', () => {
  test('blocks a ticket tool until a verdict is recorded in this turn', () => {
    const state = gate()
    const entry = tool({ name: 'ticket_propose', set: 'write', tier: 3, needsVerdict: true })
    expect(checkToolCall(state, entry, {})).toMatchObject({ code: 'no-verdict' })
    noteVerdict(state, { planId: 'plan-TSLA-reclaim', ruleId: null })
    expect(checkToolCall(state, entry, {})?.code).toBe('needs-confirmation')
  })
})

describe('the guard', () => {
  test('runs before argument validation, so a blocked call learns nothing', () => {
    const state = gate({ killSwitch: true })
    const outcome = dispatch('gate_check', {}, testContext(), gateGuard(state))
    expect(outcome.ok).toBe(false)
    if (outcome.ok) throw new Error('unreachable')
    expect(outcome.why).toContain('kill switch')
    expect(outcome.why).not.toContain('setupId')
  })

  test('stops the call instead of dropping the guard', () => {
    const refused = dispatch('get_quote', { symbol: 'TSLA' }, testContext(), () => fail('no tools today'))
    expect(refused.ok).toBe(false)
    if (refused.ok) throw new Error('unreachable')
    expect(refused.why).toBe('no tools today')
  })

  test('lets a read through when the gate allows it', () => {
    const outcome = dispatch('get_quote', { symbol: 'TSLA' }, testContext(), gateGuard(gate()))
    expect(outcome.ok).toBe(true)
  })
})
