import { useEffect, useMemo, useRef, useState } from 'react'
import { VelaWorkspace } from '@luxalgo/vela/workspace'

import { cx } from '../lib/cx'
import { chartCandleColors, chartUiTheme, drawLevels, levelColors } from '../lib/vela'
import type { LevelSpec } from '../lib/vela'
import { toChartBars } from '../shared/chartfeed'
import { DATA } from '../shared/market'
import type { Bar } from '../shared/market'
import { price } from '../shared/sizing'

/**
 * The session's candles with the opening range and the plan's levels, drawn by
 * the charting library over the same bars the rest of the desk uses. The levels
 * are the rule's, placed as locked lines; anything drawn on top is the
 * reader's own.
 */
export function BarChart({
  bars,
  symbol,
  rangeHigh,
  rangeLow,
  entry,
  stop,
  target,
  className,
}: {
  bars: Bar[]
  symbol?: string
  rangeHigh?: number
  rangeLow?: number
  entry?: number
  stop?: number
  target?: number
  className?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  const levels = useMemo(() => {
    const list: LevelSpec[] = []
    const color = levelColors()
    if (rangeHigh !== undefined) list.push({ priceCents: rangeHigh, label: 'range high', color: color.range, dashed: true })
    if (rangeLow !== undefined) list.push({ priceCents: rangeLow, label: 'range low', color: color.range, dashed: true })
    if (entry !== undefined) list.push({ priceCents: entry, label: 'entry', color: color.entry })
    if (stop !== undefined) list.push({ priceCents: stop, label: 'stop', color: color.stop })
    if (target !== undefined) list.push({ priceCents: target, label: 'target', color: color.target })
    return list
  }, [rangeHigh, rangeLow, entry, stop, target])

  useEffect(() => {
    const el = host.current
    if (!el || bars.length === 0) return
    // A retry with new data is a fresh attempt, not a chart that stays broken.
    setFailed(false)

    let workspace: VelaWorkspace | null = null
    let disposed = false
    let owned: string[] = []

    try {
      workspace = new VelaWorkspace(el, {
        layout: false,
        data: toChartBars(bars),
        timeframe: '5',
        ...(symbol ? { symbol } : {}),
        theme: chartUiTheme(),
        ...chartCandleColors(),
        timezone: 'America/New_York',
        // The symbol and timeframe come from the desk, so the chart's own
        // network-shaped controls stay out of this one.
        topbar: { left: ['style', 'indicators', 'undo-redo'], right: ['panels', 'screenshot'] },
        statusline: true,
        bottombar: false,
        watermark: Boolean(symbol),
        drawings: { toolbar: true },
        autofocus: false,
      })

      workspace.chart
        .ready()
        .then(() => {
          if (disposed || !workspace) return
          const chartBars = toChartBars(bars)
          owned = drawLevels(
            workspace.chart,
            levels,
            owned,
            chartBars.length > 0 ? { from: chartBars[0].time, to: chartBars[chartBars.length - 1].time } : undefined,
          )
        })
        .catch(() => {
          if (!disposed) setFailed(true)
        })
    } catch {
      setFailed(true)
    }

    return () => {
      disposed = true
      workspace?.destroy()
    }
  }, [bars, levels])

  if (bars.length === 0) return null

  return (
    <figure className={cx('panel overflow-hidden rounded-[26px] p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
        <figcaption className="text-[12.5px] text-muted">
          {DATA.real ? '5-minute bars · delayed market data' : '5-minute bars · sample session'} · the library's own drawing tools and
          indicators
        </figcaption>
        <ul className="flex flex-wrap items-center gap-3 text-[11.5px] text-faint">
          {levels.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: l.color }} />
              {l.label} {price(l.priceCents)}
            </li>
          ))}
        </ul>
      </div>

      {/* A group, not an image: the chart is keyboard- and pointer-interactive and
          carries its own application role inside. */}
      <div
        ref={host}
        role="group"
        aria-label={`Five-minute candles for ${bars.length} bars with the opening range and plan levels`}
        className="h-[360px] w-full sm:h-[420px]"
      />

      {failed && <p className="px-1 pt-2 text-[12px] text-faint">The chart could not start here; the levels above are still the rule's.</p>}

      <p className="px-1 pt-2 text-[11.5px] text-faint">
        {DATA.real ? 'Delayed Yahoo Finance bars, fetched at build time.' : 'Fictional prices from the sample session.'} Levels come
        from the rule, not from a forecast.
      </p>
    </figure>
  )
}
