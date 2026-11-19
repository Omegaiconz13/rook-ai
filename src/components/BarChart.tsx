import { useMemo, useState } from 'react'

import { cx } from '../lib/cx'
import { DATA } from '../shared/market'
import type { Bar } from '../shared/market'
import { price } from '../shared/sizing'

type Level = { value: number; label: string; stroke: string; dash?: string }

/**
 * Hand-drawn 5-minute candles with the opening range and the plan's levels.
 * No chart library: one SVG, the session's own bars, and a hover readout.
 */
export function BarChart({
  bars,
  rangeHigh,
  rangeLow,
  entry,
  stop,
  target,
  className,
}: {
  bars: Bar[]
  rangeHigh?: number
  rangeLow?: number
  entry?: number
  stop?: number
  target?: number
  className?: string
}) {
  const [hover, setHover] = useState<number | null>(null)

  const geometry = useMemo(() => {
    const W = 720
    const H = 340
    const pad = { l: 10, r: 66, t: 14, b: 26 }
    const levels: Level[] = []
    if (rangeHigh !== undefined) levels.push({ value: rangeHigh, label: 'range high', stroke: 'rgb(207 219 209 / 0.5)', dash: '4 4' })
    if (rangeLow !== undefined) levels.push({ value: rangeLow, label: 'range low', stroke: 'rgb(207 219 209 / 0.5)', dash: '4 4' })
    if (entry !== undefined) levels.push({ value: entry, label: 'entry', stroke: 'var(--color-leaf-text)' })
    if (stop !== undefined) levels.push({ value: stop, label: 'stop', stroke: 'var(--color-danger)' })
    if (target !== undefined) levels.push({ value: target, label: 'target', stroke: 'var(--color-leaf)' })

    const values = [...bars.flatMap((b) => [b.high, b.low]), ...levels.map((l) => l.value)]
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const padValue = Math.max(10, Math.round((rawMax - rawMin) * 0.06))
    const min = rawMin - padValue
    const max = rawMax + padValue
    const plotW = W - pad.l - pad.r
    const plotH = H - pad.t - pad.b
    const step = plotW / Math.max(1, bars.length)
    const x = (i: number) => pad.l + i * step + step / 2
    const y = (v: number) => pad.t + ((max - v) / Math.max(1, max - min)) * plotH

    return { W, H, pad, plotW, plotH, step, x, y, levels, min, max }
  }, [bars, rangeHigh, rangeLow, entry, stop, target])

  if (bars.length === 0) return null
  const { W, H, pad, step, x, y, levels, plotH } = geometry
  const candleW = Math.max(1.5, step * 0.58)
  const shown = hover === null ? null : bars[hover]
  const hoverTime = shown
    ? new Date(shown.start).toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
    : ''

  return (
    <figure className={cx('panel rounded-[26px] p-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3">
        <figcaption className="text-[12.5px] text-muted">
          {shown ? (
            <span className="font-mono">
              {hoverTime} NY · O {price(shown.open)} · H {price(shown.high)} · L {price(shown.low)} · C {price(shown.close)}
            </span>
          ) : (
            `${DATA.real ? '5-minute bars · delayed market data' : '5-minute bars · sample session'} · hover a candle`
          )}
        </figcaption>
        <ul className="flex flex-wrap items-center gap-3 text-[11.5px] text-faint">
          {levels.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: l.stroke }} />
              {l.label} {price(l.value)}
            </li>
          ))}
        </ul>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Five-minute candles for ${bars.length} bars with the opening range and plan levels`}
        className="w-full touch-none select-none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect()
          const rel = ((e.clientX - box.left) / box.width) * W
          const idx = Math.round((rel - pad.l - step / 2) / step)
          setHover(idx >= 0 && idx < bars.length ? idx : null)
        }}
      >
        <line x1={pad.l} x2={W - pad.r} y1={pad.t + plotH / 2} y2={pad.t + plotH / 2} stroke="rgb(190 255 200 / 0.05)" />

        {rangeHigh !== undefined && rangeLow !== undefined && (
          <rect
            x={pad.l}
            y={y(rangeHigh)}
            width={Math.min(step * 3, W - pad.l - pad.r)}
            height={Math.max(1, y(rangeLow) - y(rangeHigh))}
            fill="rgb(126 224 104 / 0.08)"
          />
        )}

        {bars.map((b, i) => {
          const up = b.close >= b.open
          const colour = up ? 'var(--color-leaf)' : 'var(--color-danger)'
          const top = y(Math.max(b.open, b.close))
          const bottom = y(Math.min(b.open, b.close))
          return (
            <g key={b.start} opacity={hover === null || hover === i ? 1 : 0.55}>
              <line x1={x(i)} x2={x(i)} y1={y(b.high)} y2={y(b.low)} stroke={colour} strokeWidth={1} />
              <rect x={x(i) - candleW / 2} y={top} width={candleW} height={Math.max(1, bottom - top)} fill={colour} rx={0.6} />
            </g>
          )
        })}

        {levels.map((l) => (
          <g key={l.label}>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(l.value)}
              y2={y(l.value)}
              stroke={l.stroke}
              strokeWidth={1}
              strokeDasharray={l.dash}
            />
            <text x={W - pad.r + 6} y={y(l.value) + 3.5} fill={l.stroke} fontSize={10} fontFamily="var(--font-mono)">
              {price(l.value)}
            </text>
          </g>
        ))}
      </svg>
      <p className="px-1 pt-2 text-[11.5px] text-faint">
        {DATA.real ? 'Delayed Yahoo Finance bars, fetched at build time.' : 'Fictional prices from the sample session.'} Levels come
        from the rule, not from a forecast.
      </p>
    </figure>
  )
}
