import { useEffect, useState } from 'react'

import { Button } from '../Button'
import { Modal } from '../Modal'
import { manualRow, NOTE_MAX } from '../../shared/journal'
import type { JournalRow } from '../../shared/journal'
import { INSTRUMENTS } from '../../shared/market'
import { FAMILY_LABEL } from '../../shared/setups'
import type { SetupFamily } from '../../shared/setups'
import { price, usdToCents } from '../../shared/sizing'

const SETUPS: Array<{ value: string; label: string }> = [
  ...(Object.keys(FAMILY_LABEL) as SetupFamily[]).map((f) => ({ value: f, label: FAMILY_LABEL[f] })),
  { value: 'manual', label: 'Another setup' },
]

/**
 * A trade the gate never saw — a broker fill, a discretionary trade, or one
 * taken on another desk. It is written down as `MANUAL`, so no report can
 * pretend the gate approved it.
 */
export function JournalEntryForm({
  open,
  onClose,
  defaultDate,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  defaultDate: string
  onAdd: (row: JournalRow) => void
}) {
  const [date, setDate] = useState(defaultDate)
  const [symbol, setSymbol] = useState(INSTRUMENTS[0].symbol)
  const [setup, setSetup] = useState<string>('manual')
  const [entry, setEntry] = useState('')
  const [stop, setStop] = useState('')
  const [target, setTarget] = useState('')
  const [size, setSize] = useState('')
  const [note, setNote] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(defaultDate)
    setSymbol(INSTRUMENTS[0].symbol)
    setSetup('manual')
    setEntry('')
    setStop('')
    setTarget('')
    setSize('')
    setNote('')
    setTags('')
    setError('')
  }, [open, defaultDate])

  const entryCents = usdToCents(entry)
  const stopCents = usdToCents(stop)
  const targetCents = usdToCents(target)
  const riskCents = entryCents - stopCents
  const rMultiple = riskCents > 0 && targetCents > entryCents ? (targetCents - entryCents) / riskCents : 0

  const submit = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Pick a session date.')
    if (!(entryCents > 0)) return setError('Entry must be a price above zero.')
    if (!(stopCents > 0)) return setError('Stop must be a price above zero.')
    if (!(targetCents > 0)) return setError('Target must be a price above zero.')
    if (stopCents >= entryCents) return setError('For a long, the stop sits below the entry.')
    if (targetCents <= entryCents) return setError('For a long, the target sits above the entry.')
    const row = manualRow({
      date,
      symbol,
      setup,
      entryCents,
      stopCents,
      targetCents,
      size: Number(size) || 0,
      note,
      tags: tags.split(','),
    })
    if (!row) return setError('Those levels do not make a trade.')
    onAdd(row)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a trade" description="Written down by hand, at the prices you actually had. It is stored as MANUAL, not as a gate approval." widthClassName="max-w-2xl">
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[13px] text-soft">
            Session date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-full border border-line bg-white/3 px-3.5 py-2.5 font-mono text-[16px] text-soft focus-visible:border-leaf"
            />
          </label>
          <label className="block text-[13px] text-soft">
            Symbol
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1.5 w-full rounded-full border border-line bg-panel px-3.5 py-2.5 font-mono text-[16px] text-soft focus-visible:border-leaf"
            >
              {INSTRUMENTS.map((i) => (
                <option key={i.symbol} value={i.symbol}>
                  {i.symbol} · {i.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-[13px] text-soft">
          Setup
          <select
            value={setup}
            onChange={(e) => setSetup(e.target.value)}
            className="mt-1.5 w-full rounded-full border border-line bg-panel px-3.5 py-2.5 text-[16px] text-soft focus-visible:border-leaf"
          >
            {SETUPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { id: 'entry', label: 'Entry', value: entry, set: setEntry },
            { id: 'stop', label: 'Stop', value: stop, set: setStop },
            { id: 'target', label: 'Target', value: target, set: setTarget },
            { id: 'size', label: 'Shares', value: size, set: setSize },
          ].map((field) => (
            <label key={field.id} htmlFor={`entry-${field.id}`} className="block text-[13px] text-soft">
              {field.label}
              <input
                id={`entry-${field.id}`}
                value={field.value}
                inputMode="decimal"
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.id === 'size' ? '0' : '0.00'}
                className="mt-1.5 w-full rounded-full border border-line bg-white/3 px-3.5 py-2.5 font-mono text-[16px] text-soft transition placeholder:text-faint"
              />
            </label>
          ))}
        </div>

        <p className="rounded-2xl border border-line bg-white/3 px-4 py-3 font-mono text-[12px] text-muted">
          {riskCents > 0 ? (
            <>
              risk {price(riskCents)}/share · {rMultiple > 0 ? `${rMultiple.toFixed(2)}R planned` : 'no target above entry'}
              {Number(size) > 0 ? ` · ${price(riskCents * Math.floor(Number(size)))} at the stop` : ''}
            </>
          ) : (
            'Fill the levels to see the risk per share.'
          )}
        </p>

        <label className="block text-[13px] text-soft">
          Note
          <textarea
            value={note}
            maxLength={NOTE_MAX}
            rows={2}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why you took it."
            className="mt-1.5 w-full resize-y rounded-2xl border border-line bg-white/3 px-3.5 py-2.5 text-[16px] text-soft transition placeholder:text-faint"
          />
        </label>

        <label className="block text-[13px] text-soft">
          Tags
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="A+, news, FOMO"
            className="mt-1.5 w-full rounded-full border border-line bg-white/3 px-3.5 py-2.5 text-[16px] text-soft transition placeholder:text-faint"
          />
        </label>

        {error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="paper" size="sm" onClick={submit}>
            Add to journal
          </Button>
        </div>
      </div>
    </Modal>
  )
}
