import { NOTE_MAX, manualRow, rowFromVerdict } from '../../journal'
import type { JournalRow } from '../../journal'
import { MEMORY_TEXT_MAX } from '../memory'
import type { ObservationSection } from '../memory'
import { deskSetups, planFromSetup } from '../../setups'
import { usdToCents } from '../../sizing'
import { list, num, str } from '../args'
import { fail, ok } from '../result'
import type { ToolEntry, TurnContext } from '../types'
import { verdictForPlan } from '../verdict'

/*
  The write set. Every tool here changes something the reader owns, so none of
  them runs without the gate's confirmation, and none of them touches storage
  directly: the runtime supplies `remember` and `saveLearning`, which own the
  key, the clock and the session. A tool with no port is not a write that
  silently did nothing — it refuses, in words the model can repeat.

  `journal_append` is the first of the desk's own writes. It builds the row with
  the desk's own function — `rowFromVerdict` for a setup, `manualRow` for prices
  the reader quoted — and asks the runtime to store it, so the number in the
  journal is the number the gate returned rather than one the model retyped.

  The rest of the write set (tickets, limits) lands with the features that own
  them; this file is where they will live.
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

function setupFor(ctx: TurnContext, id: string | undefined) {
  const local = id
    ? ctx.desk.setups.find((setup) => setup.id === id)
    : ctx.desk.setups.find((setup) => setup.status === 'triggered') ?? ctx.desk.setups[0]
  if (local) return local
  return id ? deskSetups().find((setup) => setup.id === id) : undefined
}

const journalAppend: ToolEntry = {
  name: 'journal_append',
  set: 'write',
  tier: 3,
  description: 'Append one journal row for a setup or a plan the reader asked you to log; confirmed every time',
  args: {
    setupId: { type: 'string', desc: 'a setup id from list_setups; the triggered setup on the chart when omitted' },
    symbol: { type: 'symbol', desc: 'the ticker, for a manual row' },
    entry: { type: 'number', desc: 'entry in dollars, for a manual row with stop, target and size' },
    stop: { type: 'number', desc: 'stop in dollars' },
    target: { type: 'number', desc: 'target in dollars' },
    size: { type: 'integer', desc: 'shares, for a manual row' },
    took: { type: 'boolean', desc: 'true only when the reader says they took it; default false' },
    note: { type: 'string', desc: `the reader's own line, up to ${NOTE_MAX} characters` },
    tags: { type: 'strings', desc: 'up to eight short labels' },
    rulesFollowed: { type: 'boolean', desc: 'false only when the reader says they broke a written rule' },
  },
  run: (args, ctx) => {
    if (!ctx.ports?.appendJournal) {
      return fail('The desk is not accepting journal writes in this turn, so nothing was written.', ['journal'])
    }

    const note = str(args, 'note') ?? ''
    if (note.length > NOTE_MAX) {
      return fail(`That note is ${note.length} characters; a journal note is at most ${NOTE_MAX}.`, ['journal'])
    }

    const tags = list(args, 'tags')
    const took = args.took === true
    const prices = [num(args, 'entry'), num(args, 'stop'), num(args, 'target')]
    const quoted = prices.filter((value) => value !== undefined).length
    const setupId = str(args, 'setupId')

    let row: JournalRow
    let refs: string[]

    if (quoted > 0) {
      if (setupId) {
        return fail('Give either setupId, or entry with stop and target — not both.', ['journal'])
      }
      if (quoted < 3) return fail('A manual row needs entry, stop and target together, in dollars.', ['journal'])
      const size = num(args, 'size')
      if (size === undefined || size <= 0) {
        return fail('A manual row needs the size the reader took, as a whole number of shares.', ['journal'])
      }

      const [entry, stop, target] = prices as number[]
      const manual = manualRow({
        date: ctx.desk.today,
        session: ctx.desk.session.state,
        symbol: str(args, 'symbol') ?? ctx.desk.symbol,
        setup: '',
        entryCents: usdToCents(entry),
        stopCents: usdToCents(stop),
        targetCents: usdToCents(target),
        size: Math.floor(size),
        note,
        tags,
        rulesFollowed: args.rulesFollowed === true ? true : args.rulesFollowed === false ? false : undefined,
      })
      if (!manual) {
        return fail('Those prices do not describe a long: the stop must sit below the entry and the target above it.', ['journal'])
      }
      row = manual
      refs = ['journal']
    } else {
      const setup = setupFor(ctx, setupId)
      if (!setup) {
        const what = setupId ? `No setup named "${setupId}"` : 'No setup is on the desk'
        return fail(
          `${what}, so there is no row to write. Call list_setups, or give symbol, entry, stop, target and size for a manual row.`,
          ['setups:desk'],
        )
      }
      // The gate only sees a plan's prices, so it cannot tell a rule that never
      // fired from one that did. A row claiming a verdict for an expired setup
      // is exactly the kind of record the journal exists to prevent.
      if (setup.status !== 'triggered') {
        return fail(
          `${setup.id} did not trigger today (${setup.status}), so there is no trade to journal. Call list_setups for what did fire, or record the prices as a manual row.`,
          ['setups:desk'],
        )
      }
      const plan = planFromSetup(setup)
      const verdict = verdictForPlan(ctx.desk, plan)
      row = rowFromVerdict({
        plan,
        verdict,
        sessionDate: ctx.desk.today,
        session: ctx.desk.session,
        setupFamily: setup.family,
        took,
        note,
        tags,
      })
      refs = ['journal', 'gate', `setup:${setup.id}`]
    }

    const written = ctx.ports.appendJournal(row)
    if (!written.ok) return fail(written.why, ['journal'])

    return ok(
      {
        tradeId: written.tradeId,
        date: row.date,
        symbol: row.symbol,
        setup: row.setup,
        verdict: row.verdict,
        took: row.took,
        size: row.size,
        entry: row.entry,
        stop: row.stop,
        target: row.target,
        rPlanned: row.rPlanned,
        note: row.note,
        tags: row.tags,
        source: row.source,
      },
      refs,
    )
  },
}

export const WRITE_TOOLS: ToolEntry[] = [memoryWrite, learnSave, journalAppend]
