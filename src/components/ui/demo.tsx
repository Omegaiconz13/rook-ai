import type { ComponentType, SVGProps } from "react"
import { Bell, Home, Mail, Menu, Search, Settings, User } from "lucide-react"

import { Drawer, useOverlayState } from "./heroui-drawer"

const NAV: { icon: ComponentType<SVGProps<SVGSVGElement>>; label: string }[] = [
  { icon: Home, label: "Home" },
  { icon: Search, label: "Search" },
  { icon: Bell, label: "Notifications" },
  { icon: Mail, label: "Messages" },
  { icon: User, label: "Profile" },
  { icon: Settings, label: "Settings" },
]

/** The catalogue demo: HeroUI's drawer with a plain list of links. */
export default function Navigation() {
  const state = useOverlayState()

  return (
    <Drawer state={state}>
      <Drawer.Trigger className="btn btn-glass btn-md">
        <Menu className="size-4" />
        Menu
      </Drawer.Trigger>
      <Drawer.Backdrop>
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Navigation</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <nav className="flex flex-col gap-1">
                {NAV.map((item) => (
                  <button
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-white/6"
                    type="button"
                    onClick={() => state.close()}
                  >
                    <item.icon className="size-5 text-muted" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  )
}
