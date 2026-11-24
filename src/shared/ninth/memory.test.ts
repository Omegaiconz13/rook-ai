import { describe, expect, test } from 'bun:test'

import {
  addWorkspaceLine,
  emptyWorkspace,
  emptyMemory,
  MEMORY_TEXT_MAX,
  observationLines,
  recall,
  recallLearnings,
  recordObservations,
  removeWorkspaceLine,
  workspaceLines,
} from './memory'
import type { Learning, Observation } from './memory'

let counter = 0
const observation = (over: Partial<Observation> = {}): Observation => ({
  id: `obs-${++counter}`,
  section: 'note',
  text: 'the open was quiet',
  createdAt: '2026-11-19T14:35:00.000Z',
  session: '2026-11-19',
  ...over,
})

describe('the workspace', () => {
  test('adds lines, ignores an exact duplicate, and keeps their order', () => {
    let workspace = emptyWorkspace()
    workspace = addWorkspaceLine(workspace, 'facts', 'paper account only')
    workspace = addWorkspaceLine(workspace, 'facts', 'Paper account only')
    workspace = addWorkspaceLine(workspace, 'preferences', 'no shorts before 10:00')
    expect(workspace.facts).toEqual(['paper account only'])
    expect(workspaceLines(workspace)).toEqual(['Fact: paper account only', 'Preference: no shorts before 10:00'])
  })

  test('trims to the line limit and drops an empty line', () => {
    const long = 'x'.repeat(MEMORY_TEXT_MAX + 20)
    const workspace = addWorkspaceLine(emptyWorkspace(), 'decisions', long)
    expect(workspace.decisions[0].length).toBe(MEMORY_TEXT_MAX)
    expect(addWorkspaceLine(workspace, 'decisions', '   ').decisions).toHaveLength(1)
  })

  test('removes a line the reader no longer wants, whatever the case', () => {
    const workspace = addWorkspaceLine(emptyWorkspace(), 'preferences', 'No shorts before 10:00')
    expect(removeWorkspaceLine(workspace, 'no shorts before 10:00').preferences).toEqual([])
  })
})

describe('observations', () => {
  const write = (list: Observation[], texts: string[], session = '2026-11-19') => {
    let next = 0
    return recordObservations(list, {
      session,
      items: texts.map((text) => ({ section: 'note' as const, text })),
      at: '2026-11-19T14:35:00.000Z',
      id: () => `new-${++next}`,
    })
  }

  test('refuses to call one sentence a memory', () => {
    expect(write([], ['the open was quiet'])).toEqual([])
    expect(write([], ['a', 'b'])).toEqual([])
  })

  test('records three new lines once', () => {
    const rows = write([], ['a', 'b', 'c'])
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.text)).toEqual(['a', 'b', 'c'])
    expect(rows[0].session).toBe('2026-11-19')
  })

  test('freezes the session after its first write', () => {
    const rows = write([], ['a', 'b', 'c'])
    expect(write(rows, ['d', 'e', 'f'])).toBe(rows)
    expect(write(rows, ['d', 'e', 'f'], '2026-11-20')).toHaveLength(6)
  })

  test('counts only lines it does not already hold', () => {
    const rows = write([], ['a', 'b', 'c'])
    expect(write(rows, ['a', 'b', 'c'], '2026-11-20')).toBe(rows)
  })

  test('hands the prompt the newest six', () => {
    const rows = Array.from({ length: 9 }, (_, index) => observation({ text: `line ${index}` }))
    expect(observationLines(rows).map((row) => row.text)).toEqual(['line 3', 'line 4', 'line 5', 'line 6', 'line 7', 'line 8'])
  })
})

describe('recall', () => {
  const docs = ['gate blocked the plan on R-12', 'journal row about NVDA', 'size at the position cap', 'opening range trigger']

  test('ranks the document that shares the question’s words', () => {
    expect(recall('why was the gate blocked', docs)[0].index).toBe(0)
    expect(recall('NVDA journal', docs)[0].index).toBe(1)
    expect(recall('position cap size', docs)[0].index).toBe(2)
  })

  test('returns nothing when no word is shared', () => {
    expect(recall('weather in Lisbon', docs)).toEqual([])
    expect(recall('', docs)).toEqual([])
  })

  test('honours the top-k and breaks ties by document order', () => {
    expect(recall('size', docs, 2).length).toBeLessThanOrEqual(2)
    const tied = recall('trigger', ['trigger', 'trigger'], 5)
    expect(tied.map((hit) => hit.index)).toEqual([0, 1])
  })

  test('picks the learnings that match the question, not the newest ones', () => {
    const learnings: Learning[] = [
      { id: 'l1', trigger: 'the gate blocks on R-12', guidance: 'quote the rule id', sequence: ['gate_check'], success: 2, failure: 0, lastUsed: null },
      { id: 'l2', trigger: 'the open is quiet', guidance: 'read levels first', sequence: ['list_levels'], success: 5, failure: 1, lastUsed: null },
    ]
    expect(recallLearnings(learnings, 'the gate blocked, why')[0].id).toBe('l1')
  })
})

describe('an empty memory', () => {
  test('is an empty workspace and no rows', () => {
    expect(emptyMemory()).toEqual({
      workspace: { facts: [], preferences: [], decisions: [] },
      observations: [],
      learnings: [],
    })
  })
})
