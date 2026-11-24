import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cx } from '../../lib/cx'
import { WEEKDAYS } from '../../shared/journal'
import type { CalendarMonth } from '../../shared/journal'
import { IconButton } from '../Button'

/**
 * The month, Monday-first, with each day's R. A day with rows is a real button:
 * picking it filters the table below, so the calendar is navigation rather than
 * decoration.
 */
export function JournalCalendar({
  month,
  selected,
  onSelect,
  onShift,
  onThisMonth,
}: {
  month: CalendarMonth
  selected: string | null
  onSelect: (date: string) => void
  onShift: (delta: number) => void
  onThisMonth: () => void
}) {
  return (
    <section aria-labelledby="calendar-title" className="panel rounded-[26px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="calendar-title" className="text-[17px] font-medium tracking-[-0.02em]">
            {month.label}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted">
            {month.totals.rows === 0
              ? 'No rows this month'
              : `${month.totals.rows} ${month.totals.rows === 1 ? 'row' : 'rows'} · ${month.totals.closed} closed · ${month.totals.sumR > 0 ? '+' : ''}${month.totals.sumR.toFixed(2)}R`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconButton label="Previous month" size="sm" className="size-9" onClick={() => onShift(-1)}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <button
            type="button"
            onClick={onThisMonth}
            className="rounded-full border border-line px-3 py-1.5 text-[12px] text-soft transition hover:border-line-strong hover:text-fg"
          >
            This month
          </button>
          <IconButton label="Next month" size="sm" className="size-9" onClick={() => onShift(1)}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.1em] text-faint">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {month.weeks.flat().map((day) => {
          const on = selected === day.date
          const tone = day.sumR > 0 ? 'text-leaf-text' : day.sumR < 0 ? 'text-danger' : 'text-soft'
          return (
            <button
              key={day.date}
              type="button"
              aria-pressed={on}
              aria-label={`${day.date}${day.rows > 0 ? `, ${day.rows} rows, ${day.sumR.toFixed(2)}R` : ', no rows'}`}
              onClick={() => onSelect(day.date)}
              className={cx(
                'grid h-14 place-content-center gap-0.5 rounded-xl border text-[12px] transition',
                day.inMonth ? 'border-line bg-white/3 hover:border-line-strong' : 'border-transparent text-faint/40',
                on && 'border-leaf/50 bg-leaf-soft',
                day.isToday && !on && 'border-line-strong',
              )}
            >
              <span className={cx('font-mono text-[12.5px]', day.inMonth ? 'text-soft' : 'text-faint/40')}>{day.day}</span>
              {day.rows > 0 ? (
                <span className={cx('font-mono text-[10.5px]', tone)}>
                  {day.sumR === 0 ? `${day.rows}·` : `${day.sumR > 0 ? '+' : ''}${day.sumR.toFixed(1)}`}
                </span>
              ) : (
                <span aria-hidden className="text-[10.5px] text-transparent">
                  ·
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-[11.5px] text-faint">Green is a positive sum R, red a negative one. Press a day to filter the rows.</p>
    </section>
  )
}
