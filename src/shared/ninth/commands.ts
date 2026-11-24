import { auditFor, lastTrace } from './audit'
import type { AuditRow } from './audit'
import { draftStrategy, draftText } from './draft'
import { learningProof } from './learning'
import { addWorkspaceLine, removeWorkspaceLine, workspaceLines } from './memory'
import type { MemorySnapshot, Workspace } from './memory'
import { reviewSetup, reviewText } from './review'
import type { DeskSnapshot } from './types'

/*
  The commands that need no model and no turn: `/memory`, `/trace`, `/review` and
  `/draft`. They are pure functions over what the browser holds, so the panel can
  run them with a key, without a key, and in a test. `/memory` writes only the
  user's workspace — Ninth's observations and learnings are never edited from
  here — `/trace` only reads the audit log, and Review and Draft only read.
*/

export type CommandState = {
  memory: MemorySnapshot
  audit: AuditRow[]
  /** The desk as the panel sees it; `/review` and `/draft` read it. */
  desk: DeskSnapshot
  today: string
}

export type CommandOutcome =
  | { handled: false }
  | { handled: true; text: string; refs: string[]; workspace?: Workspace }

export const COMMANDS = ['/memory', '/trace', '/review', '/draft'] as const

export function runCommand(question: string, state: CommandState): CommandOutcome {
  const text = question.trim()
  if (!text.startsWith('/')) return { handled: false }

  const [head, ...rest] = text.split(/\s+/)
  const command = head.toLowerCase()
  const argument = rest.join(' ').trim()

  if (command === '/memory') return memoryCommand(argument, state)
  if (command === '/trace') return traceCommand(state.audit)
  if (command === '/review') return reviewCommand(argument, state.desk)
  if (command === '/draft') return draftCommand(argument, state.desk)
  return { handled: true, text: `Commands: ${COMMANDS.join(' · ')}.`, refs: [] }
}

/** `/review [SYMBOL|setupId]` — four fixed roles over a setup the rule produced. */
function reviewCommand(argument: string, desk: DeskSnapshot): CommandOutcome {
  const outcome = reviewSetup({ desk, argument })
  return outcome.ok
    ? { handled: true, text: reviewText(outcome.record), refs: outcome.record.refs }
    : { handled: true, text: outcome.why, refs: outcome.refs }
}

/** `/draft <symbol> <rule>` — a Pine draft, then the desk's replay of the same rule. */
function draftCommand(argument: string, desk: DeskSnapshot): CommandOutcome {
  if (!argument) return { handled: true, text: 'Use /draft <symbol> <rule>, e.g. /draft TSLA orb.', refs: ['setups:desk'] }
  const outcome = draftStrategy({ text: argument, desk })
  return outcome.ok
    ? { handled: true, text: draftText(outcome.draft), refs: outcome.draft.refs }
    : { handled: true, text: outcome.why, refs: outcome.refs }
}

const SECTION_KEY: Record<string, keyof Workspace> = { fact: 'facts', preference: 'preferences', decision: 'decisions' }

function memoryCommand(argument: string, state: CommandState): CommandOutcome {
  const { workspace } = state.memory
  if (!argument) return { handled: true, text: memoryText(state.memory, state.today), refs: ['memory'] }

  if (/^forget\s+/i.test(argument)) {
    const target = argument.replace(/^forget\s+/i, '').trim()
    if (!target) return { handled: true, text: 'Say what to forget: /memory forget <the line>.', refs: ['memory'] }
    const next = removeWorkspaceLine(workspace, target)
    const removed = workspaceLines(workspace).length - workspaceLines(next).length
    return {
      handled: true,
      text: removed > 0 ? `Forgot "${target}".` : `Nothing in the workspace matches "${target}".`,
      refs: ['memory'],
      workspace: removed > 0 ? next : undefined,
    }
  }

  const add = /^add\s+(fact|preference|decision)\s*:\s*(.+)$/i.exec(argument)
  if (add) {
    const word = add[1].toLowerCase()
    const section = SECTION_KEY[word]
    const line = add[2].trim()
    const next = addWorkspaceLine(workspace, section, line)
    const added = workspaceLines(next).length > workspaceLines(workspace).length
    return {
      handled: true,
      text: added
        ? `Saved as a ${word}: "${line.slice(0, 80)}". It outranks anything Ninth infers.`
        : `That ${word} is already written down.`,
      refs: ['memory'],
      workspace: added ? next : undefined,
    }
  }

  return {
    handled: true,
    text: 'Use /memory, /memory add fact: <line>, /memory add preference: <line>, or /memory forget <line>.',
    refs: ['memory'],
  }
}

function memoryText(memory: MemorySnapshot, today: string): string {
  const { workspace, observations, learnings } = memory
  const lines: string[] = []
  lines.push(
    `Workspace: ${workspace.facts.length} facts · ${workspace.preferences.length} preferences · ${workspace.decisions.length} decisions`,
  )
  for (const line of workspaceLines(workspace)) lines.push(`- ${line}`)
  if (workspaceLines(workspace).length === 0) lines.push('- nothing written down by you yet')

  const frozen = observations.some((observation) => observation.session === today)
  lines.push(`Observations: ${observations.length}${frozen ? ` (frozen for ${today})` : ''}`)
  for (const observation of observations.slice(-5)) lines.push(`- [${observation.section}] ${observation.text}`)

  lines.push(`Learnings: ${learnings.length}`)
  for (const learning of learnings) lines.push(`- ${learning.trigger} → ${learning.guidance} (${learningProof(learning)})`)

  lines.push('Your workspace outranks observations, and a learning never changes a verdict, a limit or a permission.')
  return lines.join('\n')
}

function traceCommand(audit: AuditRow[]): CommandOutcome {
  const traceId = lastTrace(audit)
  if (!traceId) return { handled: true, text: 'No turns in the audit log yet. Ask something first.', refs: ['audit'] }

  const rows = auditFor(audit, traceId)
  const turn = rows.find((row) => row.kind === 'turn')
  const tools = rows.filter((row) => row.kind === 'tool').reverse()

  const lines: string[] = []
  lines.push(`Trace ${traceId}`)
  if (turn) lines.push(`"${turn.question}"`)
  if (turn) lines.push(`routed: ${turn.skills.join(' · ') || 'nothing'}`)
  if (turn) lines.push(`steps ${turn.steps ?? 0} · tokens in ${turn.tokensIn ?? 0} · out ${turn.tokensOut ?? 0}`)
  if (tools.length === 0) lines.push('no tool calls: the answer came from the snapshot')
  for (const tool of tools) {
    const where = tool.tier === null ? '' : ` · tier ${tool.tier}`
    const blocked = tool.blocked ? ` · blocked ${tool.blocked}` : ''
    const ms = tool.ms === null ? '' : ` · ${tool.ms}ms`
    lines.push(`- ${tool.tool}${where} · ${tool.status}${blocked}${ms}`)
  }
  return { handled: true, text: lines.join('\n'), refs: [`trace:${traceId}`] }
}
