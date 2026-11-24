import { useEffect, useState } from 'react'

import { Button } from '../Button'
import { DAY_NOTE_MAX } from '../../shared/journal'

/**
 * The page for one session. It saves on blur and by button, keeps the draft
 * while the reader types, and says plainly when there is something unsaved.
 */
export function JournalDayNote({ date, note, onSave }: { date: string; note: string; onSave: (note: string) => void }) {
  const [draft, setDraft] = useState(note)
  useEffect(() => setDraft(note), [date, note])
  const dirty = draft !== note

  const save = () => {
    if (!dirty) return
    onSave(draft)
  }

  return (
    <section aria-labelledby="day-note-title" className="panel flex min-w-0 flex-col rounded-[26px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="day-note-title" className="text-[17px] font-medium tracking-[-0.02em]">
            Day note · <span className="font-mono text-[15px] text-soft">{date}</span>
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">What was true before the open, and what you would do differently. Kept in this browser with the rows.</p>
        </div>
        <Button variant={dirty ? 'tint' : 'glass'} size="sm" className="h-9" disabled={!dirty} onClick={save}>
          {dirty ? 'Save note' : 'Saved'}
        </Button>
      </div>

      <label htmlFor="day-note" className="sr-only">
        Note for {date}
      </label>
      <textarea
        id="day-note"
        value={draft}
        maxLength={DAY_NOTE_MAX}
        rows={7}
        placeholder="Bias, the one thing to watch, what would make me stand down…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        className="mt-4 min-h-[150px] w-full resize-y rounded-2xl border border-line bg-white/3 px-4 py-3 text-[16px] leading-relaxed text-soft transition placeholder:text-faint"
      />
      <p className="mt-2 flex items-center justify-between text-[11.5px] text-faint">
        <span>{dirty ? 'Unsaved changes — blurring the box saves them.' : 'Saved in this browser.'}</span>
        <span className="font-mono">
          {draft.length}/{DAY_NOTE_MAX}
        </span>
      </p>
    </section>
  )
}
