import { useMemo, useState } from 'react'
import { Activity, Radar, Search, ShieldAlert, ShieldCheck } from 'lucide-react'

import { Badge } from '../../components/Badge'
import { ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { EmptyState } from '../../components/EmptyState'
import { Segmented } from '../../components/Segmented'
import { StatTile } from '../../components/StatTile'
import { accountFor, useAccountState, useJournal, useLastMemo, useLimits } from '../../lib/desk'
import { Link } from '../../lib/router'
import { SESSION_DATE } from '../../shared/market'
import { deskSetups, FAMILY_LABEL, FAMILY_SHORT } from '../../shared/setups'
import type { SetupFamily, SetupStatus } from '../../shared/setups'
import { dailyLossCents, money, price } from '../../shared/sizing'

const TONE: Record<SetupStatus, 'leaf' | 'amber' | 'neutral'> = { triggered: 'leaf', waiting: 'amber', expired: 'neutral' }

function etTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
}

export function DeskPage() {
  const setups = useMemo(() => deskSetups(), [])
  const [limits] = useLimits()
  const [stored] = useAccountState()
  const [journal] = useJournal()
  const lastMemo = useLastMemo()
  const [q, setQ] = useState('')
  const [family, setFamily] = useState<'all' | SetupFamily>('all')

  const account = accountFor(limits, stored)
  // "Checks today" is the gate at work: a trade written down by hand was never checked.
  const today = journal.filter((r) => r.date === SESSION_DATE && r.source !== 'manual')
  const blocked = today.filter((r) => r.verdict === 'BLOCKED').length
  const riskLeft = dailyLossCents(limits) - Math.max(0, -account.dayPnlCents) - account.riskUsedCents
  const triggered = setups.filter((s) => s.status === 'triggered').length
  // A PASS does not always mean the setup seat vetoed it: the gate can approve while
  // the score or another blocking seat stops the memo, and the line must say which.
  const lastMemoLine = lastMemo
    ? lastMemo.memo.gate.ruleId
      ? `blocked at ${lastMemo.memo.gate.ruleId}`
      : lastMemo.memo.notes.some((note) => note.role === 'setup' && note.verdict === 'block')
        ? 'setup seat blocked it'
        : lastMemo.memo.decision === 'PASS'
          ? 'the case against won'
          : `${lastMemo.memo.gate.size} shares approved`
    : ''

  const shown = setups.filter((s) => {
    const hit = !q || `${s.symbol} ${FAMILY_LABEL[s.family]}`.toLowerCase().includes(q.toLowerCase())
    return hit && (family === 'all' || s.family === family)
  })

  return (
    <>
      <h1 className="sr-only">Today's desk</h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-7 px-5 py-8 sm:px-8 lg:px-10">
        <dl className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Setups triggered" value={triggered} hint={`${setups.length} in the scan`} icon={Radar} />
          <StatTile label="Checks today" value={today.length} hint="Every check is journaled" icon={Activity} />
          <StatTile label="Blocked" value={blocked} hint="Refusals are the point" icon={ShieldAlert} />
          <StatTile label="Risk left" value={money(Math.max(0, riskLeft))} hint={`of ${money(dailyLossCents(limits))} daily`} icon={ShieldCheck} />
        </dl>

        {lastMemo && (
          <div className="panel flex flex-wrap items-center justify-between gap-3 rounded-[22px] px-5 py-4">
            <p className="text-[13.5px] text-soft">
              Last memo · <span className="font-mono">{lastMemo.packet.plan.symbol}</span> ·{' '}
              <span className={lastMemo.memo.decision === 'TAKE' ? 'text-leaf-text' : 'text-danger'}>{lastMemo.memo.decision}</span> ·{' '}
              {lastMemo.memo.rubricScore}/5 · {lastMemoLine}
            </p>
            <ButtonLink href="/app/room" variant="glass" size="sm" className="h-9">
              Open the room
            </ButtonLink>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[300px]">
            <label htmlFor="desk-search" className="sr-only">
              Search symbols
            </label>
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              id="desk-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search symbol"
              className="field h-11 pl-11"
            />
          </div>
          <div className="min-w-0 max-w-full overflow-x-auto">
            <Segmented
              label="Setup family"
              value={family}
              onChange={setFamily}
              options={[
                { value: 'all', label: 'All' },
                { value: 'orb', label: 'Opening range' },
                { value: 'flag', label: 'Bull flag' },
                { value: 'fvg', label: 'Gap retest' },
                { value: 'reclaim', label: 'Reclaim' },
              ]}
            />
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<Search className="size-6" />}
            title="Nothing matches"
            body={`No ${family === 'all' ? '' : FAMILY_LABEL[family].toLowerCase() + ' '}setups${q ? ` for “${q}”` : ''} in this session.`}
            action={
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  setFamily('all')
                }}
                className="text-[14px] text-leaf-text underline underline-offset-4"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="panel min-w-0 overflow-x-auto rounded-[26px] [contain:paint]">
            <table className="w-full min-w-[760px] border-collapse text-[13.5px]">
              <caption className="sr-only">Setups found in this session</caption>
              <thead>
                <tr className="border-b border-line text-left text-[12px] uppercase tracking-[0.1em] text-faint">
                  <th scope="col" className="px-5 py-3.5 font-medium">Symbol</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Setup</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Trigger</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Entry</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Stop</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Target</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">R</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3.5 text-right font-medium">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="px-5 py-3.5 text-left font-medium">
                      <Link href={`/app/setup/${s.symbol}`} className="text-fg underline-offset-4 hover:text-leaf-text hover:underline">
                        {s.symbol}
                      </Link>
                      <span className="block text-[11.5px] font-normal text-faint">{FAMILY_LABEL[s.family]}</span>
                    </th>
                    <td className="px-3 py-3.5">
                      <Badge tone="neutral" className="h-6 px-2.5 text-[11.5px]">
                        {FAMILY_SHORT[s.family]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[12.5px] text-soft">{etTime(s.triggerAt)}</td>
                    <td className="px-3 py-3.5 text-right font-mono">{price(s.entryCents)}</td>
                    <td className="px-3 py-3.5 text-right font-mono text-danger">{price(s.stopCents)}</td>
                    <td className="px-3 py-3.5 text-right font-mono text-leaf-text">{price(s.targetCents)}</td>
                    <td className="px-3 py-3.5 text-right font-mono">{s.rMultiple.toFixed(2)}</td>
                    <td className="px-3 py-3.5">
                      <Badge tone={TONE[s.status]} className="h-6 px-2.5 text-[11.5px]">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {s.status === 'expired' ? (
                        <span className="text-[12px] text-faint">Window closed</span>
                      ) : (
                        <ButtonLink href={`/app/risk?setup=${s.id}`} variant="glass" size="sm" className="h-9">
                          Gate this
                        </ButtonLink>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid gap-3 border-t border-line pt-6">
          <p className="text-[13px] text-muted">
            The desk shows what your written rules found. It never says what to buy. Every level here is computed from the
            session's 5-minute bars.
          </p>
          <Disclaimer />
        </div>
      </div>
    </>
  )
}
