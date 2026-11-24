/*
  The four memory stores, minus the one that is just a ring buffer (audit.ts).
  Everything here is a pure function over an array: the caller owns persistence,
  so the harness never imports `localStorage` and a test never needs a browser.

  Precedence is the research's and it is right: the workspace is the user's own
  words and outranks anything Ninth inferred. Observations are written at most
  once per session, and only from a turn that produced at least three new ones —
  a single sentence is not a memory.
*/

export type ObservationSection = 'habit' | 'context' | 'decision' | 'note'

export type Observation = {
  id: string
  section: ObservationSection
  text: string
  createdAt: string
  /** The session date it was learned in; one write per session. */
  session: string
}

export type Learning = {
  id: string
  trigger: string
  sequence: string[]
  guidance: string
  success: number
  failure: number
  lastUsed: string | null
}

export type Workspace = {
  facts: string[]
  preferences: string[]
  decisions: string[]
}

export type MemorySnapshot = {
  workspace: Workspace
  observations: Observation[]
  learnings: Learning[]
}

/** A line is a note, not a page. */
export const MEMORY_TEXT_MAX = 280
/** New observations needed before a turn may write memory at all. */
export const MEMORY_MIN_NEW = 3
/** Observations kept in this browser. */
export const MEMORY_KEEP = 200
/** What a prompt carries at most. */
export const OBSERVATIONS_IN_PROMPT = 6
/** Learnings injected per turn, after recall. */
export const RECALL_TOP = 3

export function emptyWorkspace(): Workspace {
  return { facts: [], preferences: [], decisions: [] }
}

export function emptyMemory(): MemorySnapshot {
  return { workspace: emptyWorkspace(), observations: [], learnings: [] }
}

/** The workspace as prompt lines, in the order that outranks inference. */
export function workspaceLines(workspace: Workspace): string[] {
  return [
    ...workspace.facts.map((text) => `Fact: ${text}`),
    ...workspace.preferences.map((text) => `Preference: ${text}`),
    ...workspace.decisions.map((text) => `Decision: ${text}`),
  ]
}

function clean(text: string): string {
  return text.trim().slice(0, MEMORY_TEXT_MAX)
}

function addLine(lines: string[], text: string): string[] {
  const value = clean(text)
  if (!value) return lines
  if (lines.some((line) => line.toLowerCase() === value.toLowerCase())) return lines
  return [...lines, value]
}

/** Add one line to the part of the workspace it belongs in. */
export function addWorkspaceLine(workspace: Workspace, section: keyof Workspace, text: string): Workspace {
  return { ...workspace, [section]: addLine(workspace[section], text) }
}

/** Remove every line that matches, case-insensitively; the user owns this store. */
export function removeWorkspaceLine(workspace: Workspace, text: string): Workspace {
  const value = text.trim().toLowerCase()
  const keep = (lines: string[]) => lines.filter((line) => line.toLowerCase() !== value)
  return { facts: keep(workspace.facts), preferences: keep(workspace.preferences), decisions: keep(workspace.decisions) }
}

/**
 * Append a turn's observations, if that turn earned it: three new lines and no
 * earlier write in this session. A frozen session is returned untouched.
 */
export function recordObservations(
  list: Observation[],
  args: { session: string; items: { section: ObservationSection; text: string }[]; at: string; id: () => string },
): Observation[] {
  if (list.some((observation) => observation.session === args.session)) return list

  const known = new Set(list.map((observation) => observation.text.toLowerCase()))
  const fresh: Observation[] = []
  for (const item of args.items) {
    const text = clean(item.text)
    if (!text || known.has(text.toLowerCase())) continue
    known.add(text.toLowerCase())
    fresh.push({ id: args.id(), section: item.section, text, createdAt: args.at, session: args.session })
  }
  if (fresh.length < MEMORY_MIN_NEW) return list
  return [...list, ...fresh].slice(-MEMORY_KEEP)
}

/** The most recent observations, newest last, as prompt lines. */
export function observationLines(list: Observation[], limit = OBSERVATIONS_IN_PROMPT): { section: string; text: string }[] {
  return list.slice(-limit).map((observation) => ({ section: observation.section, text: observation.text }))
}

/* ── recall ───────────────────────────────────────────────────────────────── */

export type Recall = { index: number; score: number }

/**
 * Words that appear in almost every sentence. Left in, they make any two
 * documents look related: a learning about the open shared the word "the" with
 * a question about the gate and was injected beside the one that mattered.
 */
const STOPWORDS = new Set(
  'a an and are as at be been before being but by can could did do does for from had has have he her here how i if in into is it its just may me might more most must my no not of on or our out over same she should so some such than that the their them then there these they this those to too up very was we were what when where which who why will with would you your'.split(
    ' ',
  ),
)

function tokenize(text: string): string[] {
  const tokens = text.toLowerCase().match(/[a-z0-9']+/g) ?? []
  return tokens.filter((token) => !STOPWORDS.has(token))
}

function counts(tokens: string[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const token of tokens) out.set(token, (out.get(token) ?? 0) + 1)
  return out
}

function cosine(a: Map<string, number>, b: Map<string, number>, weight: (token: string) => number): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (const [token, count] of a) {
    const wa = count * weight(token)
    normA += wa * wa
    const other = b.get(token)
    if (other !== undefined) dot += wa * other * weight(token)
  }
  for (const [token, count] of b) {
    const wb = count * weight(token)
    normB += wb * wb
  }
  return normA > 0 && normB > 0 ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0
}

/**
 * TF-IDF cosine over a small set of documents — the turn's question against the
 * things Ninth might remember. Deterministic, no model, no embeddings: with a
 * handful of lines this is enough to stop injecting every learning every time.
 */
export function recall(query: string, docs: string[], top = RECALL_TOP): Recall[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0 || docs.length === 0) return []

  const docTokens = docs.map(tokenize)
  const df = new Map<string, number>()
  for (const tokens of docTokens) {
    for (const token of new Set(tokens)) df.set(token, (df.get(token) ?? 0) + 1)
  }
  const n = docs.length
  const weight = (token: string) => Math.log((n + 1) / ((df.get(token) ?? 0) + 1)) + 1
  const queryVector = counts(queryTokens)

  return docTokens
    .map((tokens, index) => ({ index, score: cosine(queryVector, counts(tokens), weight) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, top)
}

/** The learnings worth showing for this question, best match first. */
export function recallLearnings(learnings: Learning[], query: string, top = RECALL_TOP): Learning[] {
  const docs = learnings.map((learning) => `${learning.trigger} ${learning.guidance} ${learning.sequence.join(' ')}`)
  return recall(query, docs, top).map((hit) => learnings[hit.index])
}
