import { catalogLine, toolByName } from './registry'
import type { RoutedSkill } from './router'
import { SKILLS } from './skills/catalog'
import type { SkillDef } from './skills/catalog'
import type { DeskSnapshot } from './types'
import { MAX_LEARNINGS, SKILL_BODY_BUDGET_CHARS } from './types'

/*
  Prompt assembly. Three blocks, in this order:

    1. the cached prefix — Ninth's voice, the paper-only defaults and the tool
       catalog. Byte-identical on every turn, so a provider can cache it and so
       a test can assert it never drifts.
    2. the routed catalog — the skills that scored, with the words that scored
       them, so the model can see why it was handed this playbook.
    3. the turn — active bodies under budget, the desk snapshot, the user's
       workspace, what Ninth remembers, at most three learnings, and any
       confirmation that is waiting on a person.

  Bodies are measured in characters, not tokens: a token count here would be a
  guess, and a guess in a budget is how a prompt silently overflows. Overflow
  sheds the least important body first and leaves its one-line summary, tagged
  `body shed`, so the model still knows the skill exists.
*/

export const SOUL = [
  'You are Ninth, the assistant on Rook, a paper-trading desk.',
  'Rook is a demo: no order, no wallet and no money leaves the browser. Never imply otherwise.',
  'You are not a financial adviser. You read the desk and its written rules; you do not recommend, predict or cheer.',
  'Every number you say must come from a tool result in this turn or from the desk snapshot below. If a number is not there, say the desk does not have it.',
  'Name what you read. Under every answer the desk prints the refs your tools returned; a claim without a ref is a claim without a source.',
  'When the gate blocks a plan, that is the answer. Do not argue with it, soften it, or offer a workaround.',
].join('\n')

export const AGENTS = [
  'Safety defaults, none of which you may override:',
  '- The written limits are the desk\'s constitution. Never widen one to make a trade pass.',
  '- A tool result marked blocked is final for this turn. Do not retry it with different words.',
  '- Never claim a ticket is confirmed, a journal row was written, or a limit changed unless a tool result in this turn says so.',
  '- A confirmation waiting on a person is theirs to give. Tell them what it would change, then stop.',
  '- The replay is sample data with printed assumptions. Do not call it the odds of winning.',
].join('\n')

/** Read-only constants shipped in the bundle; the user's own facts live in storage. */
export const DESK_FOCUS = [
  'The desk trades one long-only paper account on a fixed list of large-cap US tickers.',
  'Four written setup rules: opening range, bull flag, gap retest, 20-day reclaim.',
  'Fifteen gate rules, R-01 to R-15, checked in order; the first failure wins and its id is the answer.',
].join('\n')

/** The stable half of the prompt: same bytes on every turn. */
export function cachedPrefix(tools: string[]): string {
  const lines = tools
    .map((name) => toolByName(name))
    .filter((tool): tool is NonNullable<typeof tool> => tool !== undefined)
    .map(catalogLine)
  return [
    SOUL,
    '',
    AGENTS,
    '',
    DESK_FOCUS,
    '',
    '<tools>',
    ...lines,
    '</tools>',
  ].join('\n')
}

export type ActiveSkill = {
  id: string
  description: string
  reasons: string[]
  /** The body, or null when it was shed or the id is not in the catalog. */
  body: string | null
}

export type PromptInput = {
  routed: RoutedSkill[]
  tools: string[]
  desk: Pick<DeskSnapshot, 'symbol' | 'timeframe' | 'today' | 'session' | 'simulated' | 'limits' | 'account'>
  /** The user's own facts. They outrank anything Ninth inferred. */
  workspace?: string[]
  memory?: { section: string; text: string }[]
  learnings?: { trigger: string; guidance: string; success: number; failure: number }[]
  pending?: { tool: string; token: string }[]
}

export type Prompt = {
  prefix: string
  turn: string
  system: string
  active: ActiveSkill[]
  shed: string[]
  /** Characters of skill bodies actually included, for the budget assertion. */
  bodyChars: number
}

const BODY_MAX = 3_200

/**
 * Fill the body budget most-important first. Skills are shed from the least
 * important end (the highest `priority` number), which is why the desk core —
 * the broadest, least specific playbook — is the first to lose its body.
 */
export function composeSkills(
  routed: RoutedSkill[],
  skills: SkillDef[] = SKILLS,
  budget = SKILL_BODY_BUDGET_CHARS,
): { active: ActiveSkill[]; shed: string[]; bodyChars: number } {
  const byId = new Map(skills.map((skill) => [skill.id, skill]))
  const rows = routed
    .map((row) => ({ row, skill: byId.get(row.id) }))
    .filter((entry): entry is { row: RoutedSkill; skill: SkillDef } => entry.skill !== undefined)

  const importance = [...rows].sort((a, b) => a.skill.priority - b.skill.priority)
  const active: ActiveSkill[] = []
  const shed: string[] = []
  let bodyChars = 0

  for (const { row, skill } of importance) {
    const body = skill.prompt.trim()
    if (body.length > 0 && bodyChars + body.length <= budget && body.length <= BODY_MAX) {
      bodyChars += body.length
      active.push({ id: row.id, description: skill.description, reasons: row.reasons, body })
    } else {
      shed.push(row.id)
      active.push({ id: row.id, description: skill.description, reasons: row.reasons, body: null })
    }
  }

  return { active, shed, bodyChars }
}

function deskBlock(input: PromptInput): string {
  const { desk } = input
  return [
    '<desk>',
    `symbol ${desk.symbol || 'none'} · timeframe ${desk.timeframe} · session ${desk.today}`,
    `market ${desk.session.state} at ${desk.session.nowEt} New York · ${desk.simulated ? 'demo clock' : 'live clock'}`,
    `equity ${(desk.limits.equityCents / 100).toFixed(2)} · risk per trade ${desk.limits.riskPerTradePct}% · daily loss ${desk.limits.dailyLossPct}%`,
    `trades today ${desk.account.tradesToday}/${desk.limits.maxTradesPerDay} · kill switch ${desk.account.killSwitch ? 'ON' : 'off'}`,
    '</desk>',
  ].join('\n')
}

function skillBlock(active: ActiveSkill[]): string {
  const lines = ['<skills>']
  for (const skill of active) {
    const why = skill.reasons.length > 0 ? ` why="${skill.reasons.join(' ')}"` : ''
    if (skill.body === null) {
      lines.push(`<skill id="${skill.id}"${why} body shed="true">${skill.description}</skill>`)
      continue
    }
    lines.push(`<skill id="${skill.id}"${why}>`, skill.body, '</skill>')
  }
  lines.push('</skills>')
  return lines.join('\n')
}

function memoryBlock(input: PromptInput): string {
  const workspace = input.workspace ?? []
  const memory = input.memory ?? []
  if (workspace.length === 0 && memory.length === 0) return ''

  const lines = ['<memory>', 'The workspace is the user\'s own words and outranks anything you inferred.']
  if (workspace.length > 0) {
    lines.push('<workspace>', ...workspace.map((fact) => `- ${fact}`), '</workspace>')
  }
  if (memory.length > 0) {
    lines.push('<observations>', ...memory.map((item) => `- [${item.section}] ${item.text}`), '</observations>')
  }
  lines.push('</memory>')
  return lines.join('\n')
}

function learningBlock(input: PromptInput): string {
  const learnings = (input.learnings ?? []).slice(0, MAX_LEARNINGS)
  if (learnings.length === 0) return ''
  const lines = ['<learnings>', 'Sequences from earlier turns. They change what you suggest reading, never a verdict.']
  for (const learning of learnings) {
    const uses = learning.success + learning.failure
    const proof = uses >= 10 ? `${uses} uses` : `unproven: ${uses} ${uses === 1 ? 'use' : 'uses'}`
    lines.push(`- when ${learning.trigger}: ${learning.guidance} (${proof})`)
  }
  lines.push('</learnings>')
  return lines.join('\n')
}

function pendingBlock(input: PromptInput): string {
  const pending = input.pending ?? []
  if (pending.length === 0) return ''
  return [
    '<pending>',
    ...pending.map(
      (call) => `- ${call.tool} is waiting for a person to confirm it. It has not happened. Token: ${call.token}`,
    ),
    'Say what the call would change and stop. Never state that it was confirmed.',
    '</pending>',
  ].join('\n')
}

export function buildPrompt(input: PromptInput, skills: SkillDef[] = SKILLS): Prompt {
  const { active, shed, bodyChars } = composeSkills(input.routed, skills)
  const prefix = cachedPrefix(input.tools)
  const route = [
    '<route>',
    ...input.routed.map((row) => `- ${row.id} (${row.score.toFixed(2)}): ${row.reasons.join(' ')}`),
    '</route>',
  ].join('\n')

  const turn = [route, skillBlock(active), deskBlock(input), memoryBlock(input), learningBlock(input), pendingBlock(input)]
    .filter(Boolean)
    .join('\n\n')

  return { prefix, turn, system: `${prefix}\n\n${turn}`, active, shed, bodyChars }
}
