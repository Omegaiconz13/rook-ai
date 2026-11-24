import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { cx } from '../lib/cx'
import { useFocusTrap } from '../lib/useFocusTrap'
import { IconButton } from './Button'

/** Dialog with a focus trap; Escape and the backdrop close it, focus returns to the opener. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  widthClassName = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
  widthClassName?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Two dialogs can legitimately be open at once (a row's detail over the restore
  // prompt), so the ids cannot be fixed labels shared by every Modal.
  const titleId = useId()
  const descriptionId = useId()
  useFocusTrap(ref, open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden className="scrim absolute inset-0 animate-[pop_300ms_ease_both] backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cx('relative w-full animate-pop rounded-[28px] border border-line-strong bg-panel p-6 shadow-float sm:p-8', widthClassName, className)}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-[22px] font-medium tracking-[-0.03em]">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1.5 text-[16px] text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-1">
            <X className="size-4" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
