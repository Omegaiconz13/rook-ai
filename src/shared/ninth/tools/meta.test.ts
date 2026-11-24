import { describe, expect, test } from 'bun:test'

import { dispatch, toolByName, toolsInSet } from '../registry'
import { ALWAYS_TOOLS, allowedTools, route } from '../router'
import { testContext } from '../testctx'

const run = (name: string, args: Record<string, unknown>, ctx = testContext()) => dispatch(name, args, ctx)

function data(outcome: ReturnType<typeof run>): Record<string, unknown> {
  if (!outcome.ok) throw new Error(outcome.why)
  return outcome.data
}

function why(outcome: ReturnType<typeof run>): string {
  if (outcome.ok) throw new Error('expected a refusal')
  return outcome.why
}

type RoutedRow = { id: string; score: number; reasons: string[] }

describe('the meta set', () => {
  test('is registered, tier 1, and always callable', () => {
    expect(toolsInSet('meta').map((tool) => tool.name).sort()).toEqual(['route_why', 'tool_search'])
    for (const tool of toolsInSet('meta')) expect(tool.tier).toBe(1)
    const tools = allowedTools(route({ question: 'hello there', hasSetups: true }))
    for (const name of ALWAYS_TOOLS.filter((name) => toolByName(name))) expect(tools).toContain(name)
    expect(tools).toEqual(expect.arrayContaining(['route_why', 'tool_search', 'get_quote', 'read_account', 'read_memory']))
  })
})

describe('route_why', () => {
  test('prints the score and the words that earned it', () => {
    const body = data(run('route_why', {}, { ...testContext(), question: 'why was it blocked?' }))
    const routed = body.routed as RoutedRow[]
    expect(routed[0].id).toBe('desk.gate')
    expect(routed[0].reasons).toContain('kw:blocked')
    expect(routed[0].score).toBeGreaterThan(0)
    expect(body.floor).toBe(10)
  })

  test('scores the question it is given instead of the turn’s own', () => {
    const body = data(run('route_why', { question: 'what did I journal?' }))
    const ids = (body.routed as RoutedRow[]).map((row) => row.id)
    expect(ids).toContain('desk.journal')
  })

  test('says which skills were muted and why, rather than hiding them', () => {
    const body = data(run('route_why', { question: 'should I buy TSLA here?' }, { ...testContext(), question: 'should I buy TSLA here?' }))
    const muted = body.muted as { id: string; reason: string }[]
    expect(muted).toContainEqual({ id: 'desk.journal', reason: 'neg:should i' })
  })

  test('names its source in the refs', () => {
    const outcome = run('route_why', {})
    expect(outcome.refs).toEqual(['router'])
  })
})

describe('tool_search', () => {
  test('finds a tool by name and gives its signature and tier', () => {
    const body = data(run('tool_search', { query: 'gate_check' }))
    const tools = body.tools as { name: string; tier: number; signature: string }[]
    expect(tools).toHaveLength(1)
    expect(tools[0].tier).toBe(2)
    expect(tools[0].signature).toContain('gate_check(setupId?:string')
  })

  test('finds a whole set', () => {
    const body = data(run('tool_search', { query: 'decide' }))
    expect((body.tools as { name: string }[]).map((tool) => tool.name).sort()).toEqual([
      'gate_check',
      'r_multiple',
      'simulate_plan',
      'size_plan',
    ])
    expect(body.count).toBe(4)
  })

  test('searches descriptions too', () => {
    const body = data(run('tool_search', { query: 'journal' }))
    const names = (body.tools as { name: string }[]).map((tool) => tool.name)
    expect(names).toContain('read_journal')
  })

  test('refuses an empty query and an unmatched one with the catalog', () => {
    expect(why(run('tool_search', {}))).toContain('Missing query')
    expect(why(run('tool_search', { query: '   ' }))).toContain('Missing query')
    const miss = why(run('tool_search', { query: 'zebra' }))
    expect(miss).toContain('No tool matches "zebra"')
    expect(miss).toContain('get_quote')
  })

  test('lists at most eight and says how many it left out', () => {
    const body = data(run('tool_search', { query: 'the' }))
    expect((body.tools as unknown[]).length).toBeLessThanOrEqual(8)
    if (typeof body.count === 'number' && body.count > 8) expect(String(body.note)).toContain('narrow the query')
  })
})

describe('the catalog after the meta tools', () => {
  test('every always-callable name this harness claims resolves to a real tool', () => {
    for (const name of ALWAYS_TOOLS.filter((name) => name !== 'activate_skills' && name !== 'ask_user')) {
      expect(toolByName(name)).toBeDefined()
    }
  })
})
