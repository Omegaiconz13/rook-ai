import { toolByName } from './registry'
import { SKILLS } from './skills/catalog'
import type { SkillDef, Stage } from './skills/catalog'
import { MAX_ROUTED_SKILLS } from './types'

/*
  The L0 router. A rule scores every skill from the question alone, with no
  model and no network, so the same words pick the same playbook every time and
  a test can assert the table. The model may then activate skills; activation is
  not permission, because the tier gate runs at invocation.

  Scores, pinned to the research:
    keyword  +30 per hit, at most two hits (+60)
    stage    +20 when the inferred stage is one the skill serves
    asset    +15 when a context word the skill cares about appears
    co       +10 when the skill that led the turn lists this one
    signal   +25 on a turn a watch fired (nothing schedules one yet)
    tiebreak +(100 − priority) / 100, fractional, so it never outranks a hit
  A negative keyword or a failed condition is −∞, not a deduction: it is the
  part that stops this becoming a keyword soup.
*/

export type RouteInput = {
  question: string
  /** True when a written rule produced a setup for the active symbol. */
  hasSetups: boolean
  /** A command turn can force the stage it is asking for. */
  stage?: Stage
  /** True when the turn was caused by a watch firing. */
  signal?: boolean
}

export type RoutedSkill = { id: string; score: number; reasons: string[] }
export type ScoredSkill = RoutedSkill & { skill: SkillDef }

export const SCORE = {
  keyword: 30,
  keywordCap: 2,
  stage: 20,
  asset: 15,
  coActivate: 10,
  signal: 25,
  /** Below this a skill had no real signal and is not offered. */
  floor: 10,
} as const

const STAGE_HINTS: { stage: Stage; words: string[] }[] = [
  {
    stage: 'decide',
    words: ['should i', 'should we', 'buy', 'enter', 'take it', 'size it', 'how many shares', 'ticket it', 'confirm'],
  },
  {
    stage: 'evaluate',
    words: ['why', 'blocked', 'explain', 'reason', 'what if', 'simulate', 'replay', 'odds', 'chance', 'worth', 'risk'],
  },
  {
    stage: 'manage',
    words: ['journal', 'log it', 'remember', 'forget', 'change my', 'update my', 'set my', 'save this'],
  },
  {
    stage: 'discover',
    words: ['what', 'where', 'show', 'scan', 'list', 'any', 'which', 'price', 'quote', 'levels', 'setups', 'news'],
  },
]

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** A single word matches on word boundaries; a phrase matches as a phrase. */
export function mentions(question: string, keyword: string): boolean {
  if (keyword.includes(' ')) return question.includes(keyword)
  return new RegExp(`\\b${escape(keyword)}\\b`).test(question)
}

export function normalise(question: string): string {
  return question.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** The stage the wording asks for, or null when it says nothing about one. */
export function inferStage(question: string): Stage | null {
  const q = normalise(question)
  for (const hint of STAGE_HINTS) {
    if (hint.words.some((word) => mentions(q, word))) return hint.stage
  }
  return null
}

const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]))

export function skillById(id: string): SkillDef | undefined {
  return SKILL_BY_ID.get(id)
}

function scoreOne(skill: SkillDef, input: RouteInput, stage: Stage | null): ScoredSkill {
  const q = normalise(input.question)
  const reasons: string[] = []

  const negative = skill.negativeKeywords?.find((keyword) => mentions(q, keyword))
  if (negative) return { id: skill.id, score: Number.NEGATIVE_INFINITY, reasons: [`neg:${negative}`], skill }
  if (skill.requiresSetup && !input.hasSetups) {
    return { id: skill.id, score: Number.NEGATIVE_INFINITY, reasons: ['cond:no-setup'], skill }
  }

  let score = 0
  const hits = skill.keywords.filter((keyword) => mentions(q, keyword))
  if (hits.length > 0) {
    score += SCORE.keyword * Math.min(hits.length, SCORE.keywordCap)
    for (const hit of hits) reasons.push(`kw:${hit}`)
  }
  if (stage && skill.stages.includes(stage)) {
    score += SCORE.stage
    reasons.push(`stage:${stage}`)
  }
  const asset = skill.assets?.find((word) => mentions(q, word))
  if (asset) {
    score += SCORE.asset
    reasons.push(`asset:${asset}`)
  }
  if (input.signal && skill.signal) {
    score += SCORE.signal
    reasons.push('signal')
  }
  score += (100 - skill.priority) / 100

  return { id: skill.id, score: Math.round(score * 100) / 100, reasons, skill }
}

const byScore = (a: ScoredSkill, b: ScoredSkill) => b.score - a.score || a.skill.priority - b.skill.priority || a.id.localeCompare(b.id)

/** Every skill with its score, including the locked ones, for `/trace` and tests. */
export function scoreAll(input: RouteInput, skills: SkillDef[] = SKILLS): ScoredSkill[] {
  const stage = input.stage ?? inferStage(input.question)
  return skills.map((skill) => scoreOne(skill, input, stage)).sort(byScore)
}

/**
 * The routed catalog: the non-locked skills with real signal, best first, with
 * one co-activation pass from the leader. Top six, as the budget allows.
 */
export function route(input: RouteInput, skills: SkillDef[] = SKILLS): RoutedSkill[] {
  const scored = scoreAll(input, skills).filter((row) => Number.isFinite(row.score))
  const leader = scored[0]
  // A tiebreak alone is not a leader: without a real hit, co-activation would
  // manufacture a skill out of nothing and every "hello" would route somewhere.
  if (leader && leader.score >= SCORE.floor) {
    for (const row of scored) {
      if (leader.skill.coActivate.includes(row.id)) {
        row.score = Math.round((row.score + SCORE.coActivate) * 100) / 100
        row.reasons.push(`co:${leader.id}`)
      }
    }
    scored.sort(byScore)
  }
  return scored
    .filter((row) => row.score >= SCORE.floor)
    .slice(0, MAX_ROUTED_SKILLS)
    .map(({ id, score, reasons }) => ({ id, score, reasons }))
}

/**
 * Always callable, whatever routed: the meta tools that drive the harness and
 * the two reads every turn needs to stay honest about the desk.
 */
export const ALWAYS_TOOLS: readonly string[] = ['activate_skills', 'tool_search', 'ask_user', 'route_why', 'get_quote', 'read_account']

/** The tools the routed skills allow, filtered to tools that actually exist yet. */
export function allowedTools(routed: RoutedSkill[]): string[] {
  const names = new Set<string>()
  for (const row of routed) {
    for (const tool of skillById(row.id)?.tools ?? []) if (toolByName(tool)) names.add(tool)
  }
  for (const tool of ALWAYS_TOOLS) if (toolByName(tool)) names.add(tool)
  return [...names]
}
