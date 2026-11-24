import { INSTRUMENTS } from '../market'
import { price, usdToCents } from '../sizing'

/*
  Watch: a price condition the reader sets, checked when the desk loads. It is
  Minara's automations with the autonomy removed — a watch may tell you a level
  was reached, and that is all it can do. It cannot size, cannot confirm, cannot
  journal and cannot trade; there is no code path from here to a ticket.

  A watch fires once and keeps its `firedAt`, so reloading the page cannot repeat
  the same message, and removing it is a command away.
*/

export type WatchKind = 'above' | 'below' | 'at'

export type Watch = {
  id: string
  symbol: string
  kind: WatchKind
  priceCents: number
  createdAt: string
  /** Set by the load that saw it fire; null until then. */
  firedAt: string | null
  firedPriceCents: number | null
}

/** Watches kept in this browser. A list longer than this is a habit, not a plan. */
export const WATCH_MAX = 20

export type Quote = { symbol: string; lastCents: number; highCents: number; lowCents: number }

const KIND_WORD: Record<WatchKind, string> = { above: 'above', below: 'below', at: 'at' }

/** `TSLA above 400` · `TSLA below 380` · `TSLA 400` (either side). */
export function parseWatch(argument: string, at: string, id: () => string): { watch?: Watch; why?: string } {
  const words = argument.trim().split(/\s+/).filter(Boolean)
  const symbol = words[0]?.toUpperCase() ?? ''
  if (!symbol) return { why: 'Say what to watch: /watch TSLA above 400.' }
  if (!INSTRUMENTS.some((instrument) => instrument.symbol === symbol)) {
    return { why: `${symbol} is not on the desk. It trades ${INSTRUMENTS.map((i) => i.symbol).join(', ')}.` }
  }

  let kind: WatchKind = 'at'
  let priceWord = words[1]
  if (words[1]?.toLowerCase() === 'above' || words[1]?.toLowerCase() === 'below') {
    kind = words[1].toLowerCase() as WatchKind
    priceWord = words[2]
  } else if (words[1]?.toLowerCase() === 'at') {
    priceWord = words[2]
  }

  if (!priceWord) return { why: `Give a price: /watch ${symbol} above 400.` }
  const dollars = Number.parseFloat(priceWord.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(dollars) || dollars <= 0) return { why: `"${priceWord}" is not a price. Give dollars, e.g. 400 or 393.06.` }

  return {
    watch: {
      id: id(),
      symbol,
      kind,
      priceCents: usdToCents(dollars),
      createdAt: at,
      firedAt: null,
      firedPriceCents: null,
    },
  }
}

/** Same symbol, same side, same line: setting it twice is one watch. */
export function sameWatch(a: Watch, b: Watch): boolean {
  return a.symbol === b.symbol && a.kind === b.kind && a.priceCents === b.priceCents
}

export function addWatch(watches: Watch[], watch: Watch): Watch[] {
  if (watches.some((existing) => sameWatch(existing, watch))) return watches
  return [...watches, watch].slice(-WATCH_MAX)
}

/** Remove by id or by symbol; returns the list and how many lines went. */
export function removeWatches(watches: Watch[], target: string): { watches: Watch[]; removed: number } {
  const wanted = target.trim().toUpperCase()
  if (!wanted) return { watches, removed: 0 }
  const keep = watches.filter((watch) => watch.id.toUpperCase() !== wanted && watch.symbol !== wanted)
  return { watches: keep, removed: watches.length - keep.length }
}

/** True when the quote has reached the line. `at` is a touch, not a close. */
export function watchHit(watch: Watch, quote: Quote): boolean {
  if (watch.kind === 'above') return quote.lastCents >= watch.priceCents
  if (watch.kind === 'below') return quote.lastCents <= watch.priceCents
  return quote.lowCents <= watch.priceCents && watch.priceCents <= quote.highCents
}

/**
 * One pass over the stored watches. A watch that already fired is left alone:
 * the message it produced is the record, and a reload must not repeat it.
 */
export function checkWatches(watches: Watch[], quotes: Quote[], at: string): { watches: Watch[]; fired: Watch[] } {
  const fired: Watch[] = []
  const next = watches.map((watch) => {
    if (watch.firedAt) return watch
    const quote = quotes.find((entry) => entry.symbol === watch.symbol)
    if (!quote || !watchHit(watch, quote)) return watch
    const done: Watch = { ...watch, firedAt: at, firedPriceCents: quote.lastCents }
    fired.push(done)
    return done
  })
  return { watches: next, fired }
}

/** The one message a fired watch produces. */
export function watchMessage(watch: Watch, quote: Quote): string {
  return `${watch.symbol} is at ${price(quote.lastCents)}, ${watch.kind === 'above' ? 'at or above' : watch.kind === 'below' ? 'at or below' : 'touching'} your ${price(watch.priceCents)} line. A watch only tells you: it has not sized, journalled or placed anything.`
}

/** `/watch` with no argument: what is stored, and what each one is waiting for. */
export function watchText(watches: Watch[]): string {
  if (watches.length === 0) {
    return 'No watches. Set one with /watch TSLA above 400, /watch TSLA below 380, or /watch TSLA 400 for a touch. They are checked when the desk loads, and they never trade.'
  }
  const lines = [`${watches.length} ${watches.length === 1 ? 'watch' : 'watches'} (checked when the desk loads; none of them can trade):`]
  for (const watch of watches) {
    const where =
      watch.firedAt === null
        ? 'waiting'
        : `fired at ${watch.firedPriceCents === null ? '—' : price(watch.firedPriceCents)} on ${watch.firedAt.slice(0, 10)}`
    lines.push(`- ${watch.symbol} ${KIND_WORD[watch.kind]} ${price(watch.priceCents)} · ${where} · ${watch.id}`)
  }
  lines.push('Remove one with /watch remove TSLA, or all of them with /watch clear.')
  return lines.join('\n')
}
