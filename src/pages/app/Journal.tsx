import { useMemo, useRef, useState } from 'react'
import {
  ArrowDownRight,
  BookOpen,
  ClipboardCopy,
  Download,
  Eye,
  Flame,
  Gauge,
  Pencil,
  PlayCircle,
  Plus,
  ShieldAlert,
  Ticket as TicketIcon,
  TrendingUp,
  Upload,
} from 'lucide-react'

import { Badge } from '../../components/Badge'
import { Button, ButtonLink } from '../../components/Button'
import { Disclaimer } from '../../components/Disclaimer'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { Segmented } from '../../components/Segmented'
import { SourceBadge } from '../../components/SourceBadge'
import { StatTile } from '../../components/StatTile'
import { useToast } from '../../components/Toast'
import { VerdictPill } from '../../components/Verdict'
import { JournalCalendar } from '../../components/journal/JournalCalendar'
import { JournalDayNote } from '../../components/journal/JournalDayNote'
import { JournalDetail } from '../../components/journal/JournalDetail'
import { JournalEntryForm } from '../../components/journal/JournalEntryForm'
import { JournalRowEditor } from '../../components/journal/JournalRowEditor'
import {
  appendJournal,
  deleteJournalRow,
  exportJournal,
  importJournal,
  saveDayNote,
  saveTicket,
  updateJournalRow,
  useDayNotes,
  useJournal,
  useTickets,
} from '../../lib/desk'
import { barsFor } from '../../shared/fixtures'
import {
  calendarMonth,
  dayNoteFor,
  journalAnalytics,
  journalBackupFilename,
  journalFilename,
  parseJournalBundle,
  shiftMonth,
  toCsv,
  toJournalJson,
  weekSummary,
} from '../../shared/journal'
import type { DayNote, JournalRow } from '../../shared/journal'
import { SESSION_DATE, SESSION_LABEL } from '../../shared/market'
import { MIN_SAMPLE } from '../../shared/stats'
import { cancelTicket, replayAgainstSession, TICKET_LABEL, ticketLine } from '../../shared/ticket'
import type { PaperTicket } from '../../shared/ticket'
import { AppHeader } from './AppHeader'

type Filter = 'all' | 'taken' | 'blocked' | 'manual'

function etTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
}

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const TICKET_TONE: Record<PaperTicket['state'], 'neutral' | 'leaf' | 'amber' | 'danger'> = {
  proposed: 'amber',
  confirmed: 'amber',
  filled: 'leaf',
  closed: 'neutral',
  cancelled: 'danger',
  expired: 'neutral',
}

const monthOf = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
}

export function JournalPage() {
  const [rows] = useJournal()
  const [dayNotes] = useDayNotes()
  const [tickets] = useTickets()
  const toast = useToast()

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [month, setMonth] = useState(() => monthOf(SESSION_DATE))
  const [detail, setDetail] = useState<JournalRow | null>(null)
  const [editing, setEditing] = useState<JournalRow | null>(null)
  const [adding, setAdding] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<{ rows: JournalRow[]; dayNotes: DayNote[] } | null>(null)
  const file = useRef<HTMLInputElement>(null)

  const summary = useMemo(() => weekSummary(rows), [rows])
  const analytics = useMemo(() => journalAnalytics(rows), [rows])
  const calendar = useMemo(() => calendarMonth(rows, month.year, month.month, SESSION_DATE), [rows, month])
  const noteDate = selectedDate ?? SESSION_DATE
  const note = dayNoteFor(dayNotes, noteDate)?.note ?? ''

  const manualCount = rows.filter((r) => r.source === 'manual').length
  const shown = rows.filter((r) => {
    if (selectedDate && r.date !== selectedDate) return false
    if (filter === 'taken' && !r.took) return false
    if (filter === 'blocked' && r.verdict !== 'BLOCKED') return false
    if (filter === 'manual' && r.source !== 'manual') return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${r.symbol} ${r.setup} ${r.note} ${r.tags.join(' ')} ${r.gateRule}`.toLowerCase().includes(q)
  })

  const live = tickets.filter((t) => t.state === 'proposed' || t.state === 'confirmed' || t.state === 'filled')
  const ticketFor = (row: JournalRow) => tickets.find((t) => t.tradeId === row.tradeId)

  const copyRow = (row: JournalRow) => {
    const line = `${row.date} ${row.symbol} ${row.verdict}${row.gateRule ? ` ${row.gateRule}` : ''} · size ${row.size} · ${row.entry}/${row.stop}/${row.target} · ${row.rPlanned}R${row.note ? ` · ${row.note}` : ''}`
    void navigator.clipboard?.writeText(line)
    toast('Row copied')
  }

  const settle = (ticket: PaperTicket) => {
    const settled = replayAgainstSession(ticket, barsFor(ticket.plan.symbol))
    saveTicket(settled)
    // The desk wrote this result, not the reader: no `editedAt` stamp.
    if (settled.tradeId && settled.rResult !== null) updateJournalRow(settled.tradeId, { rResult: settled.rResult }, false)
    toast(ticketLine(settled))
  }

  const exportCsv = () => {
    if (rows.length === 0) return toast('Nothing to export yet')
    download(journalFilename(SESSION_DATE), toCsv(rows), 'text/csv;charset=utf-8')
    toast(`Exported ${rows.length} rows`)
  }

  const backup = () => {
    // A backup with no rows cannot be read back (the parser refuses an empty journal),
    // so do not hand the reader a file the Restore button will reject.
    if (rows.length === 0) return toast('Nothing to back up yet')
    const bundle = exportJournal()
    download(journalBackupFilename(SESSION_DATE), toJournalJson(bundle.rows, bundle.dayNotes, new Date().toISOString()), 'application/json')
    toast(`Backed up ${rows.length} rows and ${dayNotes.length} day notes`)
  }

  const readFile = async (fileList: FileList | null) => {
    const picked = fileList?.[0]
    if (!picked) return
    const text = await picked.text()
    const parsed = parseJournalBundle(text)
    if (!parsed.ok) {
      toast(parsed.error)
      return
    }
    setPendingRestore({ rows: parsed.rows, dayNotes: parsed.dayNotes })
  }

  return (
    <>
      <AppHeader
        title="Journal"
        lede={`Every check, taken or refused, on ${SESSION_LABEL} — and every trade you write down by hand. A reviewer can only see patterns in rows that are filled the same way.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="seed" />
          <Button variant="glass" size="sm" icon={<Plus className="size-4" />} onClick={() => setAdding(true)}>
            Add trade
          </Button>
          <Button variant="glass" size="sm" icon={<Download className="size-4" />} onClick={exportCsv}>
            Export CSV
          </Button>
          <Button variant="glass" size="sm" icon={<Download className="size-4" />} onClick={backup}>
            Backup
          </Button>
          <Button variant="glass" size="sm" icon={<Upload className="size-4" />} onClick={() => file.current?.click()}>
            Restore
          </Button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            aria-label="Restore a journal backup"
            className="sr-only"
            onChange={(e) => {
              void readFile(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </AppHeader>

      <div className="grid gap-7 px-5 py-8 sm:px-8 lg:px-10">
        <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile label="Rows" value={summary.total} hint={`${summary.taken} taken · ${summary.blocked} blocked · ${manualCount} by hand`} icon={BookOpen} />
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

        <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatTile
            label="Profit factor"
            value={analytics.profitFactor === null ? '—' : analytics.profitFactor.toFixed(2)}
            hint={analytics.tooSmall ? `N=${analytics.closed} closed · below ${MIN_SAMPLE}` : `N=${analytics.closed} closed`}
            icon={TrendingUp}
          />
          <StatTile
            label="Expectancy"
            value={analytics.expectancyR === null ? '—' : `${analytics.expectancyR > 0 ? '+' : ''}${analytics.expectancyR.toFixed(2)}R`}
            hint={analytics.tooSmall ? 'no read below ten closed' : `avg win ${analytics.avgWinR?.toFixed(2) ?? '—'}R · avg loss ${analytics.avgLossR?.toFixed(2) ?? '—'}R`}
            icon={Gauge}
          />
          <StatTile
            label="Max drawdown"
            value={`${analytics.maxDrawdownR > 0 ? '-' : ''}${analytics.maxDrawdownR.toFixed(2)}R`}
            hint={`peak to trough over ${analytics.closed} closed`}
            icon={ArrowDownRight}
          />
          <StatTile
            label="Streak"
            value={analytics.currentStreak.kind === 'none' ? '—' : `${analytics.currentStreak.length} ${analytics.currentStreak.kind === 'win' ? 'W' : 'L'}`}
            hint={analytics.bestR === null ? 'no closed rows yet' : `best ${analytics.bestR.toFixed(2)}R · worst ${analytics.worstR?.toFixed(2)}R`}
            icon={Flame}
          />
        </dl>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[1.15fr_1fr]">
          <JournalCalendar
            month={calendar}
            selected={selectedDate}
            onSelect={(date) => setSelectedDate((current) => (current === date ? null : date))}
            onShift={(delta) => setMonth((m) => shiftMonth(m.year, m.month, delta))}
            onThisMonth={() => setMonth(monthOf(SESSION_DATE))}
          />
          <JournalDayNote
            date={noteDate}
            note={note}
            onSave={(text) => {
              saveDayNote(noteDate, text)
              toast(text.trim() ? `Day note saved for ${noteDate}` : `Day note cleared for ${noteDate}`)
            }}
          />
        </div>

        <section aria-labelledby="review-title" className="panel rounded-[26px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="review-title" className="text-[17px] font-medium tracking-[-0.02em]">
                Weekly review
              </h2>
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

          {(analytics.bySetup.length > 1 || analytics.bySymbol.length > 1) && (
            <div className="mt-5 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              {[
                { title: 'By setup', splits: analytics.bySetup },
                { title: 'By symbol', splits: analytics.bySymbol },
              ].map(({ title, splits }) => (
                <div key={title} className="min-w-0">
                  <h3 className="text-[12px] uppercase tracking-[0.1em] text-faint">{title}</h3>
                  <ul className="mt-2 grid gap-1.5">
                    {splits.slice(0, 5).map((s) => (
                      <li key={s.key} className="flex items-center justify-between gap-3 font-mono text-[12px]">
                        <span className="truncate text-soft">{s.key}</span>
                        <span className="shrink-0 text-faint">
                          {s.closed} closed · <span className={s.sumR > 0 ? 'text-leaf-text' : s.sumR < 0 ? 'text-danger' : 'text-muted'}>{s.sumR > 0 ? '+' : ''}{s.sumR.toFixed(2)}R</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="tickets-title" className="panel rounded-[26px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="tickets-title" className="text-[17px] font-medium tracking-[-0.02em]">
                Paper tickets
              </h2>
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
              { value: 'manual', label: `By hand (${manualCount})` },
            ]}
          />
          <label className="min-w-0">
            <span className="sr-only">Search rows</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search symbol, tag, note…"
              className="h-11 w-56 rounded-full border border-line bg-white/3 px-4 text-[16px] text-soft transition placeholder:text-faint"
            />
          </label>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="flex items-center gap-2 rounded-full border border-leaf/30 bg-leaf-soft px-3 py-1.5 text-[12.5px] text-leaf-text"
            >
              {selectedDate}
              <span aria-hidden>×</span>
              <span className="sr-only">Clear the day filter</span>
            </button>
          )}
          <p className="text-[12.5px] text-faint">The CSV and the backup always export every row, whatever the filter.</p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="No checks logged"
            body="Put a plan through the gate, then press “Log this check”. Blocked plans are worth keeping too, maybe more. A trade you took elsewhere can be added by hand."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink href="/app/risk" variant="paper">
                  Open the gate
                </ButtonLink>
                <Button variant="glass" onClick={() => setAdding(true)}>
                  Add a trade
                </Button>
              </div>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-6" />}
            title="Nothing in this filter"
            body="No rows match the filter, the search or the day you picked. Clearing them brings the rows back."
            action={
              <Button
                variant="glass"
                onClick={() => {
                  setFilter('all')
                  setQuery('')
                  setSelectedDate(null)
                }}
              >
                Show all rows
              </Button>
            }
          />
        ) : (
          <div className="panel overflow-x-auto rounded-[26px]">
            <table className="w-full min-w-[980px] border-collapse text-[12.5px]">
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
                        <span className="block text-[11.5px] text-faint">
                          {r.session}
                          {r.editedAt ? ' · edited' : ''}
                        </span>
                      </th>
                      <td className="px-3 py-3.5 font-mono">
                        <button type="button" onClick={() => setDetail(r)} className="text-soft underline-offset-4 hover:underline">
                          {r.symbol}
                        </button>
                      </td>
                      <td className="px-3 py-3.5 text-soft">
                        <span className="block">{r.setup}</span>
                        {r.tags.length > 0 && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {r.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-line px-1.5 py-0.5 text-[10.5px] text-faint">
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                        {r.note && <span className="mt-1 block max-w-[240px] truncate text-[11.5px] text-faint">{r.note}</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="flex flex-wrap items-center gap-1.5">
                          {r.verdict === 'MANUAL' ? (
                            <Badge tone="neutral" className="h-7 px-2.5 text-[11.5px]">
                              by hand
                            </Badge>
                          ) : (
                            <VerdictPill verdict={r.verdict === 'APPROVED' ? 'approved' : 'blocked'} className="h-7 px-2.5 text-[11.5px]" />
                          )}
                          {r.gateRule && <span className="font-mono text-[11.5px] text-faint">{r.gateRule}</span>}
                          {!r.rulesFollowed && <span className="font-mono text-[11.5px] text-danger">rule break</span>}
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
                          <Button variant="ghost" size="sm" className="h-8 px-2.5" aria-label={`Open ${r.symbol} ${r.date}`} onClick={() => setDetail(r)}>
                            <Eye className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5" aria-label={`Edit ${r.symbol} ${r.date}`} onClick={() => setEditing(r)}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5" aria-label="Copy row" onClick={() => copyRow(r)}>
                            <ClipboardCopy className="size-3.5" />
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
          Rows and day notes are stored in this browser only, under <span className="font-mono text-soft">desk:v1:</span>. The CSV header
          matches the journal schema in the data model; the backup carries every row and note as JSON and restores them here.
        </p>

        <Notice tone="info">
          Every figure on this page is arithmetic over your own rows: nothing is estimated, sampled or fetched. Below ten closed trades a
          rate is printed as a dash, because a percentage from four rows is a guess wearing a number's clothes.
        </Notice>

        <Disclaimer />
      </div>

      <JournalDetail
        row={detail}
        ticket={detail ? ticketFor(detail) : undefined}
        open={detail !== null}
        onClose={() => setDetail(null)}
        onEdit={() => {
          setEditing(detail)
          setDetail(null)
        }}
      />

      <JournalRowEditor
        row={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return
          updateJournalRow(editing.tradeId, patch)
          toast('Row saved')
        }}
        onDelete={() => {
          if (!editing) return
          deleteJournalRow(editing.tradeId)
          toast('Row deleted')
          setEditing(null)
        }}
      />

      <JournalEntryForm
        open={adding}
        defaultDate={selectedDate ?? SESSION_DATE}
        onClose={() => setAdding(false)}
        onAdd={(row) => {
          appendJournal(row)
          toast(`${row.symbol} added by hand`)
        }}
      />

      <Modal
        open={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        title="Replace this journal?"
        description="A restore replaces every row and day note in this browser with the file's. Export a backup first if anything here matters."
      >
        {pendingRestore && (
          <div className="grid gap-4">
            <p className="rounded-2xl border border-line bg-white/3 px-4 py-3 text-[13.5px] text-soft">
              The file holds <span className="font-mono">{pendingRestore.rows.length}</span>{' '}
              {pendingRestore.rows.length === 1 ? 'row' : 'rows'} and <span className="font-mono">{pendingRestore.dayNotes.length}</span>{' '}
              {pendingRestore.dayNotes.length === 1 ? 'day note' : 'day notes'}. This browser has <span className="font-mono">{rows.length}</span>{' '}
              {rows.length === 1 ? 'row' : 'rows'} and <span className="font-mono">{dayNotes.length}</span>{' '}
              {dayNotes.length === 1 ? 'note' : 'notes'}.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPendingRestore(null)}>
                Cancel
              </Button>
              <Button
                variant="paper"
                size="sm"
                onClick={() => {
                  importJournal(pendingRestore.rows, pendingRestore.dayNotes)
                  toast(`Restored ${pendingRestore.rows.length} rows`)
                  setPendingRestore(null)
                }}
              >
                Replace journal
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
