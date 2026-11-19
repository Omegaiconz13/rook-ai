import { useMemo, useState } from 'react'
import { BookOpen, ClipboardCopy, Download, PlayCircle, ShieldAlert, Ticket as TicketIcon, XCircle } from 'lucide-react'

import { Badge } from '../../components/Badge'
import { Button, ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { EmptyState } from '../../components/EmptyState'
import { Segmented } from '../../components/Segmented'
import { SourceBadge } from '../../components/SourceBadge'
import { StatTile } from '../../components/StatTile'
import { useToast } from '../../components/Toast'
import { VerdictPill } from '../../components/Verdict'
import { saveTicket, updateJournalRow, useJournal, useTickets } from '../../lib/desk'
import { barsFor } from '../../shared/fixtures'
import { journalFilename, toCsv, weekSummary } from '../../shared/journal'
import type { JournalRow } from '../../shared/journal'
import { SESSION_DATE, SESSION_LABEL } from '../../shared/market'
import { MIN_SAMPLE } from '../../shared/stats'
import { cancelTicket, replayAgainstSession, TICKET_LABEL, ticketLine } from '../../shared/ticket'
import type { PaperTicket } from '../../shared/ticket'
import { AppHeader } from './AppHeader'

type Filter = 'all' | 'taken' | 'blocked'

function etTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
}

const TICKET_TONE: Record<PaperTicket['state'], 'neutral' | 'leaf' | 'amber' | 'danger'> = {
  proposed: 'amber',
  confirmed: 'amber',
  filled: 'leaf',
  closed: 'neutral',
  cancelled: 'danger',
  expired: 'neutral',
}

export function JournalPage() {
  const [rows] = useJournal()
  const [tickets] = useTickets()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>('all')

  const summary = useMemo(() => weekSummary(rows), [rows])
  const shown = rows.filter((r) => filter === 'all' || (filter === 'taken' ? r.took : r.verdict === 'BLOCKED'))
  const live = tickets.filter((t) => t.state === 'proposed' || t.state === 'confirmed' || t.state === 'filled')
  const ticketFor = (row: JournalRow) => tickets.find((t) => t.tradeId === row.tradeId)

  const copyRow = (row: JournalRow) => {
    const line = `${row.date} ${row.symbol} ${row.verdict}${row.gateRule ? ` ${row.gateRule}` : ''} · size ${row.size} · ${row.entry}/${row.stop}/${row.target} · ${row.rPlanned}R${row.note ? ` · ${row.note}` : ''}`
    void navigator.clipboard?.writeText(line)
    toast('Row copied')
  }

  const exportCsv = () => {
    if (rows.length === 0) return toast('Nothing to export yet')
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = journalFilename(SESSION_DATE)
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    toast(`Exported ${rows.length} rows`)
  }

  const settle = (ticket: PaperTicket) => {
    const settled = replayAgainstSession(ticket, barsFor(ticket.plan.symbol))
    saveTicket(settled)
    if (settled.tradeId && settled.rResult !== null) updateJournalRow(settled.tradeId, { rResult: settled.rResult })
    toast(ticketLine(settled))
  }

  return (
    <>
      <AppHeader title="Journal" lede={`Every check, taken or refused, on ${SESSION_LABEL}. A reviewer can only see patterns in rows that are filled the same way.`}>
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="seed" />
          <Button variant="glass" size="sm" icon={<Download className="size-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </AppHeader>

      <div className="grid gap-7 px-5 py-8 sm:px-8 lg:px-10">
        <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Rows" value={summary.total} hint={`${summary.taken} taken · ${summary.blocked} blocked`} icon={BookOpen} />
          <StatTile label="Sum R" value={`${summary.sumR > 0 ? '+' : ''}${summary.sumR.toFixed(2)}`} hint={`${summary.closed} closed`} icon={TicketIcon} />
          <StatTile label="Rule breaks" value={summary.ruleBreaks} hint="Taken trades that broke a rule" icon={ShieldAlert} />
          <StatTile
            label="Hit rate"
            value={summary.winRate.reliable ? `${summary.winRate.pct}%` : '—'}
            hint={
              summary.winRate.reliable
                ? `N=${summary.winRate.n} · 95% ${summary.winRate.lowPct}–${summary.winRate.highPct}%`
                : `N=${summary.winRate.n} of ${MIN_SAMPLE} · no read yet`
            }
            icon={PlayCircle}
          />
        </dl>

        <section aria-labelledby="review-title" className="panel rounded-[26px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="review-title" className="text-[17px] font-medium tracking-[-0.02em]">Weekly review</h2>
              <p className="mt-1 text-[13px] text-muted">One change at a time, and only once the sample is big enough to mean something.</p>
            </div>
            {summary.tooSmall && <Badge tone="amber">sample too small</Badge>}
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-soft">{summary.suggestion}</p>
          {summary.closed > 0 && <p className="mt-3 font-mono text-[12.5px] text-muted">{summary.winRate.line}</p>}
          {summary.blocksByRule.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {summary.blocksByRule.slice(0, 5).map((b) => (
                <li key={b.ruleId}>
                  <Badge tone="neutral">
                    {b.ruleId} · {b.count}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="tickets-title" className="panel rounded-[26px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="tickets-title" className="text-[17px] font-medium tracking-[-0.02em]">Paper tickets</h2>
              <p className="mt-1 text-[13px] text-muted">Fills are simulated against this session's later bars. Nothing is routed anywhere.</p>
            </div>
            <Badge tone={live.length > 0 ? 'leaf' : 'neutral'}>{live.length > 0 ? `${live.length} live` : 'none live'}</Badge>
          </div>

          {tickets.length === 0 ? (
            <p className="mt-4 text-[13.5px] text-faint">No tickets yet. Approve a plan in the gate and confirm it as a paper ticket.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {tickets.slice(0, 6).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[14px]">
                      <span className="font-mono">{t.plan.symbol}</span>
                      <Badge tone={TICKET_TONE[t.state]} className="h-6 px-2.5 text-[11.5px]">
                        {TICKET_LABEL[t.state]}
                      </Badge>
                      <span className="text-[12.5px] text-faint">
                        {t.size} sh · entry {t.plan.entryCents / 100} · stop {t.plan.stopCents / 100} · target {t.plan.targetCents / 100}
                      </span>
                    </p>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {ticketLine(t)}
                      {t.fillAt ? ` · filled ${etTime(t.fillAt)} NY` : ''}
                      {t.closedAt ? ` · closed ${etTime(t.closedAt)} NY` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(t.state === 'proposed' || t.state === 'confirmed' || t.state === 'filled') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9"
                        icon={<XCircle className="size-4" />}
                        onClick={() => {
                          saveTicket(cancelTicket(t, 'Cancelled by hand.'))
                          toast('Ticket cancelled')
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Filter rows"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `All (${rows.length})` },
              { value: 'taken', label: `Taken (${summary.taken})` },
              { value: 'blocked', label: `Blocked (${summary.blocked})` },
            ]}
          />
          <p className="text-[12.5px] text-faint">The CSV always exports every row, whatever the filter.</p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="No checks logged"
            body="Put a plan through the gate, then press “Log this check”. Blocked plans are worth keeping too, maybe more."
            action={
              <ButtonLink href="/app/risk" variant="paper">
                Open the gate
              </ButtonLink>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="Nothing in this filter"
            body="No rows match the filter you picked. The other filter has them."
            action={
              <Button variant="glass" onClick={() => setFilter('all')}>
                Show all rows
              </Button>
            }
          />
        ) : (
          <div className="panel overflow-x-auto rounded-[26px]">
            <table className="w-full min-w-[860px] border-collapse text-[12.5px]">
              <caption className="sr-only">Journal rows for this session</caption>
              <thead>
                <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-[0.1em] text-faint">
                  <th scope="col" className="px-3 py-3.5 font-medium">Date</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Symbol</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Setup</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Verdict</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Size</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Entry</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Stop</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">Target</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">R plan</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">R result</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const ticket = ticketFor(r)
                  const canSettle = r.took && r.rResult === null && ticket && (ticket.state === 'confirmed' || ticket.state === 'filled' || ticket.state === 'proposed')
                  return (
                    <tr key={r.tradeId} className="border-b border-line/60 last:border-0">
                      <th scope="row" className="px-3 py-3.5 text-left font-normal">
                        <span className="block text-soft">{r.date}</span>
                        <span className="block text-[11.5px] text-faint">{r.session}</span>
                      </th>
                      <td className="px-3 py-3.5 font-mono">{r.symbol}</td>
                      <td className="px-3 py-3.5 text-soft">{r.setup}</td>
                      <td className="px-3 py-3.5">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <VerdictPill verdict={r.verdict === 'APPROVED' ? 'approved' : 'blocked'} className="h-7 px-2.5 text-[11.5px]" />
                          {r.gateRule && <span className="font-mono text-[11.5px] text-faint">{r.gateRule}</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono">{r.size}</td>
                      <td className="px-3 py-3.5 text-right font-mono">{r.entry}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-danger">{r.stop}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-leaf-text">{r.target}</td>
                      <td className="px-3 py-3.5 text-right font-mono">{r.rPlanned}</td>
                      <td className={r.rResult !== null && r.rResult < 0 ? 'px-3 py-3.5 text-right font-mono text-danger' : 'px-3 py-3.5 text-right font-mono'}>
                        {r.rResult === null ? '—' : r.rResult.toFixed(2)}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="flex items-center justify-end gap-1.5">
                          {canSettle && (
                            <Button variant="tint" size="sm" className="h-8 px-3 text-[12px]" icon={<PlayCircle className="size-3.5" />} onClick={() => settle(ticket)}>
                              Settle
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 px-3 text-[12px]" icon={<ClipboardCopy className="size-3.5" />} onClick={() => copyRow(r)}>
                            <span className="sr-only">Copy row</span>
                          </Button>
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[13px] text-muted">
          Rows are stored in this browser only. The CSV header matches the journal schema in the data model, so a spreadsheet
          can be checked against the same columns.
        </p>
        <Disclaimer />
      </div>
    </>
  )
}
