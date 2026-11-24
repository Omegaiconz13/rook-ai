import { useCallback, useEffect, useRef, useState } from 'react'

import { deterministicModel } from '../shared/ninth/answer'
import { appendAudit } from '../shared/ninth/audit'
import type { AuditRow } from '../shared/ninth/audit'
import { runCommand } from '../shared/ninth/commands'
import { LEARNING_KEEP } from '../shared/ninth/learning'
import type { TurnEvent } from '../shared/ninth/loop'
import { runTurn } from '../shared/ninth/loop'
import { emptyWorkspace, MEMORY_KEEP } from '../shared/ninth/memory'
import type { Learning, MemorySnapshot, Observation, Workspace } from '../shared/ninth/memory'
import type { DeskSnapshot, MemoryPorts, Tier } from '../shared/ninth/types'
import { checkWatches, watchMessage } from '../shared/ninth/watch'
import type { Quote, Watch } from '../shared/ninth/watch'
import { barsFor } from '../shared/fixtures'
import { appendJournal, readJournal } from './desk'
import { modelStatus, remoteModel } from './ninth-client'
import { readStore, writeStore } from './storage'

/*
  The React binding. It does four jobs and nothing else: build the desk snapshot
  the harness reads, run the two keyless commands, run a turn with whichever
  client is configured (today the deterministic one, because no provider key is),
  and keep the audit and memory stores in this browser.

  Storage lives here, never inside the harness: the tools see `ports`, which own
  the keys and the clock, and `/memory` writes only the user's own workspace.

  The snapshot is read through a ref at the moment the question is asked, so a
  cell that changes symbol under an open panel cannot answer from the old one.
*/

export const NINTH_KEYS = {
  audit: 'v1:ninth:audit',
  workspace: 'v1:ninth:workspace',
  observations: 'v1:ninth:memory',
  learnings: 'v1:ninth:learnings',
  watch: 'v1:ninth:watch',
} as const

export type NinthToolTrace = {
  id: string
  name: string
  tier: Tier
  status: 'run' | 'ok' | 'blocked'
  ms?: number
  why?: string
}

export type NinthMessage = {
  id: string
  from: 'you' | 'ninth'
  text: string
  refs: string[]
  traceId?: string
  /** The skills the router chose, with their scores, for the "why this" disclosure. */
  skills?: { id: string; score: number }[]
  tools?: NinthToolTrace[]
  /** The deterministic review of the turn, and whether it earned a learning. */
  review?: { score: number; candidate: boolean }
  error?: boolean
}

export function readAudit(): AuditRow[] {
  return readStore<AuditRow[]>(NINTH_KEYS.audit, [])
}

export function readWatches(): Watch[] {
  return readStore<Watch[]>(NINTH_KEYS.watch, [])
}

/** The last bar the desk has for a symbol, in cents, as `get_quote` reads it. */
function quoteFor(symbol: string): Quote | undefined {
  const bars = barsFor(symbol)
  const last = bars[bars.length - 1]
  if (!last) return undefined
  return { symbol, lastCents: last.close, highCents: last.high, lowCents: last.low }
}

export function readMemory(): MemorySnapshot {
  return {
    workspace: readStore<Workspace>(NINTH_KEYS.workspace, emptyWorkspace()),
    observations: readStore<Observation[]>(NINTH_KEYS.observations, []),
    learnings: readStore<Learning[]>(NINTH_KEYS.learnings, []),
  }
}

function upsertTool(tools: NinthToolTrace[], event: Extract<TurnEvent, { t: 'tool' }>): NinthToolTrace[] {
  if (event.status === 'run') {
    return [...tools, { id: `${event.name}-${tools.length}`, name: event.name, tier: event.tier, status: 'run' }]
  }
  const index = tools.map((tool) => tool.name).lastIndexOf(event.name)
  if (index < 0) {
    return [...tools, { id: `${event.name}-${tools.length}`, name: event.name, tier: event.tier, status: event.status, ms: event.ms, why: event.why }]
  }
  const next = [...tools]
  next[index] = { ...next[index], status: event.status, ms: event.ms, why: event.why }
  return next
}

function saveAudit(rows: AuditRow[]): void {
  const next = rows.reduce<AuditRow[]>((list, row) => appendAudit(list, row), readAudit())
  writeStore(NINTH_KEYS.audit, next)
}

/** The ports a tool asks through. They own the keys, the clock and the dedupe. */
function memoryPorts(session: string): MemoryPorts {
  return {
    appendJournal: (row) => {
      // A confirmed retry must not become a second row with a new id.
      const same = readJournal().find(
        (existing) =>
          existing.date === row.date &&
          existing.symbol === row.symbol &&
          existing.setup === row.setup &&
          existing.entry === row.entry &&
          existing.stop === row.stop &&
          existing.target === row.target &&
          existing.source === row.source,
      )
      if (same) {
        return { ok: false, why: `That row is already in the journal (${same.tradeId}), so nothing was written twice.` }
      }
      appendJournal(row)
      return { ok: true, tradeId: row.tradeId }
    },
    remember: ({ section, text }) => {
      const current = readMemory()
      if (current.observations.some((observation) => observation.text.toLowerCase() === text.toLowerCase())) {
        return { ok: false, why: 'That line is already in memory.' }
      }
      const observation: Observation = {
        id: crypto.randomUUID(),
        section,
        text,
        createdAt: new Date().toISOString(),
        session,
      }
      writeStore(NINTH_KEYS.observations, [...current.observations, observation].slice(-MEMORY_KEEP))
      return { ok: true, id: observation.id }
    },
    saveLearning: ({ trigger, sequence, guidance }) => {
      const current = readMemory()
      if (current.learnings.some((learning) => learning.trigger.toLowerCase() === trigger.toLowerCase())) {
        return { ok: false, why: 'A learning with that trigger is already saved.' }
      }
      const learning: Learning = {
        id: crypto.randomUUID(),
        trigger,
        sequence,
        guidance,
        success: 1,
        failure: 0,
        lastUsed: null,
      }
      writeStore(NINTH_KEYS.learnings, [...current.learnings, learning].slice(-LEARNING_KEEP))
      return { ok: true, id: learning.id }
    },
  }
}

export function useNinth(desk: DeskSnapshot) {
  const [messages, setMessages] = useState<NinthMessage[]>([])
  const [running, setRunning] = useState(false)
  const [traceId, setTraceId] = useState<string | null>(null)
  /** The model the Worker has a key for; null means the offline client is in use. */
  const [model, setModel] = useState<string | null>(null)
  const modelRef = useRef<string | null>(null)
  modelRef.current = model
  const deskRef = useRef(desk)
  deskRef.current = desk
  const asked = useRef<string[]>([])

  const clear = useCallback(() => setMessages([]), [])

  // One probe, once: which client the turns use. No key is the normal answer and
  // keeps the deterministic client, so the offline demo needs no configuration.
  useEffect(() => {
    let alive = true
    void modelStatus().then((status) => {
      if (alive) setModel(status.configured ? status.model ?? 'connected' : null)
    })
    return () => {
      alive = false
    }
  }, [])

  /*
    Watches are checked once, when the desk loads. Each one that reached its line
    produces exactly one message and is stamped, so a reload cannot repeat it —
    and nothing here can size, journal or trade.
  */
  useEffect(() => {
    const stored = readWatches()
    if (stored.length === 0) return
    const quotes = stored.map((watch) => quoteFor(watch.symbol)).filter((quote): quote is Quote => quote !== undefined)
    const { watches, fired } = checkWatches(stored, quotes, new Date().toISOString())
    if (fired.length === 0) return
    writeStore(NINTH_KEYS.watch, watches)
    setMessages((prev) => [
      ...prev,
      ...fired.map((watch) => {
        const quote = quotes.find((entry) => entry.symbol === watch.symbol) as Quote
        return {
          id: crypto.randomUUID(),
          from: 'ninth' as const,
          text: watchMessage(watch, quote),
          refs: [`watch:${watch.symbol}`, `quote:${watch.symbol}`],
        }
      }),
    ])
  }, [])

  /** A command's answer, appended without running a turn. */
  const append = useCallback((question: string, text: string, refs: string[]) => {
    const id = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: `${id}-you`, from: 'you', text: question, refs: [] },
      { id: `${id}-reply`, from: 'ninth', text, refs },
    ])
  }, [])

  const ask = useCallback(async (question: string) => {
    const text = question.trim()
    if (!text) return
    const snapshot = deskRef.current

    const command = runCommand(text, {
      memory: readMemory(),
      audit: readAudit(),
      desk: snapshot,
      watches: readWatches(),
      today: snapshot.today,
    })
    if (command.handled) {
      if (command.workspace) writeStore(NINTH_KEYS.workspace, command.workspace)
      if (command.watches) writeStore(NINTH_KEYS.watch, command.watches)
      append(text, command.text, command.refs)
      return
    }

    const id = crypto.randomUUID()
    const replyId = `${id}-reply`
    const prior = [...asked.current]
    asked.current.push(text)

    setMessages((prev) => [
      ...prev,
      { id: `${id}-you`, from: 'you', text, refs: [] },
      { id: replyId, from: 'ninth', text: '', refs: [], traceId: id, skills: [], tools: [] },
    ])
    setRunning(true)
    setTraceId(id)

    const patch = (change: (message: NinthMessage) => NinthMessage) =>
      setMessages((prev) => prev.map((message) => (message.id === replyId ? change(message) : message)))

    try {
      const result = await runTurn({
        question: text,
        ctx: {
          question: text,
          traceId: id,
          desk: snapshot,
          memory: readMemory(),
          ports: memoryPorts(snapshot.today),
        },
        model: modelRef.current ? remoteModel() : deterministicModel(snapshot),
        asked: prior,
        emit: (event) => {
          if (event.t === 'text') {
            patch((message) => ({ ...message, text: message.text ? `${message.text}\n\n${event.delta}` : event.delta }))
          } else if (event.t === 'tool') {
            patch((message) => ({ ...message, tools: upsertTool(message.tools ?? [], event) }))
          } else if (event.t === 'pending') {
            patch((message) => ({ ...message, text: message.text || event.why }))
          } else if (event.t === 'refs') {
            patch((message) => ({ ...message, refs: event.refs }))
          }
        },
      })
      patch((message) => ({
        ...message,
        text: result.text || message.text || 'The desk has nothing to say about that yet.',
        refs: result.refs,
        skills: result.skills.map((skill) => ({ id: skill.id, score: skill.score })),
        review: result.review,
      }))
      saveAudit(result.audit)
    } catch (error) {
      const why = error instanceof Error && error.message ? ` ${error.message}` : ''
      patch((message) => ({
        ...message,
        error: true,
        text: `That turn could not finish.${why} Nothing was written, and the desk is unchanged.`,
      }))
    } finally {
      setRunning(false)
    }
  }, [append])

  return { messages, ask, append, clear, running, traceId, model }
}
