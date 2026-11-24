import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { msg, registerIcon, registerSidePanel, registerStatePersistence } from '@luxalgo/vela/plugin'
import type { Vela } from '@luxalgo/vela'

import { ScriptPanel } from '../components/ScriptPanel'
import { RUN_ID, SCRIPT_TITLE, ensurePineEngine } from './pine'

const PANEL_ID = 'rook.script'
const ICON_ID = 'rook-script'
const RUN_KEY = 'rook.script.run'

/**
 * Descriptor text is `MessageLike`, so it goes through `msg`: the shell renders the
 * English source until a locale pack translates it.
 */
const TITLE = msg('rook.script.title', 'Pine script')

/**
 * A code-brackets glyph for the rail; the shell's registry has no script icon. The
 * explicit `width`/`height` matter: the icon slot sizes from the svg's own attributes,
 * and an svg without them collapses to an empty box.
 */
const ICON = `<svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4.2 2.8 8 6 11.8"/><path d="M10 4.2 13.2 8 10 11.8"/><path d="M9.1 3.2 6.9 12.8" opacity="0.55"/></svg>`

/** The document round-trips `ext` opaquely, so a restored run is validated, not trusted. */
function savedScript(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const { script } = payload as { script?: unknown }
  return typeof script === 'string' && script.trim() !== '' ? script : null
}

let installed = false

/**
 * The script editor as a docked panel, the way Vela's own app opens one: a toggle in
 * the right rail, and a column that floats over the chart's right edge so the bars
 * keep their width. Registered once, before any chart is built; the panel body is a
 * second React root because the shell mounts it outside this app's tree.
 */
export function installScriptPanel(): void {
  if (installed) return
  installed = true
  registerIcon(ICON_ID, ICON)
  registerSidePanel({
    id: PANEL_ID,
    title: TITLE,
    icon: ICON_ID,
    // The shell's own panels keep the top of the rail; the editor sits under them.
    order: 60,
    width: 520,
    minWidth: 360,
    maxWidth: 900,
    resizable: true,
    // Meaningful with a headless header only because the panel draws the control
    // itself and drives `header.setMaximized`; without it the shell ignores the call.
    maximizable: true,
    overlay: true,
    placement: 'chart',
    // The editor owns its header row (title, Run, maximize, close), like a terminal's.
    header: 'none',
    mount(ctx, body, header) {
      const host = document.createElement('div')
      host.className = 'h-full w-full'
      body.style.padding = '0'
      body.appendChild(host)

      // `onChart` is the rebind hook, not a one-shot: it runs on mount, after a widget
      // rebuild and when a workspace re-points the panel at another active cell. The
      // editor reads the chart through this at the moment Run is pressed, so a rebuild
      // can never leave it holding the previous chart.
      let chart: Vela | null = null

      const root = createRoot(host)
      root.render(createElement(ScriptPanel, { getChart: () => chart, header, shell: ctx }))

      return {
        onChart(next: Vela) {
          chart = next
        },
        destroy() {
          chart = null
          root.unmount()
          host.remove()
        },
      }
    },
  })

  /*
   * The last successful run rides the chart document. Nothing is copied: the indicator
   * on the chart holds its own source, so a snapshot reads the code off it and a restore
   * adds it back through the cell's muted `addIndicator` — visible on the next load,
   * never in the undo timeline.
   */
  registerStatePersistence({
    key: RUN_KEY,
    scope: 'cell',
    serialize: ({ chart }) => {
      const script = chart.indicators().find((handle) => handle.id === RUN_ID)?.source
      return script ? { script } : undefined
    },
    restore: (payload, ctx) => {
      const script = savedScript(payload)
      if (!script) return
      // The engine is fetched lazily, so the restore has to bring it in before adding.
      void ensurePineEngine(ctx.chart).then(() => {
        if (ctx.chart.indicators().some((handle) => handle.id === RUN_ID)) return
        ctx.addIndicator({ id: RUN_ID, name: SCRIPT_TITLE, script, language: 'pine' })
      })
    },
  })
}
