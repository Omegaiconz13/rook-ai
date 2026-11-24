import type { Learning } from './memory'
import type { StopReason } from './types'

/*
  Learning, without a background model call. Minara spends a cheap-model review
  on every turn; this desk will not, so the review is arithmetic over what the
  turn already recorded: did it call tools, did it consult the gate, did it
  produce refs, did it finish, was anything blocked, did the reader have to ask
  again. A turn earns a learning only at the research's numbers — score ≥ 7 with
  ≥ 3 tool calls — and a learning earns the word "proven" only at ten uses with
  a Wilson lower bound of at least 0.55.

  Nothing here ever changes the gate, a limit or a permission. A learning is a
  suggestion about what to read next, and it is labelled with its sample size.
*/

export const LEARNING_MIN_CALLS = 3
export const LEARNING_MIN_SCORE = 7
export const LEARNING_MIN_USES = 10
export const LEARNING_MIN_RATE = 0.55
export const WILSON_Z = 1.96
export const LEARNING_KEEP = 100

export type TurnSummary = {
  traceId: string
  toolCalls: number
  /** True when a gate verdict was produced or quoted in the turn. */
  gateConsulted: boolean
  refs: number
  blocked: number
  stopped: StopReason
  /** True when the same question was already asked in this session. */
  reasked: boolean
}

export type Review = {
  score: number
  reasons: string[]
  /** Score and call count both clear their floor: worth offering to save. */
  candidate: boolean
}

/** Whitespace and case are not a different question. */
export function sameQuestion(a: string, b: string): boolean {
  const clean = (text: string) => text.toLowerCase().replace(/\s+/g, ' ').trim()
  return clean(a) === clean(b)
}

export function reviewTurn(turn: TurnSummary): Review {
  let score = 0
  const reasons: string[] = []

  if (turn.toolCalls >= LEARNING_MIN_CALLS) {
    score += 3
    reasons.push(`tools:${turn.toolCalls}`)
  } else if (turn.toolCalls >= 1) {
    score += 2
    reasons.push(`tools:${turn.toolCalls}`)
  }
  if (turn.gateConsulted) {
    score += 2
    reasons.push('gate')
  }
  if (turn.refs > 0) {
    score += 2
    reasons.push(`refs:${turn.refs}`)
  }
  if (turn.stopped === 'done') {
    score += 1
    reasons.push('done')
  }
  if (turn.blocked === 0) {
    score += 1
    reasons.push('no-blocks')
  }
  if (!turn.reasked) {
    score += 1
    reasons.push('no-repeat')
  }

  score = Math.min(10, score)
  return { score, reasons, candidate: score >= LEARNING_MIN_SCORE && turn.toolCalls >= LEARNING_MIN_CALLS }
}

/**
 * The Wilson score interval's lower bound for a small sample. A percentage
 * alone hides its own sample size: 8 of 10 is 80%, and the bound says how much
 * of that 80% survives the sample.
 */
export function wilsonLowerBound(success: number, failure: number, z = WILSON_Z): number {
  const n = success + failure
  if (n <= 0) return 0
  const p = success / n
  const z2 = z * z
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)
  return Math.max(0, (centre - margin) / (1 + z2 / n))
}

export const learningUses = (learning: Learning): number => learning.success + learning.failure

export function learningRate(learning: Learning): number {
  const uses = learningUses(learning)
  return uses === 0 ? 0 : learning.success / uses
}

/** Ten uses and a lower bound over the threshold; below that it is a story. */
export function isProven(learning: Learning): boolean {
  return learningUses(learning) >= LEARNING_MIN_USES && wilsonLowerBound(learning.success, learning.failure) >= LEARNING_MIN_RATE
}

/** The label printed beside a learning, sample size included. */
export function learningProof(learning: Learning): string {
  const uses = learningUses(learning)
  if (uses < LEARNING_MIN_USES) return `unproven: ${uses} ${uses === 1 ? 'use' : 'uses'}`
  const bound = wilsonLowerBound(learning.success, learning.failure).toFixed(2)
  return isProven(learning)
    ? `proven: ${uses} uses, lower bound ${bound}`
    : `unproven: ${uses} uses, lower bound ${bound}`
}

/** Count a use and stamp it, so an old learning can be seen to be stale. */
export function creditLearning(learning: Learning, outcome: 'success' | 'failure', at: string): Learning {
  return outcome === 'success'
    ? { ...learning, success: learning.success + 1, lastUsed: at }
    : { ...learning, failure: learning.failure + 1, lastUsed: at }
}
