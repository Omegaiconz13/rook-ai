/*
  Honest rates.

  Every percentage the desk prints carries the number of samples behind it and
  a Wilson 95% interval, because a bare "73%" from nine rows is a guess wearing
  a number's clothes. Nothing is reported below MIN_SAMPLE, below
  COMFORT_SAMPLE it is reported with a warning, and the sample is split in half
  so a reader can see whether the halves agree.

  Pure arithmetic: no dependency, no clock, no network.
*/

export type Interval = { low: number; high: number }

export const MIN_SAMPLE = 10
export const COMFORT_SAMPLE = 30

const Z = 1.96

/** Wilson score interval for a proportion. Returns [0, 1] when n is 0. */
export function wilson(successes: number, n: number, z: number = Z): Interval {
  if (!(n > 0) || !Number.isFinite(successes)) return { low: 0, high: 1 }
  const p = Math.min(1, Math.max(0, successes / n))
  const z2 = z * z
  const denom = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return {
    low: Math.max(0, (centre - margin) / denom),
    high: Math.min(1, (centre + margin) / denom),
  }
}

/** Percent to one decimal, so 2/3 does not print as 67 and read as exact. */
export function percent(fraction: number): number {
  return Math.round(fraction * 1000) / 10
}

export type HalfSplit = { first: Rate; second: Rate; agree: boolean }

export type Rate = {
  label: string
  successes: number
  n: number
  /** Percent, one decimal. Only read it when `reliable` is true. */
  pct: number
  lowPct: number
  highPct: number
  reliable: boolean
  comfortable: boolean
  halves: HalfSplit | null
  /** One sentence with N, the interval and any warning attached. */
  line: string
}

function splitHits(hits: boolean[]): HalfSplit | null {
  if (hits.length < MIN_SAMPLE) return null
  const mid = Math.floor(hits.length / 2)
  const firstHits = hits.slice(0, mid)
  const secondHits = hits.slice(mid)
  const first = rateOf('first half', firstHits.filter(Boolean).length, firstHits.length)
  const second = rateOf('second half', secondHits.filter(Boolean).length, secondHits.length)
  const agree = first.lowPct <= second.highPct && second.lowPct <= first.highPct
  return { first, second, agree }
}

/**
 * A rate with its sample size and interval. Pass `hits` in session order and
 * the first and second halves are compared; a disagreement is printed, not
 * averaged away.
 */
export function rateOf(label: string, successes: number, n: number, hits?: boolean[]): Rate {
  const interval = wilson(successes, n)
  const halves = hits && hits.length === n ? splitHits(hits) : null
  const reliable = n >= MIN_SAMPLE
  const comfortable = n >= COMFORT_SAMPLE
  const pct = percent(n > 0 ? successes / n : 0)
  const lowPct = Math.round(interval.low * 100)
  const highPct = Math.round(interval.high * 100)

  const line = !reliable
    ? `${label}: ${n} of ${MIN_SAMPLE} samples — no read yet.`
    : `${label}: ${pct}% (N=${n}, 95% CI ${lowPct}–${highPct}%)${comfortable ? '' : ' · sample still small'}${
        halves && !halves.agree ? ' · halves disagree' : ''
      }`

  return { label, successes, n, pct, lowPct, highPct, reliable, comfortable, halves, line }
}
