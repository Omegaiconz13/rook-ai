import { cx } from '../lib/cx'
import { Link } from '../lib/router'
import { BRAND } from '../content'

/**
 * The mark: a rook — the piece that holds a line and never runs. Three merlons,
 * a shoulder, a tapered body and a stepped plinth, in solid shapes with no
 * strokes, so it stays crisp at 16 px and never turns to mush on a dark tile.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cx('size-6', className)}>
      <rect x="4.2" y="3.6" width="3.8" height="3.7" rx="0.6" />
      <rect x="10.1" y="3.6" width="3.8" height="3.7" rx="0.6" />
      <rect x="16" y="3.6" width="3.8" height="3.7" rx="0.6" />
      <rect x="3.4" y="7.3" width="17.2" height="2.6" rx="0.6" />
      <rect x="6.8" y="9.9" width="10.4" height="5.8" rx="0.5" />
      <rect x="5.2" y="15.7" width="13.6" height="2" rx="0.5" />
      <rect x="3" y="17.7" width="18" height="2.8" rx="0.9" />
    </svg>
  )
}

/**
 * The lockup: the mark on a quiet tile, then the name. The tile gives the mark
 * the same footprint everywhere it lands (nav, footer, auth, the desk header)
 * without drawing a box around the wordmark.
 */
export function Logo({ className, withName = false, href = '/' }: { className?: string; withName?: boolean; href?: string }) {
  return (
    <Link
      href={href}
      className={cx('group inline-flex min-h-10 min-w-10 items-center gap-2.5 text-fg', className)}
      aria-label={`${BRAND.name} home`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[11px] border border-white/10 bg-white/6 text-leaf-text shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition group-hover:border-leaf/40 group-hover:text-leaf">
        <Mark className="size-5" />
      </span>
      {withName && <span className="text-[19px] font-medium tracking-[-0.04em]">{BRAND.name}</span>}
    </Link>
  )
}
