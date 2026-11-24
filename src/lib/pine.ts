import type { ScriptingEngine, Vela } from '@luxalgo/vela'

/** Where the draft lives. One script per browser, like the rest of the desk. */
export const SCRIPT_KEY = 'rook:v1:script'

/** The one id the editor's run carries, so a reload can find (and replace) it again. */
export const RUN_ID = 'rook.pine'

/** Name a run shows under: in the legend, the object tree, and the restore. */
export const SCRIPT_TITLE = 'My script'

/** The starting script: an overlay that draws a line, so the first Run shows something. */
export const SCRIPT_TEMPLATE = `//@version=6
indicator("My script", overlay = true)

plot(close, "Close", color = color.teal)
`

/**
 * The Pine engine is its own package (~0.8 MB), so it is fetched the first time a
 * script runs and never on a visit that only looks at candles. Each chart gets its
 * own engine instance — the docs wire engines per chart, and a workspace builds a
 * fresh chart per cell — but the module itself is fetched once.
 */
type PineEngineCtor = new () => ScriptingEngine

/**
 * The addon is fetched once, but each chart builds its own engine: the docs wire
 * engines per chart, and a workspace builds a fresh chart per cell. Only the
 * constructor is kept from the module — holding its namespace would defeat tree
 * shaking and pull in the worker engine as well.
 */
let pine: Promise<PineEngineCtor> | null = null
const engines = new WeakMap<Vela, Promise<void>>()

export function ensurePineEngine(chart: Vela): Promise<void> {
  let pending = engines.get(chart)
  if (!pending) {
    pine ??= import('@luxalgo/vela-pinets').then((m) => m.PineEngine)
    pending = pine
      .then((Engine) => {
        chart.registerEngine('pine', new Engine())
      })
      // A failed fetch is retried on the next Run instead of being cached forever.
      .catch((error: unknown) => {
        engines.delete(chart)
        throw error
      })
    engines.set(chart, pending)
  }
  return pending
}

export function readScript(): string {
  try {
    return localStorage.getItem(SCRIPT_KEY) ?? SCRIPT_TEMPLATE
  } catch {
    return SCRIPT_TEMPLATE
  }
}

export function saveScript(source: string): void {
  try {
    localStorage.setItem(SCRIPT_KEY, source)
  } catch {
    // Private mode: the draft simply does not outlive the tab.
  }
}
