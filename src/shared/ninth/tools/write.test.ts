import { describe, expect, test } from 'bun:test'

import { checkToolCall, openGate } from '../gate'
import { MEMORY_TEXT_MAX } from '../memory'
import { dispatch } from '../registry'
import { testContext } from '../testctx'
import type { ToolOutcome } from '../types'
import { WRITE_TOOLS } from './write'

function data(outcome: ToolOutcome): Record<string, unknown> {
  if (!outcome.ok) throw new Error(`expected ok, got: ${outcome.why}`)
  return outcome.data
}

function reason(outcome: ToolOutcome): string {
  if (outcome.ok) throw new Error('expected a refusal, got a result')
  return outcome.why
}

const withPorts = (over: Parameters<typeof testContext>[0] = {}) => {
  const remembered: { section: string; text: string }[] = []
  const saved: { trigger: string; sequence: string[]; guidance: string }[] = []
  const ctx = testContext(over)
  return {
    ctx: {
      ...ctx,
      ports: {
        remember: (observation: { section: string; text: string }) => {
          remembered.push(observation)
          return { ok: true as const, id: `obs-${remembered.length}` }
        },
        saveLearning: (learning: { trigger: string; sequence: string[]; guidance: string }) => {
          saved.push(learning)
          return { ok: true as const, id: `learn-${saved.length}` }
        },
      },
    },
    remembered,
    saved,
  }
}

describe('the write set', () => {
  test('holds memory at tier 2 and a learning at tier 3, and nothing that reads', () => {
    expect(WRITE_TOOLS.map((tool) => tool.name)).toEqual(['memory_write', 'learn_save'])
    for (const tool of WRITE_TOOLS) expect(tool.set).toBe('write')
    expect(WRITE_TOOLS[0].tier).toBe(2)
    expect(WRITE_TOOLS[1].tier).toBe(3)
  })
})

describe('memory_write', () => {
  test('keeps the line the user asked for, through the runtime’s port', () => {
    const { ctx, remembered } = withPorts()
    const result = data(dispatch('memory_write', { section: 'habit', text: 'you size up after a win' }, ctx))
    expect(remembered).toEqual([{ section: 'habit', text: 'you size up after a win' }])
    expect(result).toMatchObject({ id: 'obs-1', section: 'habit', text: 'you size up after a win' })
  })

  test('refuses to pretend it wrote when the desk is not accepting writes', () => {
    expect(reason(dispatch('memory_write', { text: 'note this' }, testContext()))).toContain(
      'not accepting memory writes',
    )
  })

  test('refuses an empty or oversized line', () => {
    const { ctx, remembered } = withPorts()
    expect(reason(dispatch('memory_write', { text: '   ' }, ctx))).toContain('Missing text')
    expect(reason(dispatch('memory_write', { text: 'x'.repeat(MEMORY_TEXT_MAX + 1) }, ctx))).toContain(
      `at most ${MEMORY_TEXT_MAX}`,
    )
    expect(remembered).toEqual([])
  })

  test('reports a storage refusal instead of claiming success', () => {
    const ctx = { ...testContext(), ports: { remember: () => ({ ok: false as const, why: 'storage is full' }) } }
    expect(reason(dispatch('memory_write', { text: 'note this' }, ctx))).toBe('storage is full')
  })

  test('asks once per session, like every tier-2 tool', () => {
    const tool = WRITE_TOOLS[0]
    const gate = openGate({ traceId: 'trace-test', killSwitch: false })
    expect(checkToolCall(gate, tool, { text: 'x' })?.code).toBe('needs-confirmation')
  })
})

describe('learn_save', () => {
  test('saves a trigger, its guidance and the sequence that worked', () => {
    const { ctx, saved } = withPorts()
    const result = data(
      dispatch(
        'learn_save',
        { trigger: 'the gate blocks on R-12', guidance: 'quote the rule id', sequence: ['gate_check', 'size_plan'] },
        ctx,
      ),
    )
    expect(saved).toEqual([
      { trigger: 'the gate blocks on R-12', guidance: 'quote the rule id', sequence: ['gate_check', 'size_plan'] },
    ])
    expect(result).toMatchObject({ id: 'learn-1', success: 1, failure: 0, proof: 'unproven: 1 use' })
  })

  test('needs both halves of a learning', () => {
    const { ctx } = withPorts()
    expect(reason(dispatch('learn_save', { trigger: 'x' }, ctx))).toContain('Missing guidance')
    expect(reason(dispatch('learn_save', { guidance: 'y' }, ctx))).toContain('Missing trigger')
  })

  test('keeps at most five steps', () => {
    const { ctx, saved } = withPorts()
    dispatch('learn_save', { trigger: 't', guidance: 'g', sequence: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }, ctx)
    expect(saved[0].sequence).toHaveLength(5)
  })

  test('refuses without a port', () => {
    expect(reason(dispatch('learn_save', { trigger: 't', guidance: 'g' }, testContext()))).toContain(
      'not accepting learnings',
    )
  })
})
