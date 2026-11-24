import { useEffect, useState } from 'react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { Menu, PanelLeftClose } from 'lucide-react'

import { cx } from '../../lib/cx'
import { Link, useLocation } from '../../lib/router'
import { Drawer } from '../Drawer'

export type NavItem = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }

function NavList({ items, expanded, onSelect }: { items: NavItem[]; expanded: boolean; onSelect: () => void }) {
  const { path } = useLocation()
  return (
    <ul className="grid gap-1">
      {items.map((item) => {
        const on = path === item.href
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={on ? 'page' : undefined}
              title={expanded ? undefined : item.label}
              onClick={onSelect}
              className={cx(
                'flex h-11 items-center rounded-2xl text-[14.5px] transition-colors',
                expanded ? 'gap-3 px-3.5' : 'justify-center px-0',
                on ? 'bg-leaf-soft text-fg' : 'text-soft hover:bg-white/5 hover:text-fg',
              )}
            >
              <item.icon aria-hidden className={cx('size-4.5 shrink-0', on && 'text-leaf-text')} />
              {expanded ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/*
  The desk rail. It rests at icon width, opens while the pointer or focus is
  inside it, collapses again as soon as a seat is chosen, and the button at the
  top pins it open. `children` is rendered in the expanded panel only, so the
  session card never has to squeeze into 76px.
*/
export function NavRail({
  items,
  open,
  onToggle,
  onSelect,
  children,
}: {
  items: NavItem[]
  open: boolean
  onToggle: () => void
  onSelect?: () => void
  children?: (expanded: boolean) => ReactNode
}) {
  const [peek, setPeek] = useState(false)
  const { path } = useLocation()
  const expanded = open || peek

  // A new page starts at icon width.
  useEffect(() => {
    setPeek(false)
  }, [path])

  const leave = () => setPeek(false)
  const select = () => {
    setPeek(false)
    onSelect?.()
  }
  // Pin and unpin both settle the rail now, even with the pointer still on it.
  const toggle = () => {
    setPeek(false)
    onToggle()
  }

  return (
    <aside
      aria-label="Desk"
      onMouseEnter={() => setPeek(true)}
      onMouseLeave={leave}
      onFocus={() => setPeek(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) leave()
      }}
      className="sticky top-0 z-40 hidden h-svh lg:block"
    >
      <div
        className={cx(
          'flex h-full flex-col border-r border-line bg-night px-3 py-5 transition-[width,box-shadow] duration-200 ease-brand',
          expanded ? 'w-[264px]' : 'w-[76px]',
          peek && !open && 'absolute inset-y-0 left-0 z-10 shadow-float',
        )}
      >
        {/* The toggle holds still while the panel grows, so a click never misses it. */}
        <div className={cx('flex h-11 shrink-0 items-center gap-2', expanded ? 'justify-start' : 'justify-center')}>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
            className="btn btn-ghost btn-icon size-9 shrink-0 !p-0"
          >
            {expanded ? <PanelLeftClose className="size-4" /> : <Menu className="size-4.5" />}
          </button>
          {expanded && <span className="truncate text-[19px] font-medium tracking-[-0.04em]">Rook</span>}
        </div>

        <nav aria-label="Desk sections" className="mt-6">
          <NavList items={items} expanded={expanded} onSelect={select} />
        </nav>

        {children?.(expanded)}
      </div>
    </aside>
  )
}

/* The same list as a left sheet, for phones, behind the hamburger. */
export function NavDrawer({ items, title = 'Rook', children }: { items: NavItem[]; title?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="grid size-11 shrink-0 place-items-center rounded-full text-soft transition-colors hover:bg-white/6 hover:text-fg"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={title}>
        <NavList items={items} expanded onSelect={() => setOpen(false)} />
        {children}
      </Drawer>
    </>
  )
}
