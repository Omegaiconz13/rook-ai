import { useEffect, useMemo, useState } from 'react'
import { Crosshair, Maximize2, Minimize2, RotateCcw, Send, X } from 'lucide-react'
import type { Vela } from '@luxalgo/vela'

import { bareTicker, chartHistory, DEFAULT_TIMEFRAME, TIMEFRAME_LABEL, timeframeFor } from '../shared/chartfeed'
import { barsFor, dailyFor } from '../shared/fixtures'
import { SESSION_DATE } from '../shared/market'
import { analyzeNinth, NINTH_NAME } from '../shared/ninth'
import { ninthContextFrom } from '../shared/ninth/answer'
import type { DeskSnapshot } from '../shared/ninth/types'
import { checkPlan } from '../shared/risk'
import type { GateVerdict } from '../shared/risk'
import { planFromSetup, setupsFor } from '../shared/setups'
import { accountFor, useAccountState, useConfirmed, useDeskSession, useJournal, useLimits, useTickets } from '../lib/desk'
import { useNinth } from '../lib/ninth-runtime'
import { drawSetupLevels, drawSetupPosition, setupLevelsFor } from '../lib/vela'
import { Button } from './Button'
import { ChatBubble } from './ChatBubble'

const SUGGESTIONS = ['Where are the levels?', 'Any setups on the scan?', 'Why was it blocked?', 'What did I journal?']

type Props = {
  /** The chart to read, resolved at the moment of every question (the shell rebinds it). */
  getChart: () => Vela | null
  /** Where there is no chart (the full page), read this symbol instead. */
  symbol?: string
  /**
   * The row's controls: close always, maximize only where the host can expand
   * the panel. A phone overlay passes close alone, so it draws no dead button.
   */
  header: { readonly maximized?: boolean; setMaximized?: (maximized: boolean) => void; close: () => void }
}

/**
 * Ninth, docked beside the chart. Every question runs a full harness turn: the
 * router picks the playbooks, the loop asks the deterministic client, and the
 * answer, the refs and the tool calls behind it are all the desk's own. With no
 * provider key configured this is the whole product — and it says so.
 */
export function NinthPanel({ getChart, header, symbol: pinned }: Props) {
  const [draft, setDraft] = useState('')
  const [journal] = useJournal()
  const [limits] = useLimits()
  const [stored] = useAccountState()
  const [confirmed] = useConfirmed()
  const [tickets] = useTickets()
  const { session, simulated } = useDeskSession()
  const [, rerender] = useState(0)

  const chart = getChart()
  // On the charts page the bound cell decides the symbol; on the full page, the picker does.
  const symbol = (chart ? bareTicker(chart.market.symbol ?? '') : '') || pinned || ''
  const timeframe = timeframeFor(chart?.market.timeframe ?? '') ?? DEFAULT_TIMEFRAME
  const timeframeLabel = TIMEFRAME_LABEL[timeframe]

  // A cell can switch symbol or timeframe under the open panel; the strip and the
  // answers follow it rather than describing the chart the panel opened on.
  useEffect(() => {
    if (!chart) return
    return chart.on('market:changed', () => rerender((tick) => tick + 1))
  }, [chart])

  const setups = useMemo(() => (symbol ? setupsFor(symbol, barsFor(symbol), dailyFor(symbol)) : []), [symbol])
  const levels = useMemo(
    () => (symbol ? setupLevelsFor(symbol).map((level) => ({ label: level.label, priceCents: level.priceCents })) : []),
    [symbol],
  )

  /**
   * The gate is not a seat and never needed the room: it is the same pure call the
   * Gate page makes, run here on the setup the chart is showing, so "why was it
   * blocked" is answered by the rule that actually decided it.
   */
  const gate = useMemo<GateVerdict | null>(() => {
    const planSetup = setups.find((candidate) => candidate.status === 'triggered') ?? setups[0]
    if (!planSetup) return null
    return checkPlan({
      plan: planFromSetup(planSetup),
      limits,
      account: accountFor(limits, stored),
      session,
      history: confirmed.filter((entry) => entry.sessionDate === SESSION_DATE),
    })
  }, [setups, limits, stored, session, confirmed])

  const desk = useMemo<DeskSnapshot>(
    () => ({
      symbol,
      timeframe,
      bars: symbol ? chartHistory(symbol, timeframe) : [],
      levels,
      setups,
      journal,
      tickets,
      confirmed,
      gate,
      limits,
      account: accountFor(limits, stored),
      session,
      simulated,
      today: SESSION_DATE,
    }),
    [symbol, timeframe, levels, setups, journal, tickets, confirmed, gate, limits, stored, session, simulated],
  )

  const ninth = useNinth(desk)
  const maximized = header.maximized
  const canClear = ninth.messages.length > 0

  const send = (question: string) => {
    const q = question.trim()
    if (!q || ninth.running) return
    void ninth.ask(q)
    setDraft('')
  }

  /**
   * Analyze is the one command that also writes: it reads the same snapshot the
   * answers use, then puts the rule's levels and its position tool on the chart.
   * The files it needs are already in the chart's drawings document, so nothing
   * is stored twice.
   */
  const analyze = () => {
    const answer = analyzeNinth(ninthContextFrom(desk))
    const chart = getChart()
    const range = chart?.getVisibleRange() ?? null
    let drawn = ' No chart is bound to this panel, so nothing was drawn.'
    if (chart && symbol) {
      const levels = drawSetupLevels(chart, symbol, range ?? undefined)
      const position = drawSetupPosition(chart, symbol, range ?? undefined)
      drawn =
        position.length > 0
          ? ` I drew ${levels.length} level lines and the position tool on the chart; its handles are the rule's entry, stop and target.`
          : chart.drawings.supported
            ? ' No rule setup matched this symbol, so nothing was drawn.'
            : ' This chart cannot draw, so nothing was placed on it.'
    }
    ninth.append('Analyze', `${answer.text}${drawn}`, answer.refs)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-panel">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[13px] font-semibold tracking-[0.01em] text-fg">{NINTH_NAME}</span>
        <span className="truncate rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-faint">
          {symbol || 'chart'} · {timeframeLabel}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={ninth.clear}
            disabled={!canClear}
            aria-label="Clear conversation"
            className="tap-target grid size-8 place-items-center rounded-full text-faint transition hover:bg-white/8 hover:text-fg disabled:opacity-40"
          >
            <RotateCcw aria-hidden className="size-4" />
          </button>
          {header.setMaximized && (
            <button
              type="button"
              onClick={() => header.setMaximized?.(!header.maximized)}
              aria-label={maximized ? 'Restore Ninth' : 'Maximize Ninth'}
              aria-pressed={!!maximized}
              className="tap-target grid size-8 place-items-center rounded-full text-faint transition hover:bg-white/8 hover:text-fg"
            >
              {maximized ? <Minimize2 aria-hidden className="size-4" /> : <Maximize2 aria-hidden className="size-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => header.close()}
            aria-label="Close Ninth"
            className="tap-target grid size-8 place-items-center rounded-full text-faint transition hover:bg-white/8 hover:text-fg"
          >
            <X aria-hidden className="size-4" />
          </button>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" role="log" aria-live="polite" aria-label="Conversation with Ninth">
        {ninth.messages.length === 0 ? (
          <div className="grid gap-3">
            <p className="text-[16px] leading-relaxed text-muted">
              I read the chart in front of you: its written levels, the setups, the gate's verdict on the setup and the journal.
              Ask about any of them and I will name where the answer came from.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button key={suggestion} variant="glass" size="sm" onClick={() => send(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {ninth.messages.map((message) => (
              <div key={message.id} className="grid gap-1.5">
                <ChatBubble
                  from={message.from === 'you' ? 'you' : 'desk'}
                  text={message.text}
                  cite={message.refs.length ? message.refs.join(' · ') : undefined}
                  error={message.error}
                />
                {message.skills && message.skills.length > 0 && (
                  <details className="ml-9">
                    <summary className="tap-target inline-flex cursor-pointer select-none items-center text-[11.5px] text-faint">
                      why this
                    </summary>
                    <p className="mt-1 text-[11.5px] text-faint">
                      routed: {message.skills.map((skill) => `${skill.id} ${skill.score.toFixed(0)}`).join(' · ')}
                    </p>
                    <ul className="mt-1 grid gap-0.5 text-[11.5px] text-faint">
                      {message.tools && message.tools.length > 0 ? (
                        message.tools.map((tool) => (
                          <li key={tool.id}>
                            {tool.name} · tier {tool.tier} · {tool.status}
                            {tool.ms === undefined ? '' : ` · ${tool.ms}ms`}
                          </li>
                        ))
                      ) : (
                        <li>no tool calls: answered from the snapshot</li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            ))}
            {ninth.running && (
              <p role="status" className="ml-9 text-[12.5px] text-faint">
                Reading the desk…
              </p>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          send(draft)
        }}
        className="shrink-0 border-t border-line px-3 py-2.5"
      >
        {chart && (
          <div className="mb-2 flex items-center gap-2">
            <Button variant="leaf" size="md" icon={<Crosshair aria-hidden className="size-4" />} onClick={analyze}>
              Analyze
            </Button>
            <span className="truncate text-[11.5px] text-faint">reads the chart · draws the setup</span>
          </div>
        )}
        <label htmlFor="ninth-input" className="sr-only">
          Ask {NINTH_NAME} about this chart
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="ninth-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send(draft)
              }
            }}
            rows={2}
            placeholder="Ask about the levels, the gate, the journal…"
            className="field min-h-11 flex-1 resize-none py-2 text-[16px] leading-snug"
          />
          <Button type="submit" variant="paper" icon={<Send className="size-4" />} disabled={!draft.trim() || ninth.running} aria-label="Send">
            Send
          </Button>
        </div>
        <p className="mt-1.5 truncate text-[11.5px] text-faint">
          Snapshot · {levels.length} levels · {journal.length} journal rows · no model connected
        </p>
      </form>
    </div>
  )
}
