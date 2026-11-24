import { describe, expect, test } from 'bun:test'

import type { JournalRow } from '../../journal'
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
  const journal: JournalRow[] = []
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
        appendJournal: (row: JournalRow) => {
          journal.push(row)
          return { ok: true as const, tradeId: row.tradeId }
        },
      },
    },
    remembered,
    saved,
    journal,
  }
}

describe('the write set', () => {
  test('holds memory at tier 2 and the desk’s own rows at tier 3, and nothing that reads', () => {
    expect(WRITE_TOOLS.map((tool) => tool.name)).toEqual(['memory_write', 'learn_save', 'journal_append'])
    for (const tool of WRITE_TOOLS) expect(tool.set).toBe('write')
    expect(WRITE_TOOLS[0].tier).toBe(2)
    expect(WRITE_TOOLS[1].tier).toBe(3)
    expect(WRITE_TOOLS[2].tier).toBe(3)
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

describe('journal_append', () => {
  test('writes the gate’s own row for a setup, not a number the model retyped', () => {
    const { ctx, journal } = withPorts()
    const result = data(
      dispatch('journal_append', { setupId: 'TSLA-reclaim', took: true, note: 'took the reclaim', tags: ['A+', 'reclaim'] }, ctx),
    )

    expect(journal).toHaveLength(1)
    expect(journal[0]).toMatchObject({
      symbol: 'TSLA',
      setup: 'reclaim',
      verdict: 'APPROVED',
      took: true,
      size: 6,
      entry: '393.06',
      stop: '388.32',
      target: '402.54',
      rPlanned: '2.00',
      note: 'took the reclaim',
      tags: ['A+', 'reclaim'],
      source: 'gate',
    })
    expect(result).toMatchObject({ verdict: 'APPROVED', size: 6, entry: '393.06', source: 'gate' })
    expect(result.tradeId).toBe(journal[0].tradeId)
  })

  test('defaults to the setup the chart is showing and records it as not taken', () => {
    const { ctx, journal } = withPorts()
    data(dispatch('journal_append', {}, ctx))
    expect(journal[0].setup).toBe('reclaim')
    expect(journal[0].took).toBe(false)
  })

  test('keeps a refused trade as a BLOCKED row rather than dropping it', () => {
    const { ctx, journal } = withPorts({
      account: {
        equityCents: 500_000,
        dayPnlCents: 0,
        tradesToday: 3,
        riskUsedCents: 0,
        killSwitch: false,
        sessionDate: '2026-11-19',
      },
    })
    const result = data(dispatch('journal_append', { setupId: 'TSLA-reclaim', took: true }, ctx))
    expect(journal[0]).toMatchObject({ verdict: 'BLOCKED', took: false, rulesFollowed: false })
    expect(journal[0].gateRule).not.toBe('')
    expect(result.verdict).toBe('BLOCKED')
  })

  test('refuses a setup that never triggered instead of citing a verdict for it', () => {
    const { ctx, journal } = withPorts()
    expect(reason(dispatch('journal_append', { setupId: 'TSLA-orb' }, ctx))).toContain('did not trigger today (expired)')
    expect(journal).toEqual([])
  })

  test('writes a manual row from the prices the reader quoted', () => {
    const { ctx, journal } = withPorts()
    const result = data(
      dispatch('journal_append', { symbol: 'NVDA', entry: 120, stop: 118.5, target: 124, size: 40, tags: ['FOMO'] }, ctx),
    )
    expect(journal[0]).toMatchObject({
      symbol: 'NVDA',
      setup: 'manual',
      verdict: 'MANUAL',
      took: true,
      size: 40,
      entry: '120.00',
      stop: '118.50',
      target: '124.00',
      rPlanned: '2.67',
      source: 'manual',
    })
    expect(result).toMatchObject({ verdict: 'MANUAL', source: 'manual' })
  })

  test('refuses half a manual row, a long that is not a long, and a missing size', () => {
    const { ctx, journal } = withPorts()
    expect(reason(dispatch('journal_append', { entry: 120 }, ctx))).toContain('entry, stop and target together')
    expect(reason(dispatch('journal_append', { entry: 120, stop: 118, target: 124 }, ctx))).toContain('needs the size')
    expect(reason(dispatch('journal_append', { entry: 120, stop: 121, target: 124, size: 10 }, ctx))).toContain(
      'stop must sit below the entry',
    )
    expect(reason(dispatch('journal_append', { setupId: 'TSLA-reclaim', entry: 120, stop: 118, target: 124, size: 10 }, ctx))).toContain(
      'not both',
    )
    expect(journal).toEqual([])
  })

  test('names a setup that does not exist instead of writing something else', () => {
    const { ctx, journal } = withPorts()
    expect(reason(dispatch('journal_append', { setupId: 'TSLA-nope' }, ctx))).toContain('No setup named "TSLA-nope"')
    expect(journal).toEqual([])
  })

  test('refuses a note longer than the schema keeps', () => {
    const { ctx, journal } = withPorts()
    expect(reason(dispatch('journal_append', { note: 'x'.repeat(281) }, ctx))).toContain('at most 280')
    expect(journal).toEqual([])
  })

  test('refuses without a port and reports the runtime’s refusal', () => {
    expect(reason(dispatch('journal_append', {}, testContext()))).toContain('not accepting journal writes')
    const ctx = { ...testContext(), ports: { appendJournal: () => ({ ok: false as const, why: 'That row is already in the journal.' }) } }
    expect(reason(dispatch('journal_append', {}, ctx))).toBe('That row is already in the journal.')
  })

  test('asks every time, even after the same tool was confirmed', () => {
    const gate = openGate({ traceId: 'trace-test', killSwitch: false, confirmed: ['journal_append'] })
    expect(checkToolCall(gate, WRITE_TOOLS[2], {})?.code).toBe('needs-confirmation')
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
