import { MEMORY_TEXT_MAX } from '../memory'
import type { ObservationSection } from '../memory'
import { str } from '../args'
import { fail, ok } from '../result'
import type { ToolEntry } from '../types'

/*
  The write set. Every tool here changes something the reader owns, so none of
  them runs without the gate's confirmation, and none of them touches storage
  directly: the runtime supplies `remember` and `saveLearning`, which own the
  key, the clock and the session. A tool with no port is not a write that
  silently did nothing — it refuses, in words the model can repeat.

  The rest of the write set (journal rows, tickets, limits) lands with the
  features that own them; this file is where they will live.
*/

const SECTIONS: ObservationSection[] = ['habit', 'context', 'decision', 'note']

const memoryWrite: ToolEntry = {
  name: 'memory_write',
  set: 'write',
  tier: 2,
  description: 'Keep one line in Ninth’s memory, only when the user asked you to',
  args: {
    section: { type: 'string', desc: 'where the line belongs', values: SECTIONS },
    text: { type: 'string', required: true, desc: `one line, up to ${MEMORY_TEXT_MAX} characters` },
  },
  run: (args, ctx) => {
    const text = (str(args, 'text') as string).trim()
    if (text.length > MEMORY_TEXT_MAX) {
      return fail(`That line is ${text.length} characters; a memory line is at most ${MEMORY_TEXT_MAX}.`, ['memory'])
    }
    if (!ctx.ports?.remember) {
      return fail('The desk is not accepting memory writes in this turn, so nothing was stored.', ['memory'])
    }

    const section = (str(args, 'section') ?? 'note') as ObservationSection
    const result = ctx.ports.remember({ section, text })
    if (!result.ok) return fail(result.why, ['memory'])
    return ok({ id: result.id, section, text }, ['memory'])
  },
}

const learnSave: ToolEntry = {
  name: 'learn_save',
  set: 'write',
  tier: 3,
  description: 'Save a sequence from a turn that worked, with the situation it applies to',
  args: {
    trigger: { type: 'string', required: true, desc: 'the situation, e.g. "the gate blocks on R-12"' },
    guidance: { type: 'string', required: true, desc: 'what to read or do next time' },
    sequence: { type: 'strings', desc: 'the tool calls that worked, in order' },
  },
  run: (args, ctx) => {
    const trigger = (str(args, 'trigger') as string).trim()
    const guidance = (str(args, 'guidance') as string).trim()
    if (!trigger || !guidance) return fail('A learning needs both a trigger and the guidance it points to.', ['learn'])
    if (trigger.length > 160) return fail('That trigger is too long; keep it to one situation.', ['learn'])
    if (guidance.length > MEMORY_TEXT_MAX) {
      return fail(`That guidance is longer than ${MEMORY_TEXT_MAX} characters.`, ['learn'])
    }
    if (!ctx.ports?.saveLearning) {
      return fail('The desk is not accepting learnings in this turn, so nothing was saved.', ['learn'])
    }

    const sequence = (Array.isArray(args.sequence) ? (args.sequence as string[]) : []).slice(0, 5)
    const result = ctx.ports.saveLearning({ trigger, guidance, sequence })
    if (!result.ok) return fail(result.why, ['learn'])
    return ok({ id: result.id, trigger, guidance, sequence, success: 1, failure: 0, proof: 'unproven: 1 use' }, ['learn'])
  },
}

export const WRITE_TOOLS: ToolEntry[] = [memoryWrite, learnSave]
