import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { cx } from '../lib/cx'
import { useFocusTrap } from '../lib/useFocusTrap'
import { IconButton } from './Button'

/*
  A sheet anchored to the left edge, for the phone menu. Same contract as Modal —
  portal, focus trap, Escape and the scrim close it, focus returns to the opener —
  but it keeps the page visible beside it. Deliberately not Modal: a centred
  dialog for navigation reads as an interruption, and the rail is the desk's own
  furniture, so the phone gets the same list sliding in rather than a different one.
*/
export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  // The trap also locks body scroll and restores it on close. Owning that here as
  // well restored the trap's own value on the way out, which left the page locked.
  useFocusTrap(ref, open, onClose)

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div aria-hidden className="scrim absolute inset-0 animate-fade" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          'absolute inset-y-0 left-0 flex w-[300px] max-w-[86vw] animate-sheet flex-col border-r border-line-strong bg-night p-5 shadow-float',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="truncate text-[19px] font-medium tracking-[-0.04em]">
            {title}
          </h2>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1">
            <X className="size-4" />
          </IconButton>
        </div>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
