import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Send } from 'lucide-react'

import { Button, ButtonLink } from '../../components/Button'
import { ChatBubble } from '../../components/ChatBubble'
import { Disclaimer } from '../../components/Disclaimer'
import { EmptyState } from '../../components/EmptyState'
import { SourceBadge } from '../../components/SourceBadge'
import { useToast } from '../../components/Toast'
import { useLastMemo } from '../../lib/desk'
import { ask } from '../../shared/packet'
import { AppHeader } from './AppHeader'

type Message = { id: number; from: 'you' | 'desk'; text: string; refs?: string[] }

const SUGGESTIONS = ['Why was it blocked?', 'How many shares?', 'Where is the stop?', 'Any news?', 'What is the case against?']

/** Grounded Q&A over the last memo. It answers from the packet, and refuses everything else. */
export function AskDeskPage() {
  const stored = useLastMemo()
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const nextId = useRef(1)
  const toast = useToast()

  const send = (question: string) => {
    if (!stored) return
    const q = question.trim()
    if (!q) return
    const answer = ask(stored.packet, stored.memo, q)
    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, from: 'you', text: q },
      { id: nextId.current++, from: 'desk', text: answer.answer, refs: answer.refs },
    ])
    setDraft('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }

  return (
    <>
      <AppHeader title="Ask the desk" lede="Answers come from the last memo and nothing else. Every reply cites the field it used.">
        <SourceBadge source="seed" />
      </AppHeader>

      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10">
        {!stored ? (
          <EmptyState
            icon={<Send className="size-6" />}
            title="Run the room first"
            body="The desk answers from a packet. Produce a memo and it can explain the gate, the size, the levels or the case against."
            action={
              <ButtonLink href="/app/room" variant="paper">
                Open the room
              </ButtonLink>
            }
          />
        ) : (
          <>
            <section className="panel rounded-[22px] p-4">
              <p className="text-[12px] uppercase tracking-[0.12em] text-faint">Last memo</p>
              <p className="mt-1.5 text-[14px] text-soft">
                {stored.packet.plan.symbol} · {stored.memo.decision} · {stored.memo.rubricScore}/5 ·{' '}
                {stored.memo.gate.ruleId ? `blocked at ${stored.memo.gate.ruleId}` : `approved ${stored.memo.gate.size} shares`}
              </p>
            </section>

            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="glass" size="sm" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>

            <div className="grid gap-4" aria-live="polite">
              {messages.length === 0 ? (
                <p className="text-[14px] text-muted">Ask a question, or pick one above. The desk will say so when something is not in the packet.</p>
              ) : (
                messages.map((m) => (
                  <ChatBubble
                    key={m.id}
                    from={m.from}
                    text={m.text}
                    cite={m.refs && m.refs.length ? m.refs.join(' · ') : undefined}
                  />
                ))
              )}
            </div>

            <form onSubmit={submit} className="sticky bottom-4 flex flex-wrap gap-2 rounded-[22px] border border-line bg-panel/95 p-3 backdrop-blur">
              <label htmlFor="ask-input" className="sr-only">
                Ask about the memo
              </label>
              <input
                id="ask-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Why was this blocked?"
                className="field h-11 flex-1"
                autoComplete="off"
              />
              <Button type="submit" variant="paper" icon={<Send className="size-4" />} disabled={!draft.trim()}>
                Ask
              </Button>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <p className="text-[12.5px] text-faint">
                Scripted answers, no model call: the demo runs offline and costs nothing.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessages([])
                  toast('Conversation cleared')
                }}
              >
                Clear
              </Button>
            </div>
          </>
        )}

        <Disclaimer />
      </div>
    </>
  )
}
