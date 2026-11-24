import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { msg, registerIcon, registerSidePanel, registerWidgetAction } from '@luxalgo/vela/plugin'
import type { Vela } from '@luxalgo/vela'

import { NinthPanel } from '../components/NinthPanel'

const PANEL_ID = 'rook.ninth'
const ICON_ID = 'rook-ninth'

/** Descriptor text is `MessageLike`, so it goes through `msg` like the Pine panel's. */
const TITLE = msg('rook.ninth.title', 'Ninth')

/**
 * A spark over the rail's other tools: Ninth reads the chart rather than drawing
 * on it, so it sits under the inspection panels and above the code editor.
 */
const ICON = `<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.2 2 4 9.1h3.1L6.8 14l5.2-7.1H8.9L9.2 2Z"/></svg>`

let installed = false

/**
 * Ninth as a docked panel on the chart's right edge, the way the Pine editor is
 * contributed. It floats over the chart so the bars keep their width, docks as a
 * column when pinned, and its width persists with the shell's state document.
 * Registered once, before any workspace is built; the body is its own React root
 * because the shell mounts it outside this app's tree.
 */
export function installNinthPanel(): void {
  if (installed) return
  installed = true
  registerIcon(ICON_ID, ICON)
  // The shell's own panel group is composed out of this topbar at narrow widths and
  // collapses to nothing, which would leave Ninth unreachable: a topbar button is
  // the entry point that is always on screen, on the chart's right cluster.
  registerWidgetAction({
    id: 'rook.ninth.open',
    target: 'topbar',
    label: TITLE,
    icon: ICON_ID,
    iconOnly: true,
    order: 20,
    run: (ctx) => ctx.togglePanel(PANEL_ID, true),
  })
  registerSidePanel({
    id: PANEL_ID,
    title: TITLE,
    icon: ICON_ID,
    // Built-ins are 10 and 20; the Pine editor is 60.
    order: 40,
    width: 420,
    minWidth: 340,
    maxWidth: 720,
    resizable: true,
    maximizable: true,
    overlay: true,
    placement: 'chart',
    // Ninth draws its own row (title, context chip, clear, maximize, close), so the
    // shell renders no header — the same choice the script panel makes.
    header: 'none',
    mount(_ctx, body, header) {
      const host = document.createElement('div')
      host.className = 'h-full w-full'
      body.style.padding = '0'
      body.appendChild(host)

      // `onChart` is a rebind hook, not a one-shot: it runs on mount, after a widget
      // rebuild, and when the workspace points the panel at another active cell.
      let chart: Vela | null = null
      const root = createRoot(host)
      const paint = () => root.render(createElement(NinthPanel, { getChart: () => chart, header }))
      paint()

      return {
        onChart(next: Vela) {
          chart = next
          paint()
        },
        destroy() {
          chart = null
          root.unmount()
          host.remove()
        },
      }
    },
  })
}
