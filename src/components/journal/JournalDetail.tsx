import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'

import { Badge } from '../Badge'
import { Button } from '../Button'
import { Modal } from '../Modal'
import { BarChart } from '../BarChart'
import type { JournalRow } from '../../shared/journal'
import { barsFor } from '../../shared/fixtures'
import { TICKET_LABEL, ticketLine } from '../../shared/ticket'
import type { PaperTicket } from '../../shared/ticket'

const TONE = { APPROVED: 'leaf', BLOCKED: 'danger', MANUAL: 'neutral' } as const

function cents(value: string): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined
}

/**
 * One row as a page: the numbers the gate wrote, the reader's own note and
 * tags, the ticket that settled it, and — on request — the session's candles
 * with the plan's levels. The chart is mounted only when asked for, so opening
 * a row costs nothing.
 */
export function JournalDetail({
  row,
  ticket,
  open,
  onClose,
  onEdit,
}: {
  row: JournalRow | null
  ticket: PaperTicket | undefined
  open: boolean
  onClose: () => void
  onEdit: () => void
}) {
  const [showChart, setShowChart] = useState(false)
  // Each row opens closed, even when the previous one had its chart up.
  useEffect(() => setShowChart(false), [row?.tradeId])
  if (!row) return null

  const facts: Array<[string, string]> = [
    ['Date', row.date],
    ['Symbol', row.symbol],
    ['Setup', row.setup],
    ['Verdict', row.gateRule ? `${row.verdict} · ${row.gateRule}` : row.verdict],
    ['Size', `${row.size} sh`],
    ['Entry', row.entry],
    ['Stop', row.stop],
    ['Target', row.target],
    ['R planned', row.rPlanned],
    ['R result', row.rResult === null ? '—' : row.rResult.toFixed(2)],
    ['Rules followed', row.rulesFollowed ? 'yes' : 'no'],
    ['Written by', row.source === 'manual' ? 'hand' : 'the gate'],
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${row.symbol} · ${row.date}`}
      description={row.source === 'manual' ? 'A trade written down by hand. No gate verdict was given.' : 'A check the gate ran, with what you made of it afterwards.'}
      widthClassName="max-w-3xl"
    >
      <div className="max-h-[min(70svh,640px)] overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONE[row.verdict]}>{row.verdict}</Badge>
          {row.tags.map((tag) => (
            <Badge key={tag} tone="neutral" className="h-6 px-2.5 text-[11.5px]">
              {tag}
            </Badge>
          ))}
          {row.editedAt && <span className="text-[11.5px] text-faint">edited</span>}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-2xl border border-line bg-white/3 px-4 py-3 text-[12.5px] sm:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-faint">{label}</dt>
              <dd className="mt-0.5 font-mono text-soft">{value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-5">
          <h3 className="text-[13.5px] text-soft">Note</h3>
          <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted">{row.note || 'No note on this row.'}</p>
        </section>

        <section className="mt-5 rounded-2xl border border-line bg-white/3 px-4 py-3">
          <h3 className="text-[13.5px] text-soft">Paper ticket</h3>
          {ticket ? (
            <>
              <p className="mt-1 font-mono text-[12px] text-muted">
                {TICKET_LABEL[ticket.state]} · {ticket.size} sh · {ticketLine(ticket)}
              </p>
              <p className="mt-1 font-mono text-[11.5px] text-faint">
                {ticket.fillCents !== null ? `filled ${(ticket.fillCents / 100).toFixed(2)}` : 'not filled'}
                {ticket.exitCents !== null ? ` · exit ${(ticket.exitCents / 100).toFixed(2)}` : ''}
                {ticket.rResult !== null ? ` · ${ticket.rResult.toFixed(2)}R` : ''}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12.5px] text-faint">No ticket was confirmed for this row, so nothing was simulated.</p>
          )}
        </section>

        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-[13.5px] text-soft">The session behind this row</h3>
            <Button variant="glass" size="sm" className="h-8 px-3 text-[12px]" onClick={() => setShowChart((v) => !v)}>
              {showChart ? 'Hide chart' : 'Show chart'}
            </Button>
          </div>
          {showChart ? (
            <div className="mt-3">
              <BarChart
                bars={barsFor(row.symbol)}
                symbol={row.symbol}
                entry={cents(row.entry)}
                stop={cents(row.stop)}
                target={cents(row.target)}
                className="!p-3"
              />
            </div>
          ) : (
            <p className="mt-1.5 text-[12.5px] text-faint">The chart loads the desk's 5-minute bars and draws this row's entry, stop and target.</p>
          )}
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="paper" size="sm" icon={<Pencil className="size-3.5" />} onClick={onEdit}>
            Edit row
          </Button>
        </div>
      </div>
    </Modal>
  )
}
