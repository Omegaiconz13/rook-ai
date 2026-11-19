import { Info } from 'lucide-react'

import { DISCLAIMER } from '../content'
import { cx } from '../lib/cx'

/** Educational notice. Required on every app screen by the constitution. */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cx('flex items-start gap-2.5 text-[12.5px] leading-relaxed text-faint', className)}>
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{DISCLAIMER}</span>
    </p>
  )
}
