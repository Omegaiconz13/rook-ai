import type { ChartBar } from '../chartfeed'
import type { JournalRow } from '../journal'
import type { Account, RiskLimits, SessionInfo } from '../risk'
import type { Setup } from '../setups'
import type { PaperTicket } from '../ticket'

/*
  The harness's vocabulary. Every cap the plan names lives here as a number, so
  a test can assert it and no module invents its own budget. Types only: nothing
  in this file imports a model, a clock or storage.
*/

export const MAX_STEPS = 6
export const MAX_TOKENS_OUT = 24_000
export const MAX_INPUT_CHARS = 2_000
export const MAX_RESULT_CHARS = 4_000
export const MAX_WRITES_PER_TURN = 3
export const MAX_ROUTED_SKILLS = 6
export const SKILL_BODY_BUDGET_CHARS = 12_000
export const MAX_LEARNINGS = 3
export const AUDIT_MAX_ROWS = 500

/** 1 read · 2 confirm once per session · 3 confirm each · 4 a person, never a model. */
export type Tier = 1 | 2 | 3 | 4

export const TIER_LABEL: Record<Tier, string> = {
  1: 'read',
  2: 'confirm once',
  3: 'confirm each',
  4: 'manual only',
}

export type ToolSet = 'read' | 'decide' | 'write' | 'meta'

export type ArgType = 'string' | 'number' | 'integer' | 'boolean' | 'symbol' | 'strings'

export type ArgSpec = {
  type: ArgType
  required?: boolean
  /** Shown to the model when the argument is missing or wrong. */
  desc: string
  /** Closed set, for arguments that only take a few words. */
  values?: readonly string[]
}

export type ArgsSpec = Record<string, ArgSpec>
export type Args = Record<string, unknown>

/**
 * What a tool hands back. `refs` name the data the number came from and are
 * printed under the answer; a tool that cannot answer says why instead of
 * returning a zero.
 */
export type ToolOutcome =
  | { ok: true; data: Record<string, unknown>; refs: string[] }
  | { ok: false; why: string; refs: string[]; blocked?: string }

export type ToolEntry = {
  name: string
  set: ToolSet
  tier: Tier
  /** One line: what it reads and what it gives back. */
  description: string
  args: ArgsSpec
  /** A ticket or a size may only be written from a verdict produced this turn. */
  needsVerdict?: boolean
  run: (args: Args, ctx: TurnContext) => ToolOutcome
}

/** One level exactly as the chart draws it, in integer cents. */
export type DeskLevel = { label: string; priceCents: number }

/**
 * The desk as it stands at the moment of the question. The runtime fills this
 * from the same hooks the screens use, so a tool can only see what a screen
 * already shows. Storage is never read from here.
 */
export type DeskSnapshot = {
  symbol: string
  /** The chart's timeframe id: `5`, `15`, `30`, `60` or `1D`. */
  timeframe: string
  /** The active symbol's bars at that timeframe, oldest first. */
  bars: ChartBar[]
  levels: DeskLevel[]
  setups: Setup[]
  journal: JournalRow[]
  tickets: PaperTicket[]
  /** Tickets confirmed today, as the duplicate rule counts them. */
  confirmed: { symbol: string; sessionDate: string }[]
  limits: RiskLimits
  account: Account
  session: SessionInfo
  /** True when the gate is being run on the demo clock rather than the live one. */
  simulated: boolean
  /** The session date the desk is running (`SESSION_DATE`). */
  today: string
}

export type TurnContext = {
  question: string
  /** One id per turn: every tool call and audit row carries it. */
  traceId: string
  desk: DeskSnapshot
}
