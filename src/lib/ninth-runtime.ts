import { useCallback, useRef, useState } from 'react'

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
  const deskRef = useRef(desk)
  deskRef.current = desk
  const asked = useRef<string[]>([])

  const clear = useCallback(() => setMessages([]), [])

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

    const command = runCommand(text, { memory: readMemory(), audit: readAudit(), today: snapshot.today })
    if (command.handled) {
      if (command.workspace) writeStore(NINTH_KEYS.workspace, command.workspace)
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
        model: deterministicModel(snapshot),
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
    } catch {
      patch((message) => ({
        ...message,
        error: true,
        text: 'That turn could not finish. Nothing was written, and the desk is unchanged.',
      }))
    } finally {
      setRunning(false)
    }
  }, [append])

  return { messages, ask, append, clear, running, traceId }
}
