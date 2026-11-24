import type { AuditRow, AuditStatus } from './audit'
import { gateGuard, noteWrite, openGate } from './gate'
import type { GateState } from './gate'
import { reviewTurn, sameQuestion } from './learning'
import type { Review } from './learning'
import { observationLines, recallLearnings, workspaceLines } from './memory'
import { buildPrompt } from './prompt'
import { dispatch, toolByName } from './registry'
import { allowedTools, route } from './router'
import type { RoutedSkill } from './router'
import type { StopReason, Tier, ToolOutcome, TurnContext } from './types'
import { MAX_INPUT_CHARS, MAX_STEPS, MAX_TOKENS_OUT } from './types'

/*
  The turn loop. Ours, not a vendor SDK: build the prompt, call the model,
  dispatch what it asks for, repeat, stop. It accepts any `Model`, so a test
  scripts the replies and never touches a network, and the deterministic mouth
  in `answer.ts` is just another implementation of the same interface.

  Stop conditions, in order: the model stops asking for tools, the step cap, the
  output-token cap, a confirmation waiting on a person, or two gate blocks in one
  turn — the last is a signal to stop, never a reason to retry with new words.
*/

export type ModelToolCall = { id: string; name: string; args: unknown }

export type ModelMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; calls: ModelToolCall[] }
  | { role: 'tool'; id: string; name: string; result: string }

export type ModelCallInput = {
  /** The cached prefix plus this turn's routing, bodies, desk and memory. */
  system: string
  messages: ModelMessage[]
  /** The tools the routed skills allow, already filtered to ones that exist. */
  tools: string[]
}

export type ModelReply = {
  text?: string
  calls?: ModelToolCall[]
  /** What the words are based on, printed under the answer. */
  refs?: string[]
  tokensIn?: number
  tokensOut?: number
}

export type Model = { call: (input: ModelCallInput) => Promise<ModelReply> }

export type TurnEvent =
  | { t: 'route'; skills: RoutedSkill[] }
  | { t: 'text'; delta: string }
  | { t: 'tool'; name: string; tier: Tier; status: 'run' | 'ok' | 'blocked'; ms?: number; why?: string }
  | { t: 'pending'; tool: string; token: string; why: string }
  | { t: 'refs'; refs: string[] }
  | { t: 'done'; usage: { steps: number; tokensIn: number; tokensOut: number } }

export type TurnResult = {
  traceId: string
  question: string
  text: string
  refs: string[]
  skills: RoutedSkill[]
  steps: number
  tokensIn: number
  tokensOut: number
  stopped: StopReason
  review: Review
  audit: AuditRow[]
}

const MAX_BLOCKS = 2

function resultText(outcome: ToolOutcome): string {
  return outcome.ok
    ? JSON.stringify({ ok: true, data: outcome.data, refs: outcome.refs })
    : JSON.stringify({ ok: false, why: outcome.why, refs: outcome.refs, blocked: outcome.blocked ?? null })
}

function pushRefs(into: string[], refs: string[]) {
  for (const ref of refs) if (!into.includes(ref)) into.push(ref)
}

export async function runTurn(args: {
  question: string
  ctx: TurnContext
  model: Model
  gate?: GateState
  emit?: (event: TurnEvent) => void
  now?: () => number
  id?: () => string
  /** The questions already asked this session, for the review's repeat check. */
  asked?: string[]
}): Promise<TurnResult> {
  const now = args.now ?? Date.now
  const nextId = args.id ?? (() => crypto.randomUUID())
  const emit = args.emit ?? (() => {})
  const question = args.question.trim().slice(0, MAX_INPUT_CHARS)
  const gate = args.gate ?? openGate({ traceId: args.ctx.traceId, killSwitch: args.ctx.desk.account.killSwitch })

  const skills = route({ question, hasSetups: args.ctx.desk.setups.length > 0 })
  const tools = allowedTools(skills)
  emit({ t: 'route', skills })

  const memory = args.ctx.memory
  const prompt = buildPrompt({
    routed: skills,
    tools,
    desk: args.ctx.desk,
    workspace: memory ? workspaceLines(memory.workspace) : undefined,
    memory: memory ? observationLines(memory.observations) : undefined,
    learnings: memory ? recallLearnings(memory.learnings, question) : undefined,
  })
  const messages: ModelMessage[] = [{ role: 'user', text: question }]
  const rows: AuditRow[] = []
  const refs: string[] = []
  const parts: string[] = []

  let steps = 0
  let tokensIn = 0
  let tokensOut = 0
  let blocks = 0
  let stopped: StopReason = 'done'

  const row = (over: Partial<AuditRow> & Pick<AuditRow, 'kind' | 'status'>): AuditRow => ({
    id: nextId(),
    traceId: args.ctx.traceId,
    at: new Date(now()).toISOString(),
    question,
    skills: skills.map((skill) => skill.id),
    tool: null,
    tier: null,
    blocked: null,
    ms: null,
    steps: null,
    tokensIn: null,
    tokensOut: null,
    refs: [],
    ...over,
  })

  while (steps < MAX_STEPS && tokensOut < MAX_TOKENS_OUT) {
    const reply = await args.model.call({ system: prompt.system, messages, tools })
    steps += 1
    tokensIn += reply.tokensIn ?? 0
    tokensOut += reply.tokensOut ?? 0

    if (reply.text) {
      parts.push(reply.text)
      emit({ t: 'text', delta: reply.text })
    }
    pushRefs(refs, reply.refs ?? [])

    const calls = reply.calls ?? []
    if (calls.length === 0) break
    messages.push({ role: 'assistant', text: reply.text ?? '', calls })

    let stop = false
    for (const call of calls) {
      const entry = toolByName(call.name)
      const tier = entry?.tier ?? 1
      emit({ t: 'tool', name: call.name, tier, status: 'run' })

      const started = now()
      const outcome = dispatch(call.name, call.args, args.ctx, gateGuard(gate))
      const ms = now() - started
      messages.push({ role: 'tool', id: call.id, name: call.name, result: resultText(outcome) })

      if (outcome.ok) {
        // Only a write that actually ran counts against the turn's cap.
        if (entry?.set === 'write') noteWrite(gate)
        emit({ t: 'tool', name: call.name, tier, status: 'ok', ms })
        pushRefs(refs, outcome.refs)
        rows.push(row({ kind: 'tool', status: 'ok', tool: call.name, tier, ms, refs: [...outcome.refs] }))
        continue
      }

      const status: AuditStatus = outcome.pending ? 'pending' : outcome.blocked ? 'blocked' : 'error'
      // The event vocabulary is run / ok / blocked; pending and error are both
      // refusals here, and the audit row keeps the finer distinction.
      emit({ t: 'tool', name: call.name, tier, status: 'blocked', ms, why: outcome.why })
      rows.push(
        row({
          kind: 'tool',
          status,
          tool: call.name,
          tier,
          ms,
          blocked: outcome.blocked ?? null,
          refs: [...outcome.refs],
        }),
      )

      if (outcome.pending) {
        emit({ t: 'pending', tool: call.name, token: outcome.pending.token, why: outcome.why })
        stopped = 'pending'
        stop = true
        break
      }
      if (outcome.blocked) {
        blocks += 1
        if (blocks >= MAX_BLOCKS) {
          stopped = 'blocked-twice'
          stop = true
          break
        }
      }
    }
    if (stop) break
  }

  if (stopped === 'done') {
    if (steps >= MAX_STEPS) stopped = 'steps'
    else if (tokensOut >= MAX_TOKENS_OUT) stopped = 'tokens'
  }

  emit({ t: 'refs', refs })
  emit({ t: 'done', usage: { steps, tokensIn, tokensOut } })

  rows.push(
    row({
      kind: 'turn',
      status: stopped === 'pending' ? 'pending' : 'ok',
      steps,
      tokensIn,
      tokensOut,
      blocked: blocks > 0 ? `${blocks} blocked` : null,
      refs: [...refs],
    }),
  )

  const toolRows = rows.filter((entry) => entry.kind === 'tool')
  const review = reviewTurn({
    traceId: args.ctx.traceId,
    toolCalls: toolRows.length,
    gateConsulted: toolRows.some((entry) => entry.tool === 'gate_check') || refs.includes('gate'),
    refs: refs.length,
    blocked: blocks,
    stopped,
    reasked: (args.asked ?? []).some((prior) => sameQuestion(prior, question)),
  })

  return {
    traceId: args.ctx.traceId,
    question,
    text: parts.join('\n\n'),
    refs,
    skills,
    steps,
    tokensIn,
    tokensOut,
    stopped,
    review,
    audit: rows,
  }
}
