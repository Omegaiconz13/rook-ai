import { useEffect, useRef, useState } from 'react'
import { ChartCandlestick, Zap } from 'lucide-react'
import { VelaWorkspace } from '@luxalgo/vela/workspace'
import type { Vela } from '@luxalgo/vela'

import { Button } from '../../components/Button'
import { NinthPanel } from '../../components/NinthPanel'
import { Notice } from '../../components/Notice'
import { chartCandleColors, chartUiTheme, drawSetupLevels, positionPricesFor, ruleLabelFor, setupLevelsFor } from '../../lib/vela'
import { useFocusTrap } from '../../lib/useFocusTrap'
import { ROOK_PROVIDER, createRookProvider } from '../../lib/rook-provider'
import { installNinthPanel } from '../../lib/ninth-panel'
import { installScriptPanel } from '../../lib/script-panel'
import { bareTicker, chartHistory, DEFAULT_TIMEFRAME, TIMEFRAMES, timeframeFor } from '../../shared/chartfeed'
import { price } from '../../shared/sizing'

/* The script editor is a registered side panel, so it has to exist before the
   workspace builds its chrome (module scope, not an effect). */
installScriptPanel()
installNinthPanel()

/* Session the page opens on. The provider resolves `NASDAQ:TSLA` from its index. */
const FIRST_SYMBOL = 'NASDAQ:TSLA'
/* Bumped when the drawing scheme changed: old keys carried text labels that would linger. */
const STATE_KEY = 'desk:v1:charts-2'

/** 'fit' frames a cell once; 'force' re-frames it after the chart fitted new bars. */
type FrameMode = 'none' | 'fit' | 'force'

/** The saved document's shape, as far as the level scrub needs it. */
type SavedDoc = {
  charts?: Array<{
    symbol?: string
    drawings?: { drawings?: Array<{ type?: string; locked?: boolean; anchors?: Array<{ price?: number }> }> }
  }>
}

/**
 * The rule's level lines are drawn again on every visit, so the copy the last
 * visit saved is dropped before the chart restores it: otherwise four locked
 * lines pile up in the document on every load. Only locked `hline`s sitting on a
 * price this symbol's own rule draws are ours — a line the reader drew and locked
 * at any other price is left exactly where it was.
 */
function scrubSavedLevels(key: string) {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const doc = JSON.parse(raw) as SavedDoc
    let removed = 0
    for (const chart of doc.charts ?? []) {
      const items = chart.drawings?.drawings
      if (!Array.isArray(items) || !chart.drawings) continue
      // The document carries no owner on a drawing, so the rule's own prices are the
      // only marker there is. They are converted to price units exactly as `drawLevels`
      // does, so the comparison is between identical numbers.
      const ours = new Set(setupLevelsFor(chart.symbol ?? '').map((level) => level.priceCents / 100))
      const position = positionPricesFor(chart.symbol ?? '')
      chart.drawings.drawings = items.filter((drawing) => {
        const anchors = drawing.anchors ?? []
        const price = anchors[0]?.price
        const level = drawing.type === 'hline' && drawing.locked === true && typeof price === 'number' && ours.has(price)
        // Analyze leaves one position tool on the chart; the copy a saved document
        // restores is dropped too, so running it again cannot stack a second box.
        const box =
          position !== null &&
          drawing.type === 'position' &&
          anchors[0]?.price === position.entry &&
          anchors[1]?.price === position.stop &&
          anchors[2]?.price === position.target
        if (level || box) removed += 1
        return !level && !box
      })
    }
    if (removed > 0) localStorage.setItem(key, JSON.stringify(doc))
  } catch {
    // A document we cannot read is the library's to ignore; the page still draws.
  }
}

/**
 * The chart screen: the library's own workspace over Rook's snapshot. The
 * provider in `lib/rook-provider.ts` serves the eight symbols, the timeframes and
 * the session calendar, so the topbar's symbol search, timeframe chips and RTH
 * switch are real; the setup's levels are drawn on every cell's chart as locked
 * lines and listed beside it.
 */
export function ChartsPage() {
  const host = useRef<HTMLDivElement>(null)
  // The phone overlay mounts its own Ninth, outside the shell's panel system, so
  // it needs the workspace the effect owns — read through a ref, never a state copy.
  const workspaceRef = useRef<VelaWorkspace | null>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const [ninthOpen, setNinthOpen] = useState(false)
  useFocusTrap(overlay, ninthOpen, () => setNinthOpen(false))
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  // Empty until the chart reports its symbol: a restored document can open on a
  // different one, and the levels beside the chart must never name the wrong symbol.
  const [symbol, setSymbol] = useState('')

  useEffect(() => {
    const el = host.current
    if (!el) return

    let workspace: VelaWorkspace | null = null
    let disposed = false

    // Keyed by the chart instance, not the cell id: a layout change re-creates
    // cells, and ids can be reused by a fresh chart with old drawings still on it.
    const framed = new WeakMap<Vela, string>()
    const chartSubs = new Map<string, { chart: Vela; off: () => void }>()
    const unsubs: Array<() => void> = []

    // The frame is a number of bars, not a span of time: one 5-minute desk session
    // (78 bars) on every timeframe. Framing the session's *hours* instead squeezes
    // seven hourly bars into the width seventy-eight 5-minute ones had, so the
    // candles grew on every timeframe change and the reader had to zoom back out.
    // Fewer bars than this simply frames all the history there is (30 daily bars).
    const FRAME_BARS = 78

    // `force` is for a market change: the chart fits the new bars itself when they
    // land, so the frame is applied from `load:end`, after that fit, not before it.
    const frameCell = (chart: Vela, force: boolean) => {
      // `market.symbol` keeps the venue (`NASDAQ:TSLA`); the snapshot is keyed bare.
      const next = bareTicker(chart.market.symbol ?? '')
      const timeframe = timeframeFor(chart.market.timeframe ?? '')
      if (!timeframe) return
      const key = `${next}|${timeframe}`
      if (!force && framed.get(chart) === key) return
      framed.set(chart, key)
      const bars = chartHistory(next, timeframe)
      if (bars.length === 0) return
      const from = bars[Math.max(0, bars.length - FRAME_BARS)].time
      chart.setVisibleRange({ from, to: bars[bars.length - 1].time })
    }

    const paintCell = (chart: Vela, mode: FrameMode) => {
      if (mode !== 'none') frameCell(chart, mode === 'force')
      const next = bareTicker(chart.market.symbol ?? '')
      const range = chart.getVisibleRange()
      // The level ids live in `lib/vela`, so Ninth's Analyze replaces the same
      // lines this paint owns instead of adding a second set on those prices.
      drawSetupLevels(chart, next, range ?? undefined)
    }

    // Every cell carries its own symbol's levels, not just the active one.
    const paintAll = (mode: FrameMode) => {
      if (!workspace || disposed) return
      for (const cell of workspace.cells()) paintCell(cell.chart, mode)
      setSymbol(bareTicker(workspace.chart.market.symbol ?? FIRST_SYMBOL))
    }

    const onMarket = () => paintAll('force')

    // A layout change creates and destroys cells: keep one subscription per live cell.
    const bindCells = () => {
      if (!workspace) return
      const cells = workspace.cells()
      const live = new Set(cells.map((c) => c.id))
      for (const [id, sub] of chartSubs) {
        if (live.has(id)) continue
        sub.off()
        chartSubs.delete(id)
      }
      for (const cell of cells) {
        const bound = chartSubs.get(cell.id)
        // A layout change can hand an existing cell id to a freshly built chart; the
        // old listener belongs to a chart that no longer exists and never fires again.
        if (bound?.chart === cell.chart) continue
        bound?.off()
        // The levels are ours to clear: `clearOnSymbolChange` would also wipe what
        // the reader drew the moment the restored document loads.
        const offMarket = cell.chart.on('market:changed', onMarket)
        // The chart fits the bars itself when they land; `load:end` is the documented
        // hook for rebuilding host visuals, so an unframed cell is framed after that
        // fit. It is a `fit`, not a `force`: a deeper-history load must not undo a
        // zoom the reader made on a cell that is already framed.
        const offLoad = cell.chart.on('load:end', () => {
          if (!disposed && workspace) paintCell(cell.chart, 'fit')
        })
        chartSubs.set(cell.id, {
          chart: cell.chart,
          off: () => {
            offMarket()
            offLoad()
          },
        })
      }
    }

    const bind = (mode: FrameMode) => {
      if (!workspace || disposed) return
      bindCells()
      paintAll(mode)
    }

    try {
      scrubSavedLevels(STATE_KEY)
      workspace = new VelaWorkspace(el, {
        layout: '1',
        symbol: FIRST_SYMBOL,
        timeframe: DEFAULT_TIMEFRAME,
        timeframes: [...TIMEFRAMES],
        providers: { [ROOK_PROVIDER]: () => createRookProvider() },
        theme: chartUiTheme(),
        ...chartCandleColors(),
        timezone: 'America/New_York',
        persist: STATE_KEY,
        statusline: true,
        bottombar: true,
        watermark: true,
        drawings: { toolbar: true },
        // The right-edge tool rail: the shell's own panel toggles (Object tree, Data
        // window) plus whatever a plugin docks there, the way a terminal chart puts
        // its tools on the edge rather than in the bar above the bars. The inspection
        // panels sit at the top of the rail; plugin tools and actions at its foot.
        sidebar: { top: ['objects', 'dataWindow', 'panels'], bottom: ['actions'] },
        autofocus: false,
      })
      workspaceRef.current = workspace

      unsubs.push(workspace.on('cell:active', () => bind('fit')))
      unsubs.push(workspace.on('layout:changed', () => bind('fit')))
      workspace.chart
        .ready()
        .then(() => {
          if (disposed) return
          setStatus('ready')
          // Drawings, indicators, layout and timeframe come back from the saved
          // document; the view itself always opens on the setup's session.
          bind('force')
        })
        .catch(() => {
          if (!disposed) setStatus('error')
        })
    } catch {
      setStatus('error')
    }

    return () => {
      disposed = true
      for (const sub of chartSubs.values()) sub.off()
      for (const off of unsubs) off()
      workspace?.destroy()
      workspaceRef.current = null
    }
  }, [])

  const levels = setupLevelsFor(symbol)

  return (
    <>
      {/* The chart is the page: no title block, no page padding, no card around it.
          One thin strip carries what the lines mean, then the workspace owns every
          pixel the rail leaves — the way a terminal chart fills its window. */}
      <h1 className="sr-only">Charts</h1>

      <div className="flex h-[calc(100svh-6.5rem)] min-w-0 flex-col lg:h-[calc(100svh-2.5rem)]">
        {/* Phones get the chart alone: the strip's symbol line and level legend ate
            the space a five-minute chart needs. It returns at the sm breakpoint. */}
        <div className="hidden shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-line px-3 py-2 sm:flex sm:px-4">
          <p className="flex min-w-0 items-center gap-2 text-[12px] text-faint">
            <ChartCandlestick aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">
              <span className="font-mono text-soft">{symbol || 'Active cell'}</span>
              {symbol && levels.length > 0 ? ` · the ${ruleLabelFor(symbol)}'s levels` : ' · Vela workspace'}
            </span>
          </p>
          {levels.length > 0 && (
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-faint">
              {levels.map((level) => (
                <li key={`${level.label}-${level.priceCents}`} className="flex items-center gap-1.5">
                  <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: level.color }} />
                  {level.label} {price(level.priceCents)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={host}
            role="group"
            aria-label="Price charts"
            className="h-full min-h-[420px] w-full min-w-0"
            data-chart-status={status}
          />
        </div>

        {status === 'error' && (
          <div className="shrink-0 border-t border-line p-3">
            <Notice tone="info">
              The chart could not start in this browser. Everything else on the desk still works; the bars are the same snapshot.
            </Notice>
          </div>
        )}
      </div>

      {/* Phones get their own way in: the shell's panel toggles are not reachable
          at this width, so Ninth floats on the chart's right edge and opens over
          the page, with the chart still behind it. */}
      <div className="fixed bottom-24 right-3 z-40 lg:hidden">
        <Button
          variant="glass"
          size="md"
          className="rounded-full shadow-lg"
          icon={<Zap aria-hidden className="size-4" />}
          onClick={() => setNinthOpen(true)}
          aria-expanded={ninthOpen}
          aria-controls="ninth-overlay"
        >
          Ninth
        </Button>
      </div>

      {ninthOpen && (
        <div
          id="ninth-overlay"
          ref={overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Ninth"
          className="fixed inset-0 z-50 flex flex-col bg-bg lg:hidden"
        >
          <NinthPanel getChart={() => workspaceRef.current?.chart ?? null} header={{ close: () => setNinthOpen(false) }} />
        </div>
      )}
    </>
  )
}
