import type { LucideIcon } from 'lucide-react'

import { cx } from '../lib/cx'

export function StatTile({ label, value, hint, icon: Icon, className }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cx('panel min-w-0 rounded-[22px] p-4 sm:p-5', className)}>
      <p className="flex items-center gap-2 text-[13.5px] text-muted">
        {Icon && <Icon aria-hidden className="size-4 text-leaf-text" />}
        {label}
      </p>
      <p className="mt-3 font-mono text-[22px] leading-none tracking-[-0.03em] sm:text-[28px]">{value}</p>
      {hint && <p className="mt-2 text-[12.5px] text-faint">{hint}</p>}
    </div>
  )
}
