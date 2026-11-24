import { describe, expect, test } from 'bun:test'

import type { AuditRow } from './audit'
import { runCommand } from './commands'
import type { CommandOutcome, CommandState } from './commands'
import { emptyMemory } from './memory'
import type { Learning, Observation } from './memory'

const state = (over: Partial<CommandState> = {}): CommandState => ({
  memory: emptyMemory(),
  audit: [],
  today: '2026-11-19',
  ...over,
})

function text(outcome: CommandOutcome): string {
  if (!outcome.handled) throw new Error('expected a command')
  return outcome.text
}

const learning = (over: Partial<Learning> = {}): Learning => ({
  id: 'l1',
  trigger: 'the gate blocks',
  sequence: ['gate_check'],
  guidance: 'quote the rule id',
  success: 1,
  failure: 1,
  lastUsed: null,
  ...over,
})

const observation = (over: Partial<Observation> = {}): Observation => ({
  id: 'o1',
  section: 'note',
  text: 'the open was quiet',
  createdAt: '2026-11-19T14:35:00.000Z',
  session: '2026-11-19',
  ...over,
})

const auditRow = (over: Partial<AuditRow> = {}): AuditRow => ({
  id: 'row-1',
  traceId: 'trace-1',
  at: '2026-11-19T14:35:00.000Z',
  kind: 'tool',
  question: 'why was it blocked?',
  skills: ['desk.gate'],
  tool: 'gate_check',
  tier: 2,
  status: 'blocked',
  blocked: 'kill-switch',
  ms: 3,
  steps: null,
  tokensIn: null,
  tokensOut: null,
  refs: ['gate'],
  ...over,
})

describe('commands', () => {
  test('ignores anything that is not a command', () => {
    expect(runCommand('why was it blocked?', state())).toEqual({ handled: false })
  })

  test('lists the commands it knows for an unknown one', () => {
    expect(text(runCommand('/draft', state()))).toContain('/memory · /trace')
  })
})

describe('/memory', () => {
  test('says nothing is written down instead of inventing a memory', () => {
    const reply = text(runCommand('/memory', state()))
    expect(reply).toContain('0 facts')
    expect(reply).toContain('nothing written down by you yet')
    expect(reply).toContain('Learnings: 0')
  })

  test('adds a fact to the workspace and returns the new store', () => {
    const outcome = runCommand('/memory add fact: paper account only', state())
    if (!outcome.handled) throw new Error('expected a command')
    expect(outcome.workspace?.facts).toEqual(['paper account only'])
    expect(outcome.text).toContain('Saved as a fact')
    expect(outcome.text).toContain('outranks anything Ninth infers')
  })

  test('adds a preference, and says when it is already there', () => {
    const first = runCommand('/memory add preference: no shorts before 10:00', state())
    if (!first.handled || !first.workspace) throw new Error('expected a workspace')
    const again = runCommand('/memory add preference: no shorts before 10:00', state({ memory: { ...emptyMemory(), workspace: first.workspace } }))
    expect(text(again)).toContain('already written down')
  })

  test('forgets a line, and says when nothing matched', () => {
    const memory = { ...emptyMemory(), workspace: { facts: ['paper account only'], preferences: [], decisions: [] } }
    const outcome = runCommand('/memory forget paper account only', state({ memory }))
    if (!outcome.handled) throw new Error('expected a command')
    expect(outcome.workspace?.facts).toEqual([])
    expect(outcome.text).toContain('Forgot')

    const miss = runCommand('/memory forget lithium', state({ memory }))
    expect(text(miss)).toContain('Nothing in the workspace matches')
  })

  test('prints the workspace, the observations and each learning with its sample', () => {
    const reply = text(
      runCommand(
        '/memory',
        state({
          memory: {
            workspace: { facts: ['paper only'], preferences: [], decisions: [] },
            observations: [observation()],
            learnings: [learning()],
          },
        }),
      ),
    )
    expect(reply).toContain('Fact: paper only')
    expect(reply).toContain('[note] the open was quiet')
    expect(reply).toContain('frozen for 2026-11-19')
    expect(reply).toContain('unproven: 2 uses')
  })

  test('shows the command syntax rather than guessing at a bad add', () => {
    expect(text(runCommand('/memory add fact paper', state()))).toContain('/memory add fact: <line>')
  })
})

describe('/trace', () => {
  test('says there is nothing to trace yet', () => {
    expect(text(runCommand('/trace', state()))).toContain('No turns in the audit log yet')
  })

  test('reads the newest trace: routing, steps and every tool with its tier', () => {
    const audit = [
      auditRow({ id: 'turn', kind: 'turn', tool: null, tier: null, status: 'ok', blocked: null, steps: 2, tokensIn: 10, tokensOut: 20, skills: ['desk.gate', 'desk.core'] }),
      auditRow(),
    ]
    const reply = text(runCommand('/trace', state({ audit })))
    expect(reply).toContain('Trace trace-1')
    expect(reply).toContain('why was it blocked?')
    expect(reply).toContain('routed: desk.gate · desk.core')
    expect(reply).toContain('steps 2 · tokens in 10 · out 20')
    expect(reply).toContain('gate_check · tier 2 · blocked · blocked kill-switch · 3ms')
  })

  test('says when a turn made no tool calls', () => {
    const audit = [auditRow({ kind: 'turn', tool: null, tier: null, status: 'ok', blocked: null, steps: 1, skills: [] })]
    expect(text(runCommand('/trace', state({ audit })))).toContain('no tool calls')
  })

  test('names the trace in its refs', () => {
    const outcome = runCommand('/trace', state({ audit: [auditRow()] }))
    if (!outcome.handled) throw new Error('expected a command')
    expect(outcome.refs).toEqual(['trace:trace-1'])
  })
})
