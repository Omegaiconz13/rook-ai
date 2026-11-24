import { useMemo, useState } from 'react'
import { Copy, Power, RotateCcw, ShieldCheck, ShieldX, Ticket } from 'lucide-react'

import { Badge } from '../../components/Badge'
import { Button, ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { Input, Select } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { SourceBadge } from '../../components/SourceBadge'
import { useToast } from '../../components/Toast'
import { GateVerdictCard } from '../../components/Verdict'
import { useLocation } from '../../lib/router'
import {
  accountFor,
  ACCOUNT_DEFAULTS,
  appendJournal,
  engageKillSwitch,
  LIMIT_DEFAULTS,
  saveTicket,
  useAccountState,
  useConfirmed,
  useDeskSession,
  useLimits,
  useTickets,
} from '../../lib/desk'
import { barsFor, dailyFor } from '../../shared/fixtures'
import { rowFromVerdict } from '../../shared/journal'
import { INSTRUMENTS } from '../../shared/market'
import { SESSION_DATE } from '../../shared/market'
import { checkPlan } from '../../shared/risk'

/** 10:12 New York on the session's own date, taken from its first bar. */
function demoClockIso(symbol: string): string {
  const first = barsFor(symbol)[0]
  if (!first) return new Date().toISOString()
  return new Date(Date.parse(first.start) + 42 * 60_000).toISOString()
}
import type { RiskLimits, TradePlan } from '../../shared/risk'
import { planFromSetup, setupById, setupsFor } from '../../shared/setups'
import { usdToCents, money } from '../../shared/sizing'
import { confirmTicket, proposeTicket, ticketProblem, TICKET_LABEL } from '../../shared/ticket'
import { AppHeader } from './AppHeader'

function initialPlan(search: string): TradePlan {
  const id = new URLSearchParams(search).get('setup')
  const setup = id ? setupById(id) : undefined
  if (setup) return planFromSetup(setup)
  return {
    id: `plan-${crypto.randomUUID()}`,
    symbol: 'TSLA',
    direction: 'long',
    entryCents: 36_418,
    stopCents: 35_832,
    targetCents: 37_590,
    riskPerShareCents: 586,
    rMultiple: 2,
    setupId: null,
    status: 'draft',
    provenance: 'user',
  }
}

export function RiskGatePage() {
  const { search } = useLocation()
  const [limits, setLimits] = useLimits()
  const [stored, setStored] = useAccountState()
  const [confirmed, setConfirmed] = useConfirmed()
  const [tickets] = useTickets()
  const { session, simulated } = useDeskSession()
  const [plan, setPlan] = useState<TradePlan>(() => initialPlan(search))
  const [ticketing, setTicketing] = useState(false)
  const toast = useToast()

  const account = accountFor(limits, stored)
  const verdict = useMemo(
    () =>
      checkPlan({
        plan,
        limits,
        account,
        session,
        history: confirmed.filter((h) => h.sessionDate === SESSION_DATE),
      }),
    [plan, limits, account, session, confirmed],
  )

  const setLimit = <K extends keyof RiskLimits>(key: K, value: RiskLimits[K]) => setLimits((prev) => ({ ...prev, [key]: value }))

  const setLevel = (patch: Partial<TradePlan>) => setPlan((prev) => {
    const next = { ...prev, ...patch }
    next.riskPerShareCents = next.entryCents - next.stopCents
    if (next.riskPerShareCents > 0) {
      next.rMultiple = Math.round(((next.targetCents - next.entryCents) / next.riskPerShareCents) * 100) / 100
    }
    return next
  })

  // The levels belong to the symbol: switching it loads that symbol's written setup
  // rather than checking the new ticker at the previous one's entry, stop and target.
  const setSymbol = (symbol: string) => {
    const setups = setupsFor(symbol, barsFor(symbol), dailyFor(symbol))
    const setup = setups.find((s) => s.status === 'triggered') ?? setups[0]
    if (!setup) {
      setLevel({ symbol, setupId: null })
      return
    }
    setPlan(planFromSetup(setup))
  }

  const setTargetAtR = (r: number) => {
    const entry = plan.entryCents
    const risk = entry - plan.stopCents
    if (risk <= 0) return
    setLevel({ targetCents: entry + Math.round(r * risk) })
  }

  const setup = plan.setupId ? setupById(plan.setupId) : undefined
  const liveTicket = tickets.find((t) => t.plan.id === plan.id && (t.state === 'proposed' || t.state === 'confirmed' || t.state === 'filled'))
  const expired = setup?.status === 'expired'
  const canTicket = verdict.verdict === 'approved' && verdict.size !== null && !expired

  const confirmPaper = () => {
    if (verdict.verdict !== 'approved' || verdict.size === null) return
    const row = rowFromVerdict({
      plan,
      verdict,
      sessionDate: SESSION_DATE,
      session,
      setupFamily: setup?.family ?? 'manual',
      took: true,
      note: 'paper ticket',
    })
    const ticket = confirmTicket(
      proposeTicket({
        plan,
        size: verdict.size,
        sessionDate: SESSION_DATE,
        createdAt: new Date().toISOString(),
        // A ticket can only fill from the moment it exists. On the desk session
        // that is the demo clock (10:12 NY, 42 minutes after the open); live, it
        // is now. Read from the first bar so the offset survives DST.
        fillFrom: simulated ? demoClockIso(plan.symbol) : new Date().toISOString(),
        tradeId: row.tradeId,
      }),
    )
    const problem = ticketProblem(ticket, verdict)
    if (problem) {
      toast(problem)
      return
    }
    appendJournal(row)
    saveTicket(ticket)
    setConfirmed((prev) => [...prev, { symbol: plan.symbol, sessionDate: SESSION_DATE }])
    setStored((prev) => ({
      ...prev,
      tradesToday: prev.tradesToday + 1,
      riskUsedCents: prev.riskUsedCents + (verdict.lossAtStopCents ?? 0),
    }))
    setTicketing(false)
    toast(`Paper ticket confirmed: ${ticket.size} shares, ${money(ticket.maxLossCents)} at risk`)
  }

  const log = () => {
    appendJournal(
      rowFromVerdict({
        plan,
        verdict,
        sessionDate: SESSION_DATE,
        session,
        setupFamily: plan.setupId ? setupById(plan.setupId)?.family ?? 'manual' : 'manual',
      }),
    )
    toast(verdict.verdict === 'approved' ? `Approved: ${verdict.size} shares journaled` : `Blocked ${verdict.ruleId}: logged to the journal`)
  }

  return (
    <>
      <AppHeader title="Risk gate" lede="Your written limits, applied by code. It runs in this tab and in the Worker from the same module.">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="seed" />
          <Badge tone={simulated ? 'amber' : 'leaf'}>{simulated ? 'demo clock 10:12 NY' : `session open · ${session.nowEt} NY`}</Badge>
        </div>
      </AppHeader>

      <div className="grid gap-6 px-5 py-8 sm:px-8 lg:px-10 xl:grid-cols-[400px_1fr]">
        <div className="grid content-start gap-5">
          {simulated && (
            <Notice tone="info">
              The live market is closed, or already past the demo entry window, so the gate is running on the session's 10:12 New
              York clock. Narrow the entry window below and you can still watch rule R-02 block on time.
            </Notice>
          )}

          <section aria-labelledby="limits-title" className="panel rounded-[26px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="limits-title" className="text-[17px] font-medium tracking-[-0.02em]">Your limits</h2>
                <p className="mt-1 text-[13px] text-muted">Saved in this browser. Only you can change them.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="size-4" />}
                onClick={() => {
                  setLimits(LIMIT_DEFAULTS)
                  toast('Limits reset to the defaults')
                }}
              >
                Reset
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Account equity ($)"
                type="number"
                min={100}
                step={100}
                value={limits.equityCents / 100}
                onChange={(e) => setLimit('equityCents', usdToCents(e.target.value))}
              />
              <Input
                label="Risk per trade (%)"
                type="number"
                min={0.1}
                max={5}
                step={0.1}
                value={limits.riskPerTradePct}
                onChange={(e) => setLimit('riskPerTradePct', Number(e.target.value) || 0)}
              />
              <Input
                label="Daily loss limit (%)"
                type="number"
                min={0.5}
                max={10}
                step={0.1}
                value={limits.dailyLossPct}
                onChange={(e) => setLimit('dailyLossPct', Number(e.target.value) || 0)}
              />
              <Input
                label="Position cap (%)"
                type="number"
                min={5}
                max={100}
                step={5}
                value={limits.positionCapPct}
                onChange={(e) => setLimit('positionCapPct', Number(e.target.value) || 0)}
              />
              <Input
                label="Cash buffer (%)"
                type="number"
                min={0}
                max={50}
                step={5}
                value={limits.cashBufferPct}
                onChange={(e) => setLimit('cashBufferPct', Number(e.target.value) || 0)}
              />
              <Input
                label="Max trades / day"
                type="number"
                min={1}
                max={20}
                step={1}
                value={limits.maxTradesPerDay}
                onChange={(e) => setLimit('maxTradesPerDay', Math.max(1, Math.round(Number(e.target.value) || 1)))}
              />
              <Input
                label="Minimum reward:risk"
                type="number"
                min={0.5}
                max={5}
                step={0.1}
                value={limits.minRewardRisk}
                onChange={(e) => setLimit('minRewardRisk', Number(e.target.value) || 0)}
              />
              <Input label="Flat by (New York)" type="time" value={limits.flatBy} onChange={(e) => setLimit('flatBy', e.target.value)} />
              <Input label="Entry window opens" type="time" value={limits.entryWindowStart} onChange={(e) => setLimit('entryWindowStart', e.target.value)} />
              <Input label="Entry window closes" type="time" value={limits.entryWindowEnd} onChange={(e) => setLimit('entryWindowEnd', e.target.value)} />
            </div>
          </section>

          <section aria-labelledby="account-title" className="panel rounded-[26px] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="account-title" className="text-[17px] font-medium tracking-[-0.02em]">Account today</h2>
                <p className="mt-1 text-[13px] text-muted">Sample numbers for trying the rules.</p>
              </div>
              <Badge tone={stored.killSwitch ? 'danger' : 'leaf'}>{stored.killSwitch ? 'kill switch on' : 'live checks'}</Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Day P&L ($)"
                type="number"
                step={10}
                value={stored.dayPnlCents / 100}
                onChange={(e) => setStored((prev) => ({ ...prev, dayPnlCents: usdToCents(e.target.value) }))}
              />
              <Input
                label="Trades taken today"
                type="number"
                min={0}
                max={20}
                step={1}
                value={stored.tradesToday}
                onChange={(e) => setStored((prev) => ({ ...prev, tradesToday: Math.max(0, Math.round(Number(e.target.value) || 0)) }))}
              />
              <Input
                label="Risk already used ($)"
                type="number"
                min={0}
                step={5}
                value={stored.riskUsedCents / 100}
                onChange={(e) => setStored((prev) => ({ ...prev, riskUsedCents: Math.max(0, usdToCents(e.target.value)) }))}
              />
              <div className="grid content-end">
                <Button
                  variant={stored.killSwitch ? 'danger' : 'glass'}
                  icon={<Power className="size-4" />}
                  onClick={() => {
                    if (stored.killSwitch) {
                      setStored((prev) => ({ ...prev, killSwitch: false }))
                      toast('Kill switch reset. Checks run again.')
                    } else {
                      const cancelled = engageKillSwitch()
                      toast(cancelled > 0 ? `Kill switch on. ${cancelled} live ticket${cancelled === 1 ? '' : 's'} cancelled.` : 'Kill switch on. Nothing passes.')
                    }
                  }}
                >
                  {stored.killSwitch ? 'Kill switch on' : 'Kill switch off'}
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setStored(ACCOUNT_DEFAULTS)
                toast('Account reset for this session')
              }}
            >
              Reset account
            </Button>
          </section>
        </div>

        <div className="grid content-start gap-5">
          <section aria-labelledby="plan-title" className="panel rounded-[26px] p-5">
            <h2 id="plan-title" className="text-[17px] font-medium tracking-[-0.02em]">Plan under review</h2>
            <p className="mt-1 text-[13px] text-muted">
              Levels come from a setup or from you. The gate never edits them; it only says whether your rules allow the trade.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Select label="Symbol" value={plan.symbol} onChange={(e) => setSymbol(e.target.value)}>
                {INSTRUMENTS.map((i) => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.symbol} · {i.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Entry ($)"
                type="number"
                step={0.01}
                min={0.01}
                value={plan.entryCents / 100}
                onChange={(e) => setLevel({ entryCents: usdToCents(e.target.value) })}
              />
              <Input
                label="Stop ($)"
                type="number"
                step={0.01}
                min={0.01}
                value={plan.stopCents / 100}
                onChange={(e) => setLevel({ stopCents: usdToCents(e.target.value) })}
              />
              <Input
                label="Target ($)"
                type="number"
                step={0.01}
                min={0.01}
                value={plan.targetCents / 100}
                onChange={(e) => setLevel({ targetCents: usdToCents(e.target.value) })}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="tint" size="sm" onClick={() => setTargetAtR(2)}>
                Set 2R target
              </Button>
              <Button variant="glass" size="sm" onClick={() => setTargetAtR(1)}>
                Set 1R target
              </Button>
              <span className="ml-auto font-mono text-[12.5px] text-muted">
                risk/share ${(plan.riskPerShareCents / 100).toFixed(2)} · {(plan.rMultiple || 0).toFixed(2)}R
              </span>
            </div>
          </section>

          <GateVerdictCard verdict={verdict} />

          {liveTicket ? (
            <div className="panel flex flex-wrap items-center justify-between gap-3 rounded-[22px] px-5 py-4">
              <p className="text-[13.5px] text-soft">
                Paper ticket <Badge tone="leaf" className="mx-1 h-6 px-2.5 text-[11.5px]">{TICKET_LABEL[liveTicket.state]}</Badge>
                {liveTicket.size} shares · {money(liveTicket.maxLossCents)} at risk
              </p>
              <ButtonLink href="/app/journal" variant="glass" size="sm" className="h-9">
                Open the journal
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="tint" icon={<Ticket className="size-4" />} onClick={() => setTicketing(true)} disabled={!canTicket}>
                Confirm paper ticket
              </Button>
              <p className="text-[12.5px] text-faint">
                {expired
                  ? 'This setup\u2019s entry window has closed. A plan from it cannot be ticketed.'
                  : canTicket
                    ? 'Echoes the five numbers the gate used, then stores the ticket in this browser.'
                    : 'The gate has to approve the plan before it can be ticketed.'}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="paper" icon={verdict.verdict === 'approved' ? <ShieldCheck className="size-4" /> : <ShieldX className="size-4" />} onClick={log}>
              Log this check
            </Button>
            <Button
              variant="ghost"
              icon={<Copy className="size-4" />}
              onClick={() => {
                void navigator.clipboard?.writeText(`${verdict.verdict.toUpperCase()}${verdict.ruleId ? ` ${verdict.ruleId}` : ''}: ${verdict.reason}`)
                toast('Reason copied')
              }}
            >
              Copy reason
            </Button>
            <p className="text-[12.5px] text-faint">
              Verdicts are written to this browser's journal, including the blocked ones. Nothing is sent anywhere.
            </p>
          </div>

          <Disclaimer />
        </div>
      </div>

      <Modal
        open={ticketing}
        onClose={() => setTicketing(false)}
        title="Confirm paper ticket"
        description="A paper ticket only. Nothing is sent to a broker, and the fill is simulated against this session's later bars."
      >
        <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white/3 p-4">
          {[
            { label: 'Symbol', value: plan.symbol },
            { label: 'Shares', value: verdict.size ?? '—' },
            { label: 'Entry', value: usd(plan.entryCents) },
            { label: 'Stop', value: usd(plan.stopCents) },
            { label: 'Target', value: usd(plan.targetCents) },
            { label: 'Max loss', value: money(verdict.lossAtStopCents ?? 0) },
          ].map((m) => (
            <div key={m.label}>
              <dt className="text-[12.5px] text-muted">{m.label}</dt>
              <dd className="mt-1 font-mono text-[16px]">{m.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[13px] text-faint">
          Reward:risk {verdict.rewardRisk.toFixed(2)} · {verdict.reason} If any number is wrong, go back and change the plan; the gate will
          re-check it.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="paper" icon={<Ticket className="size-4" />} onClick={confirmPaper} disabled={!canTicket}>
            Confirm ticket
          </Button>
          <Button variant="ghost" onClick={() => setTicketing(false)}>
            Not yet
          </Button>
        </div>
      </Modal>
    </>
  )
}

function usd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}
