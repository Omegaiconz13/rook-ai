import { describe, expect, test } from 'bun:test'

import { buildPrompt, cachedPrefix, composeSkills } from './prompt'
import { route } from './router'
import { SKILLS } from './skills/catalog'
import type { SkillDef } from './skills/catalog'
import { testContext } from './testctx'
import { MAX_LEARNINGS, SKILL_BODY_BUDGET_CHARS } from './types'

const desk = testContext().desk
const tools = ['get_quote', 'gate_check', 'size_plan', 'read_account']
const routed = route({ question: 'why was it blocked?', hasSetups: true })

const fake = (id: string, priority: number, body: string): SkillDef => ({
  id,
  description: `the ${id} skill`,
  priority,
  stages: ['discover'],
  keywords: [],
  coActivate: [],
  tools: [],
  summary: 'a test skill',
  prompt: body,
})

describe('the cached prefix', () => {
  test('is byte-identical from one turn to the next', () => {
    expect(cachedPrefix(tools)).toBe(cachedPrefix(tools))
    const first = buildPrompt({ routed, tools, desk })
    const second = buildPrompt({ routed: route({ question: 'what did I journal?', hasSetups: true }), tools, desk })
    expect(second.prefix).toBe(first.prefix)
  })

  test('lists the tools it was handed, with their tier', () => {
    const prefix = cachedPrefix(tools)
    expect(prefix).toContain('get_quote(symbol:symbol, timeframe?:string)')
    expect(prefix).toContain('[tier 1]')
    expect(prefix).toContain('gate_check(')
    expect(prefix).not.toContain('ticket_confirm')
  })

  test('carries the paper-only defaults and the refusal to advise', () => {
    const prefix = cachedPrefix(tools)
    expect(prefix).toContain('paper-trading desk')
    expect(prefix).toContain('not a financial adviser')
    expect(prefix).toContain('Never widen one to make a trade pass')
    expect(prefix.toLowerCase()).not.toContain('guaranteed')
  })
})

describe('the body budget', () => {
  test('sheds the least important body first, and keeps its summary', () => {
    // Four full-size bodies (3,200 each) cannot fit 12,000, so the least
    // important one loses its body and keeps its one-line description.
    const skills = [fake('a', 20, 'x'.repeat(3_200)), fake('b', 30, 'y'.repeat(3_200)), fake('c', 40, 'z'.repeat(3_200)), fake('d', 50, 'w'.repeat(3_200))]
    const routedRows = [
      { id: 'a', score: 50, reasons: [] },
      { id: 'b', score: 40, reasons: [] },
      { id: 'c', score: 30, reasons: [] },
      { id: 'd', score: 20, reasons: [] },
    ]
    const composed = composeSkills(routedRows, skills)
    expect(composed.shed).toEqual(['d'])
    expect(composed.bodyChars).toBe(9_600)
    expect(composed.active.find((row) => row.id === 'd')?.body).toBeNull()

    const prompt = buildPrompt({ routed: routedRows, tools, desk }, skills)
    expect(prompt.turn).toContain('<skill id="d" body shed="true">the d skill</skill>')
  })

  test('fits the whole catalog inside the 12,000 character budget', () => {
    const every = SKILLS.map((skill) => ({ id: skill.id, score: 10, reasons: [] }))
    const composed = composeSkills(every)
    expect(composed.shed).toEqual([])
    expect(composed.bodyChars).toBeLessThanOrEqual(SKILL_BODY_BUDGET_CHARS)
  })

  test('reports what it actually included', () => {
    const prompt = buildPrompt({ routed, tools, desk })
    expect(prompt.bodyChars).toBe(prompt.active.reduce((n, row) => n + (row.body?.length ?? 0), 0))
  })
})

describe('the turn block', () => {
  test('shows the routing reasons behind each active skill', () => {
    const prompt = buildPrompt({ routed, tools, desk })
    expect(prompt.turn).toContain('<route>')
    expect(prompt.turn).toContain('desk.gate (80.80): kw:blocked')
    expect(prompt.turn).toContain('why="kw:blocked kw:why stage:evaluate"')
  })

  test('puts the workspace ahead of what Ninth observed', () => {
    const prompt = buildPrompt({
      routed,
      tools,
      desk,
      workspace: ['no shorts before 10:00'],
      memory: [{ section: 'habit', text: 'you tend to size up after a win' }],
    })
    const workspaceAt = prompt.turn.indexOf('<workspace>')
    const observationsAt = prompt.turn.indexOf('<observations>')
    expect(workspaceAt).toBeGreaterThan(-1)
    expect(observationsAt).toBeGreaterThan(workspaceAt)
    expect(prompt.turn).toContain("outranks anything you inferred")
  })

  test('says a learning is unproven below ten uses, and quotes the sample at or above it', () => {
    const prompt = buildPrompt({
      routed,
      tools,
      desk,
      learnings: [
        { trigger: 'the open is quiet', guidance: 'read levels first', success: 1, failure: 1 },
        { trigger: 'the gate blocks', guidance: 'quote the rule id', success: 11, failure: 2 },
      ],
    })
    expect(prompt.turn).toContain('unproven: 2 uses')
    expect(prompt.turn).toContain('13 uses')
  })

  test('injects at most three learnings', () => {
    const many = Array.from({ length: 5 }, (_, index) => ({
      trigger: `case ${index}`,
      guidance: 'read first',
      success: 1,
      failure: 0,
    }))
    const prompt = buildPrompt({ routed, tools, desk, learnings: many })
    expect(prompt.turn.match(/when case/g)).toHaveLength(MAX_LEARNINGS)
  })

  test('describes a pending confirmation as not yet done', () => {
    const prompt = buildPrompt({ routed, tools, desk, pending: [{ tool: 'journal_append', token: 'tok-1' }] })
    expect(prompt.turn).toContain('journal_append is waiting for a person')
    expect(prompt.turn).toContain('It has not happened')
    expect(prompt.turn).toContain('Never state that it was confirmed')
  })

  test('reads the desk it was handed, and says which clock', () => {
    const prompt = buildPrompt({ routed, tools, desk })
    expect(prompt.turn).toContain('symbol TSLA · timeframe 5')
    expect(prompt.turn).toContain('demo clock')
    expect(prompt.turn).toContain('trades today 1/3')
  })

  test('keeps the prefix and the turn separable', () => {
    const prompt = buildPrompt({ routed, tools, desk })
    expect(prompt.system.startsWith(prompt.prefix)).toBe(true)
    expect(prompt.turn).not.toContain('<tools>')
  })
})
