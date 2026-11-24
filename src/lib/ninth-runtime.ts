import { useCallback, useRef, useState } from 'react'

import { deterministicModel } from '../shared/ninth/answer'
import { appendAudit } from '../shared/ninth/audit'
import type { AuditRow } from '../shared/ninth/audit'
import type { TurnEvent } from '../shared/ninth/loop'
import { runTurn } from '../shared/ninth/loop'
import type { DeskSnapshot, Tier } from '../shared/ninth/types'
import { readStore, writeStore } from './storage'

/*
  The React binding. It does three jobs and nothing else: build the desk snapshot
  the harness reads, run a turn with whichever client is configured (today the
  deterministic one, because no provider key is), and keep the audit rows in this
  browser under `desk:v1:ninth:audit`.

  The snapshot is read through a ref at the moment the question is asked, so a
  cell that changes symbol under an open panel cannot answer from the old one.
*/

export const NINTH_AUDIT_KEY = 'v1:ninth:audit'

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
  error?: boolean
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

function saveAudit(rows: AuditRow[]): AuditRow[] {
  const stored = readStore<AuditRow[]>(NINTH_AUDIT_KEY, [])
  const next = rows.reduce<AuditRow[]>((list, row) => appendAudit(list, row), stored)
  writeStore(NINTH_AUDIT_KEY, next)
  return next
}

export function readAudit(): AuditRow[] {
  return readStore<AuditRow[]>(NINTH_AUDIT_KEY, [])
}

export function useNinth(desk: DeskSnapshot) {
  const [messages, setMessages] = useState<NinthMessage[]>([])
  const [running, setRunning] = useState(false)
  const [traceId, setTraceId] = useState<string | null>(null)
  const deskRef = useRef(desk)
  deskRef.current = desk

  const clear = useCallback(() => setMessages([]), [])

  /** A command's answer, appended without running a turn (Analyze draws as it reads). */
  const append = useCallback((question: string, text: string, refs: string[]) => {
    const id = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: `${id}-you`, from: 'you', text: question, refs: [] },
      { id: `${id}-reply`, from: 'ninth', text, refs },
    ])
  }, [])

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim()
      if (!text) return
      const snapshot = deskRef.current
      const id = crypto.randomUUID()
      const replyId = `${id}-reply`

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
          ctx: { question: text, traceId: id, desk: snapshot },
          model: deterministicModel(snapshot),
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
    },
    [],
  )

  return { messages, ask, append, clear, running, traceId }
}
