import { describe, expect, test } from 'bun:test'

import { allowedTools, inferStage, mentions, route, SCORE, scoreAll, skillById } from './router'
import { SKILLS } from './skills/catalog'
import { MAX_ROUTED_SKILLS } from './types'
import { toolNames } from './registry'

const ask = (question: string, over: { hasSetups?: boolean; stage?: 'discover' | 'evaluate' | 'decide' | 'manage' } = {}) =>
  route({ question, hasSetups: over.hasSetups ?? true, stage: over.stage })

describe('the catalog', () => {
  test('has twelve skills with unique ids and valid descriptions', () => {
    expect(SKILLS).toHaveLength(12)
    expect(new Set(SKILLS.map((skill) => skill.id)).size).toBe(12)
    for (const skill of SKILLS) {
      expect(skill.description.length).toBeLessThanOrEqual(80)
      expect(skill.description.length).toBeGreaterThan(10)
      expect(skill.stages.length).toBeGreaterThan(0)
      expect(skill.tools.length).toBeGreaterThan(0)
      expect(skill.summary.length).toBeGreaterThan(10)
    }
  })

  test('keeps every body inside the 800-token budget', () => {
    for (const skill of SKILLS) {
      expect(skill.prompt.length).toBeLessThanOrEqual(3_200)
      expect(skill.prompt.trim().length).toBeGreaterThan(0)
    }
  })

  test('writes keywords lower-case, and only co-activates skills that exist', () => {
    const catalogIds = new Set(SKILLS.map((skill) => skill.id))
    for (const skill of SKILLS) {
      for (const keyword of [...skill.keywords, ...(skill.negativeKeywords ?? [])]) {
        expect(keyword).toBe(keyword.toLowerCase())
        expect(keyword.trim()).toBe(keyword)
      }
      for (const id of skill.coActivate) expect(catalogIds.has(id)).toBe(true)
    }
  })
})

describe('mentions', () => {
  test('matches a whole word, not a prefix inside another word', () => {
    expect(mentions('size this', 'size')).toBe(true)
    expect(mentions('sizes and sizing', 'size')).toBe(false)
    expect(mentions("replay today's bars", "today's bars")).toBe(true)
  })
})

describe('inferStage', () => {
  test('reads the wording', () => {
    expect(inferStage('should I buy TSLA?')).toBe('decide')
    expect(inferStage('why was it blocked?')).toBe('evaluate')
    expect(inferStage('journal it')).toBe('manage')
    expect(inferStage('where are the levels')).toBe('discover')
    expect(inferStage('thanks')).toBeNull()
  })

  test('prefers the action a question asks for over the noun it names', () => {
    expect(inferStage('should I size this risk?')).toBe('decide')
  })
})

describe('route', () => {
  test('sends "why was it blocked" to the gate, with the words that scored it', () => {
    const routed = ask('why was it blocked?')
    expect(routed[0].id).toBe('desk.gate')
    expect(routed[0].score).toBe(80.8)
    expect(routed[0].reasons).toContain('kw:blocked')
    expect(routed[0].reasons).toContain('stage:evaluate')
  })

  test('co-activates the desk and the risk skill from the gate', () => {
    const routed = ask('why was it blocked?')
    expect(routed.map((row) => row.id)).toContain('desk.core')
    const core = routed.find((row) => row.id === 'desk.core')
    expect(core?.reasons).toContain('co:desk.gate')
    expect(core?.score).toBe(30.1)
  })

  test('sends a sizing question to risk rather than the general desk', () => {
    const routed = ask('how many shares should I buy?')
    expect(routed[0].id).toBe('desk.risk')
    expect(routed[0].score).toBe(80.7)
    expect(routed.map((row) => row.id)).toContain('desk.core')
  })

  test('still answers "should I buy" from the desk instead of inventing an advice skill', () => {
    expect(ask('should I buy TSLA?')[0].id).toBe('desk.core')
    expect(SKILLS.some((skill) => /advice|advise/.test(skill.id))).toBe(false)
  })

  test('sends a journal question to the journal', () => {
    expect(ask('what did I journal?')[0].id).toBe('desk.journal')
  })

  test('sends a levels question to the levels', () => {
    const routed = ask('where are the levels?')
    expect(routed[0].id).toBe('desk.levels')
    expect(routed.map((row) => row.id)).toContain('desk.setups')
  })

  test('locks a skill out on a negative keyword instead of lowering it', () => {
    const ticket = scoreAll({ question: 'why was it blocked?', hasSetups: true }).find((row) => row.id === 'desk.ticket')
    expect(ticket?.score).toBe(Number.NEGATIVE_INFINITY)
    expect(ticket?.reasons).toEqual(['neg:why'])
  })

  test('locks the replay out when the question is about today’s bars', () => {
    const routed = ask("replay today's bars")
    expect(routed.map((row) => row.id)).not.toContain('desk.sim')
    expect(routed.map((row) => row.id)).toContain('desk.core')
  })

  test('locks the replay out when no rule produced a setup', () => {
    const sim = scoreAll({ question: 'replay this setup', hasSetups: false }).find((row) => row.id === 'desk.sim')
    expect(sim?.score).toBe(Number.NEGATIVE_INFINITY)
    expect(sim?.reasons).toEqual(['cond:no-setup'])
    expect(ask('replay this setup', { hasSetups: false }).map((row) => row.id)).not.toContain('desk.sim')
  })

  test('offers nothing when the question carries no signal', () => {
    expect(ask('hello')).toEqual([])
  })

  test('never returns more than six skills, best first', () => {
    const routed = ask('why was it blocked, should I size the ticket, simulate it, and journal it?')
    expect(routed.length).toBeLessThanOrEqual(MAX_ROUTED_SKILLS)
    const scores = routed.map((row) => row.score)
    expect([...scores].sort((a, b) => b - a)).toEqual(scores)
  })

  test('caps the keyword part at two hits', () => {
    const routed = ask('quote price bar candle account equity p&l')
    expect(routed[0].id).toBe('desk.core')
    expect(routed[0].score).toBe(80.1)
  })
})

describe('allowedTools', () => {
  test('hands the gate its two tools and the always-on reads, nothing more', () => {
    const tools = allowedTools(ask('why was it blocked?'))
    expect(tools).toContain('gate_check')
    expect(tools).toContain('size_plan')
    expect(tools).toContain('get_quote')
    expect(tools).toContain('read_account')
    expect(tools).not.toContain('ticket_confirm')
    expect(tools).not.toContain('limits_update')
  })

  test('never hands out a tool that does not exist yet', () => {
    const every = allowedTools(SKILLS.map((skill) => ({ id: skill.id, score: 1, reasons: [] })))
    const known = new Set(toolNames())
    for (const tool of every) expect(known.has(tool)).toBe(true)
  })

  test('offers route_why now that it is built, and still drops the tools that are not', () => {
    const tools = allowedTools(ask('why was it blocked?'))
    expect(tools).toContain('route_why')
    expect(tools).not.toContain('activate_skills')
    expect(tools).not.toContain('ask_user')
    expect(tools).not.toContain('journal_append')
  })

  test('finds every skill by id', () => {
    for (const skill of SKILLS) expect(skillById(skill.id)?.id).toBe(skill.id)
    expect(skillById('desk.nope')).toBeUndefined()
  })

  test('spends the score weights the plan pinned', () => {
    expect(SCORE).toMatchObject({ keyword: 30, keywordCap: 2, stage: 20, asset: 15, coActivate: 10, signal: 25, floor: 10 })
  })
})
