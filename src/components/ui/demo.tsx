import { useState } from 'react'
import type { ComponentType, SVGProps } from 'react'
import { Bell, Home, Mail, Menu, Search, Settings, User } from 'lucide-react'

import { Drawer } from '../Drawer'

const NAV: { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string }[] = [
  { icon: Home, label: 'Home' },
  { icon: Search, label: 'Search' },
  { icon: Bell, label: 'Notifications' },
  { icon: Mail, label: 'Messages' },
  { icon: User, label: 'Profile' },
  { icon: Settings, label: 'Settings' },
]

/** The catalogue demo: the desk's own Drawer with a plain list of destinations. */
export default function Navigation() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="btn btn-glass btn-md" onClick={() => setOpen(true)}>
        <Menu className="size-4" />
        Menu
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Navigation">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg transition-colors hover:bg-white/6"
              type="button"
              onClick={() => setOpen(false)}
            >
              <item.icon className="size-5 text-muted" />
              {item.label}
            </button>
          ))}
        </nav>
      </Drawer>
    </>
  )
}
