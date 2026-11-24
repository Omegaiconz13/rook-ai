import { allTools, catalogLine, toolNames } from '../registry'
import { SCORE, scoreAll } from '../router'
import { str } from '../args'
import { fail, ok } from '../result'
import type { ToolEntry } from '../types'

/*
  The meta tools: they describe the harness rather than the desk. Both are tier 1
  and always callable, and neither can change anything — one re-runs the router
  and prints the arithmetic, the other hands back a tool's own signature.

  They exist because routing and tool choice are the two things a reader is right
  to be suspicious of. "Why did you load that playbook" should be answerable with
  numbers, not with a paragraph about intent.
*/

const SETS = ['read', 'decide', 'write', 'meta'] as const

const routeWhy: ToolEntry = {
  name: 'route_why',
  set: 'meta',
  tier: 1,
  description: 'Why this turn loaded the playbooks it did: every score, the words that earned it, and what was muted',
  args: {
    question: { type: 'string', desc: 'the question to score; this turn’s own question when omitted' },
  },
  run: (args, ctx) => {
    const question = (str(args, 'question') ?? ctx.question).slice(0, 400)
    const scored = scoreAll({ question, hasSetups: ctx.desk.setups.length > 0 })
    const routed = scored.filter((row) => Number.isFinite(row.score) && row.score >= SCORE.floor).slice(0, 6)
    const below = scored.filter((row) => Number.isFinite(row.score) && row.score < SCORE.floor)
    const muted = scored.filter((row) => !Number.isFinite(row.score))

    return ok(
      {
        question,
        floor: SCORE.floor,
        routed: routed.map((row) => ({ id: row.id, score: row.score, reasons: row.reasons })),
        below: below.map((row) => ({ id: row.id, score: row.score })),
        muted: muted.map((row) => ({ id: row.id, reason: row.reasons[0] ?? 'muted' })),
        how: 'keyword +30 a hit (at most two), stage +20, asset +15, co-activation +10, fractional tiebreak by priority. -Infinity means a negative keyword or a condition the desk fails; it is never a deduction.',
      },
      ['router'],
    )
  },
}

const toolSearch: ToolEntry = {
  name: 'tool_search',
  set: 'meta',
  tier: 1,
  description: 'A tool’s signature, arguments and tier, by name, set or a word from its description',
  args: {
    query: { type: 'string', required: true, desc: 'a tool name, a word from its description, or a set: read, decide, write, meta' },
  },
  run: (args) => {
    // A missing or blank query never reaches here: the parser refuses it with the
    // same sentence, which is where the model learns the argument is required.
    const query = (str(args, 'query') ?? '').trim().toLowerCase()

    const matches = allTools().filter(
      (tool) => tool.name.includes(query) || tool.set === query || tool.description.toLowerCase().includes(query),
    )
    if (matches.length === 0) {
      return fail(`No tool matches "${query}". The sets are ${SETS.join(', ')}; the names are ${toolNames().join(', ')}.`, ['tools'])
    }

    const shown = matches.slice(0, 8)
    return ok(
      {
        query,
        count: matches.length,
        shown: shown.length,
        tools: shown.map((tool) => ({
          name: tool.name,
          set: tool.set,
          tier: tool.tier,
          signature: catalogLine(tool),
          description: tool.description,
        })),
        ...(matches.length > shown.length ? { note: `Only the first ${shown.length} of ${matches.length} are listed; narrow the query.` } : {}),
      },
      ['tools'],
    )
  },
}

export const META_TOOLS: ToolEntry[] = [routeWhy, toolSearch]
