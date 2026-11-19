import type { ReactNode } from 'react'

import { cx } from '../lib/cx'
import type { Factor, SeatNote } from '../shared/packet'
import { Badge } from './Badge'

const TONE = { pass: 'leaf', block: 'danger', info: 'neutral' } as const
const WORD = { pass: 'pass', block: 'blocks', info: 'note' } as const

/** One seat's fixed-format note: role, finding, reason, evidence, packet ref. */
export function SeatCard({ note, index }: { note: SeatNote; index: number }) {
  return (
    <li className={cx('panel rounded-[22px] p-5', note.verdict === 'block' && 'border-danger/25')}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11.5px] text-faint">{String(index + 1).padStart(2, '0')}</span>
        <h3 className="text-[15.5px] font-medium tracking-[-0.02em]">{note.title}</h3>
        <Badge tone={TONE[note.verdict]} className="ml-auto h-6 px-2.5 text-[11px]">
          {WORD[note.verdict]}
        </Badge>
      </div>
      <p className="mt-2.5 text-[14px] leading-relaxed text-soft">{note.reason}</p>
      {note.evidence.length > 0 && (
        <ul className="mt-3 grid gap-1 border-t border-line pt-3">
          {note.evidence.map((line) => (
            <li key={line} className="font-mono text-[11.5px] leading-relaxed text-faint">
              {line}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/4 px-2.5 py-1 font-mono text-[10.5px] text-muted">
        cites <span className="text-leaf-text">{note.packetRef}</span>
      </p>
    </li>
  )
}

/** The memo summary: score, how it was built, and the case against. */
export function MemoCard({
  score,
  decision,
  counterCase,
  factors,
  children,
}: {
  score: number
  decision: 'TAKE' | 'PASS'
  counterCase: string
  factors?: Factor[]
  children?: ReactNode
}) {
  const take = decision === 'TAKE'
  return (
    <section aria-label="Decision memo" className={cx('rounded-[26px] border p-6', take ? 'border-leaf/25 bg-leaf-soft/30' : 'border-line-strong bg-white/4')}>
      <div className="flex flex-wrap items-baseline gap-4">
        <p className="font-mono text-[46px] leading-none tracking-[-0.04em]">
          {score}
          <span className="text-[18px] text-faint">/5</span>
        </p>
        <div>
          <p className={cx('text-[13px] uppercase tracking-[0.14em]', take ? 'text-leaf-text' : 'text-danger')}>{decision}</p>
          <p className="text-[13px] text-muted">Decision memo · paper only</p>
        </div>
      </div>
      {factors && factors.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-[12px] uppercase tracking-[0.12em] text-faint">How the score was built</p>
          <ul className="mt-2 grid gap-2.5">
            {factors.map((f) => (
              <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="text-[13.5px] text-soft">{f.label}</span>
                <span className="font-mono text-[12.5px] text-muted">
                  {f.points}/{f.max}
                </span>
                <span className="w-full text-[12px] leading-relaxed text-faint">{f.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[12px] uppercase tracking-[0.12em] text-faint">Strongest case against</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-soft">{counterCase}</p>
      </div>
      {children}
    </section>
  )
}
