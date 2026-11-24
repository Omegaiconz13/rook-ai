import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Badge } from '../Badge'
import { Button } from '../Button'
import { Modal } from '../Modal'
import { NOTE_MAX, clampNote, parseTags, tagsToInput } from '../../shared/journal'
import type { JournalRow } from '../../shared/journal'
import { TICKET_LABEL } from '../../shared/ticket'
import type { PaperTicket } from '../../shared/ticket'

const TONE = { APPROVED: 'leaf', BLOCKED: 'danger', MANUAL: 'neutral' } as const

/**
 * Edit what the reader is allowed to own: the note, the tags, whether the rules
 * were followed, and the result when no ticket is there to settle it. The
 * gate's columns stay read-only — a journal you can rewrite after the fact is
 * not evidence.
 */
export function JournalRowEditor({
  row,
  open,
  onClose,
  onSave,
  onDelete,
}: {
  row: JournalRow | null
  open: boolean
  onClose: () => void
  onSave: (patch: Partial<JournalRow>) => void
  onDelete: () => void
}) {
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [followed, setFollowed] = useState(true)
  const [result, setResult] = useState('')
  const [armed, setArmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!row) return
    setNote(row.note)
    setTags(tagsToInput(row.tags))
    setFollowed(row.rulesFollowed)
    setResult(row.rResult === null ? '' : String(row.rResult))
    setArmed(false)
    setError('')
  }, [row, open])

  if (!row) return null

  const save = () => {
    const trimmed = result.trim()
    const parsed = trimmed === '' ? null : Number(trimmed)
    if (parsed !== null && !Number.isFinite(parsed)) {
      setError('R result is a number, like -1 or 1.85.')
      return
    }
    onSave({ note: clampNote(note), tags: parseTags(tags), rulesFollowed: followed, rResult: parsed })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit row" description="The gate's numbers stay as they were written. Everything you own here is yours to correct." widthClassName="max-w-2xl">
      <div className="grid gap-5">
        <div className="rounded-2xl border border-line bg-white/3 px-4 py-3">
          <p className="flex flex-wrap items-center gap-2 text-[13.5px]">
            <span className="font-mono text-soft">{row.symbol}</span>
            <Badge tone={TONE[row.verdict]} className="h-6 px-2.5 text-[11.5px]">
              {row.verdict}
            </Badge>
            <span className="text-faint">{row.setup}</span>
            {row.gateRule && <span className="font-mono text-[11.5px] text-faint">{row.gateRule}</span>}
            <span className="ml-auto font-mono text-[11.5px] text-faint">{row.date}</span>
          </p>
          <p className="mt-1.5 font-mono text-[12px] text-muted">
            {row.size} sh · entry {row.entry} · stop {row.stop} · target {row.target} · {row.rPlanned}R planned
          </p>
        </div>

        <div>
          <label htmlFor="row-note" className="text-[13px] text-soft">
            Note
          </label>
          <textarea
            id="row-note"
            value={note}
            maxLength={NOTE_MAX}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this entry, and what actually happened."
            className="mt-1.5 w-full resize-y rounded-2xl border border-line bg-white/3 px-3.5 py-2.5 text-[16px] text-soft transition placeholder:text-faint"
          />
          <p className="mt-1 text-right font-mono text-[11px] text-faint">
            {note.length}/{NOTE_MAX}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="row-tags" className="text-[13px] text-soft">
              Tags
            </label>
            <input
              id="row-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="A+, news, FOMO"
              className="mt-1.5 w-full rounded-full border border-line bg-white/3 px-3.5 py-2.5 text-[16px] text-soft transition placeholder:text-faint"
            />
            <p className="mt-1 text-[11.5px] text-faint">Commas, up to eight.</p>
          </div>
          <div>
            <label htmlFor="row-result" className="text-[13px] text-soft">
              R result
            </label>
            <input
              id="row-result"
              value={result}
              inputMode="decimal"
              onChange={(e) => setResult(e.target.value)}
              placeholder="empty until closed"
              className="mt-1.5 w-full rounded-full border border-line bg-white/3 px-3.5 py-2.5 font-mono text-[16px] text-soft transition placeholder:text-faint"
            />
            <p className="mt-1 text-[11.5px] text-faint">A ticket fill writes this too; typing wins.</p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={followed}
          onClick={() => setFollowed((v) => !v)}
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/3 px-4 py-3 text-left transition hover:border-line-strong"
        >
          <span>
            <span className="block text-[13.5px] text-soft">Rules followed</span>
            <span className="block text-[11.5px] text-faint">Off means this trade broke a written rule, and the weekly review will say so.</span>
          </span>
          <span aria-hidden className={followed ? 'h-6 w-11 rounded-full bg-leaf-soft p-1' : 'h-6 w-11 rounded-full bg-white/10 p-1'}>
            <span className={followed ? 'block size-4 translate-x-5 rounded-full bg-leaf transition' : 'block size-4 rounded-full bg-soft transition'} />
          </span>
        </button>

        {error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {armed ? (
            <Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} onClick={onDelete}>
              Confirm delete
            </Button>
          ) : (
            <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" />} onClick={() => setArmed(true)}>
              Delete row
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="paper" size="sm" onClick={save}>
              Save row
            </Button>
          </div>
        </div>

        {row.tradeId && (
          <p className="text-[11px] text-faint">
            {row.source === 'manual' ? 'Written by hand · no gate verdict' : 'Written by the gate'}
            {row.editedAt ? ' · edited since' : ''}
            {' · '}
            <span className="font-mono">{row.tradeId.slice(0, 8)}</span>
          </p>
        )}
      </div>
    </Modal>
  )
}

/** The ticket that owns this row, if the plan was confirmed as one. */
export function ticketLineFor(ticket: PaperTicket | undefined): string {
  if (!ticket) return 'No paper ticket for this row.'
  return `${TICKET_LABEL[ticket.state]} · ${ticket.size} shares`
}
