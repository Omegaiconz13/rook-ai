import type { ReactNode } from 'react'
import { BookOpen, RotateCcw } from 'lucide-react'

import { cx } from '../lib/cx'
import { Mark } from './Logo'
import { Rich } from './Rich'

export function DeskAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="round grid shrink-0 place-items-center rounded-full border border-leaf/30 bg-leaf-soft text-leaf-text"
      style={{ width: size, height: size }}
    >
      <Mark className="size-[58%]" />
    </span>
  )
}

export function ChatBubble({ from, children, text, cite, error, onRetry, compact }: { from: 'you' | 'desk'; text?: string; children?: ReactNode; cite?: string | null; error?: boolean; onRetry?: () => void; compact?: boolean }) {
  const you = from === 'you'
  return (
    <div className={cx('flex items-end gap-2.5', you && 'flex-row-reverse')}>
      {!you && <DeskAvatar size={compact ? 26 : 32} />}
      <div
        className={cx(
          'max-w-[min(560px,85%)] rounded-[22px] px-4 py-3 leading-relaxed',
          compact ? 'text-[13.5px]' : 'text-[15px]',
          you ? 'rounded-br-md bg-paper text-ink' : 'glass rounded-bl-md text-soft',
          error && 'border-danger/40 bg-danger-soft text-danger',
        )}
      >
        {text !== undefined ? <Rich text={text} /> : children}
        {cite && (
          <span className="mt-2 flex items-center gap-1.5 text-[12.5px] text-leaf-text">
            <BookOpen aria-hidden className="size-3.5" />
            Source: {cite}
          </span>
        )}
        {error && onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-fg underline-offset-4 hover:underline">
            <RotateCcw aria-hidden className="size-3.5" /> Try again
          </button>
        )}
      </div>
    </div>
  )
}
