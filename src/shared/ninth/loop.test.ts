import { describe, expect, test } from 'bun:test'

import { deterministicModel } from './answer'
import type { AuditRow } from './audit'
import { openGate } from './gate'
import type { Model, ModelCallInput, ModelReply, TurnEvent } from './loop'
import { runCommand } from './commands'
import { runTurn } from './loop'
import { emptyMemory } from './memory'
import type { ObservationSection } from './memory'
import type { MemorySnapshot } from './memory'
import { testContext } from './testctx'
import { MAX_INPUT_CHARS, MAX_STEPS, MAX_TOKENS_OUT } from './types'

function fakeModel(replies: ModelReply[]): Model & { calls: ModelCallInput[] } {
  const calls: ModelCallInput[] = []
  let index = 0
  return {
    calls,
    async call(input) {
      calls.push(input)
      const reply = replies[Math.min(index, replies.length - 1)]
      index += 1
      return reply
    },
  }
}

const collect = () => {
  const events: TurnEvent[] = []
  return { events, emit: (event: TurnEvent) => events.push(event) }
}

const rowOf = (rows: AuditRow[], kind: AuditRow['kind']): AuditRow | undefined => rows.find((row) => row.kind === kind)


describe('a turn', () => {
  test('routes, answers, prints its refs and stops', async () => {
    const model = fakeModel([{ text: 'The desk is flat.', refs: ['desk'] }])
    const { events, emit } = collect()
    const result = await runTurn({ question: 'what is going on?', ctx: testContext(), model, emit })

    expect(result.text).toBe('The desk is flat.')
    expect(result.refs).toEqual(['desk'])
    expect(result.steps).toBe(1)
    expect(result.stopped).toBe('done')
    expect(events.map((event) => event.t)).toEqual(['route', 'text', 'refs', 'done'])
  })

  test('hands the model the routed tools and the cached prefix', async () => {
    const model = fakeModel([{ text: 'ok' }])
    await runTurn({ question: 'why was it blocked?', ctx: testContext(), model })
    expect(model.calls[0].tools).toContain('gate_check')
    expect(model.calls[0].tools).toContain('get_quote')
    expect(model.calls[0].system).toContain('You are Ninth')
    expect(model.calls[0].system).toContain('<route>')
  })

  test('runs a tool the model asked for and lets it answer afterwards', async () => {
    const model = fakeModel([
      { calls: [{ id: 'c1', name: 'gate_check', args: { setupId: 'TSLA-reclaim' } }] },
      { text: 'Approved 6 shares.' },
    ])
    const gate = openGate({ traceId: 'trace-test', killSwitch: false, confirmed: ['gate_check'] })
    const { events, emit } = collect()
    const result = await runTurn({ question: 'why was it blocked?', ctx: testContext(), model, gate, emit })

    expect(result.steps).toBe(2)
    expect(result.refs).toContain('gate')
    const toolEvents = events.filter((event) => event.t === 'tool')
    expect(toolEvents.map((event) => event.status)).toEqual(['run', 'ok'])

    const toolMessage = model.calls[1].messages.find((message) => message.role === 'tool')
    expect(toolMessage && toolMessage.role === 'tool' ? toolMessage.result : '').toContain('"size":6')
  })

  test('stops when a confirmation is waiting on a person', async () => {
    const model = fakeModel([
      { calls: [{ id: 'c1', name: 'gate_check', args: { setupId: 'TSLA-reclaim' } }] },
      { text: 'this reply must never be requested' },
    ])
    const { events, emit } = collect()
    const result = await runTurn({ question: 'why was it blocked?', ctx: testContext(), model, emit })

    expect(result.stopped).toBe('pending')
    expect(result.steps).toBe(1)
    expect(result.text).toBe('')
    const pending = events.find((event) => event.t === 'pending')
    expect(pending && pending.t === 'pending' ? pending.token.length : 0).toBeGreaterThan(0)
    expect(rowOf(result.audit, 'tool')?.status).toBe('pending')
    expect(rowOf(result.audit, 'turn')?.status).toBe('pending')
  })

  test('stops after two gate blocks instead of letting the model retry', async () => {
    const ctx = testContext({
      account: { equityCents: 500_000, dayPnlCents: 0, tradesToday: 0, riskUsedCents: 0, killSwitch: true, sessionDate: '2026-11-19' },
    })
    const model = fakeModel([
      {
        calls: [
          { id: 'c1', name: 'gate_check', args: { setupId: 'TSLA-reclaim' } },
          { id: 'c2', name: 'size_plan', args: { entry: 393.06, stop: 388.32 } },
        ],
      },
      { text: 'never reached' },
    ])
    const result = await runTurn({ question: 'should I size it?', ctx, model })

    expect(result.stopped).toBe('blocked-twice')
    expect(result.steps).toBe(1)
    expect(model.calls).toHaveLength(1)
    expect(result.audit.filter((row) => row.kind === 'tool').every((row) => row.blocked === 'kill-switch')).toBe(true)
  })

  test('stops at the step cap', async () => {
    const model = fakeModel([{ calls: [{ id: 'c', name: 'get_quote', args: { symbol: 'TSLA' } }] }])
    const result = await runTurn({ question: 'what is the price?', ctx: testContext(), model })
    expect(result.stopped).toBe('steps')
    expect(result.steps).toBe(MAX_STEPS)
  })

  test('stops at the output-token cap', async () => {
    const model = fakeModel([
      { calls: [{ id: 'c', name: 'get_quote', args: { symbol: 'TSLA' } }], text: 'reading', tokensOut: 20_000 },
    ])
    const result = await runTurn({ question: 'what is the price?', ctx: testContext(), model })
    expect(result.stopped).toBe('tokens')
    expect(result.tokensOut).toBeGreaterThanOrEqual(MAX_TOKENS_OUT)
  })

  test('records an unknown tool as an error and carries on', async () => {
    const model = fakeModel([
      { calls: [{ id: 'c1', name: 'rm_rf', args: {} }, { id: 'c2', name: 'get_quote', args: { symbol: 'TSLA' } }] },
      { text: 'read the bar instead' },
    ])
    const result = await runTurn({ question: 'what is the price?', ctx: testContext(), model })
    expect(result.steps).toBe(2)
    expect(result.text).toBe('read the bar instead')
    const rows = result.audit.filter((row) => row.kind === 'tool')
    expect(rows[0].status).toBe('error')
    expect(rows[1].status).toBe('ok')
  })

  test('audits every tool call under the turn’s trace id', async () => {
    const model = fakeModel([
      { calls: [{ id: 'c1', name: 'get_quote', args: { symbol: 'TSLA' } }] },
      { text: 'done' },
    ])
    const result = await runTurn({ question: 'what is the price?', ctx: testContext(), model })
    const tool = rowOf(result.audit, 'tool')
    expect(tool).toMatchObject({ traceId: 'trace-test', tool: 'get_quote', tier: 1, status: 'ok', question: 'what is the price?' })
    const turn = rowOf(result.audit, 'turn')
    expect(turn).toMatchObject({ traceId: 'trace-test', steps: 2 })
    expect(turn?.refs).toContain('chart:TSLA:5')
  })

  test('caps the question it will send at 2,000 characters', async () => {
    const model = fakeModel([{ text: 'ok' }])
    const result = await runTurn({ question: 'a'.repeat(3_000), ctx: testContext(), model })
    expect(result.question.length).toBe(MAX_INPUT_CHARS)
  })
})

describe('memory in a turn', () => {
  const memory: MemorySnapshot = {
    workspace: { facts: ['paper only'], preferences: ['no shorts before 10:00'], decisions: [] },
    observations: [
      { id: 'o1', section: 'note' as const, text: 'the open was quiet', createdAt: '2026-11-19T14:35:00.000Z', session: '2026-11-19' },
    ],
    learnings: [
      { id: 'l1', trigger: 'the gate blocks on R-12', guidance: 'quote the rule id', sequence: ['gate_check'], success: 2, failure: 0, lastUsed: null },
      { id: 'l2', trigger: 'the open is quiet', guidance: 'read levels first', sequence: ['list_levels'], success: 5, failure: 1, lastUsed: null },
    ],
  }

  test('prints the workspace ahead of observations and recalls only the matching learning', async () => {
    const model = fakeModel([{ text: 'ok' }])
    await runTurn({ question: 'why was the gate blocked?', ctx: { ...testContext(), memory }, model })
    const system = model.calls[0].system
    expect(system).toContain('Fact: paper only')
    expect(system).toContain('[note] the open was quiet')
    expect(system).toContain('the gate blocks on R-12')
    expect(system).not.toContain('read levels first')
    expect(system).toContain('unproven: 2 uses')
  })

  test('reviews a three-tool turn and marks it a candidate learning', async () => {
    const model = fakeModel([
      {
        calls: [
          { id: 'c1', name: 'get_quote', args: { symbol: 'TSLA' } },
          { id: 'c2', name: 'list_setups', args: { symbol: 'TSLA' } },
          { id: 'c3', name: 'list_levels', args: { symbol: 'TSLA' } },
        ],
      },
      { text: 'read all three' },
    ])
    const result = await runTurn({ question: 'where are the levels?', ctx: testContext(), model })
    expect(result.review.score).toBe(8)
    expect(result.review.candidate).toBe(true)
    expect(result.review.reasons).toContain('tools:3')
  })

  test('a fact added with /memory is in the very next prompt', async () => {
    const base = testContext()
    const added = runCommand('/memory add preference: no shorts before 10:00', {
      memory: emptyMemory(),
      audit: [],
      desk: base.desk,
      watches: [],
      today: '2026-11-19',
    })
    if (!added.handled || !added.workspace) throw new Error('expected a workspace')

    const model = fakeModel([{ text: 'ok' }])
    await runTurn({
      question: 'where are the levels?',
      ctx: { ...base, memory: { ...emptyMemory(), workspace: added.workspace } },
      model,
    })
    expect(model.calls[0].system).toContain('Preference: no shorts before 10:00')
  })

  test('drops the no-repeat point when the same question comes back', async () => {
    const model = fakeModel([{ text: 'ok' }])
    const result = await runTurn({
      question: 'why was it blocked?',
      ctx: testContext(),
      model,
      asked: ['Why was it  blocked?'],
    })
    expect(result.review.reasons).not.toContain('no-repeat')
  })
})

describe('the deterministic client', () => {
  test('answers from the desk with no model, no key and no tools', async () => {
    const ctx = testContext()
    const result = await runTurn({ question: 'why was it blocked?', ctx, model: deterministicModel(ctx.desk) })
    expect(result.steps).toBe(1)
    expect(result.text).toContain('approved 6 shares')
    expect(result.refs).toContain('gate')
  })

  test('does not invent a verdict when no rule gave the gate a plan', async () => {
    const ctx = testContext({ setups: [], gate: null })
    const result = await runTurn({ question: 'why was it blocked?', ctx, model: deterministicModel(ctx.desk) })
    expect(result.text).toContain('no verdict to explain')
    expect(result.text).not.toContain('R-')
  })

  test('reads the quote from the snapshot', async () => {
    const ctx = testContext()
    const result = await runTurn({ question: 'what is the price?', ctx, model: deterministicModel(ctx.desk) })
    expect(result.text).toContain('379.42')
    expect(result.refs).toContain('chart:TSLA:5m')
  })
})

describe('the write cap', () => {
  test('lets a turn write three times and refuses the fourth', async () => {
    const written: string[] = []
    const ctx = {
      ...testContext(),
      ports: {
        remember: (observation: { section: ObservationSection; text: string }) => {
          written.push(observation.text)
          return { ok: true as const, id: `o-${written.length}` }
        },
      },
    }
    const calls = [1, 2, 3, 4].map((n) => ({ id: `c${n}`, name: 'memory_write', args: { text: `line ${n}` } }))
    const model = fakeModel([{ calls }, { text: 'Three lines kept.' }])
    const gate = openGate({ traceId: 'trace-test', killSwitch: false, confirmed: ['memory_write'] })
    const result = await runTurn({ question: 'remember these', ctx, model, gate })

    expect(written).toEqual(['line 1', 'line 2', 'line 3'])
    expect(result.audit.filter((row) => row.blocked === 'write-cap')).toHaveLength(1)
  })
})
