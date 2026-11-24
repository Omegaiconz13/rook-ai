import { parseArgs } from './args'
import { fail } from './result'
import { DECIDE_TOOLS } from './tools/decide'
import { READ_TOOLS } from './tools/read'
import type { ToolEntry, ToolOutcome, ToolSet, TurnContext } from './types'

/*
  The tool registry: the one list of what Ninth can do. A tool is a pure
  handler over the turn's desk snapshot — it reads no storage, opens no socket
  and holds no state between calls, so the same call with the same snapshot
  returns the same answer in the browser, the Worker and a test.

  Dispatch does three things in order: find the tool, validate the model's
  arguments against its declared schema, run it. Permission is not checked here;
  the tier gate wraps this call, so no tool can be reached by a model path that
  skipped it.
*/

const TOOLS: ToolEntry[] = [...READ_TOOLS, ...DECIDE_TOOLS]
const BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]))

export function allTools(): readonly ToolEntry[] {
  return TOOLS
}

export function toolByName(name: string): ToolEntry | undefined {
  return BY_NAME.get(name)
}

export function toolsInSet(set: ToolSet): ToolEntry[] {
  return TOOLS.filter((tool) => tool.set === set)
}

export function toolNames(): string[] {
  return TOOLS.map((tool) => tool.name)
}

/** One catalog line: the name, its arguments, one sentence, and the tier it costs. */
export function catalogLine(tool: ToolEntry): string {
  const args = Object.entries(tool.args)
    .map(([name, spec]) => `${name}${spec.required ? '' : '?'}:${spec.type}`)
    .join(', ')
  return `${tool.name}(${args}) — ${tool.description} [tier ${tool.tier}]`
}

export function dispatch(name: string, raw: unknown, ctx: TurnContext): ToolOutcome {
  const tool = BY_NAME.get(name)
  if (!tool) return fail(`No tool named "${name}". Call tool_search for the catalog.`, [])
  const parsed = parseArgs(tool.args, raw)
  if (!parsed.ok) return fail(parsed.why, [`tool:${name}`])
  return tool.run(parsed.args, ctx)
}
