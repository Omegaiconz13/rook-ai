import type { Bar } from './market'

/*
  Seeded headlines and calendar for the sample session. All of it is fictional
  and labelled `fixture`: the desk never presents sample news as live. A live
  adapter would replace `headlinesFor` and `calendarFor` behind the same types.
*/

export type NewsItem = {
  symbol: string
  at: string
  title: string
  tag: 'earnings' | 'analyst' | 'deal' | 'macro' | 'filing'
  source: 'fixture'
}

export type CalendarEvent = {
  /** New York time, HH:MM */
  at: string
  label: string
  impact: 'high' | 'medium' | 'low'
}

const HEADLINES: Record<string, { at: string; title: string; tag: NewsItem['tag'] }[]> = {
  TSLA: [
    { at: '08:04', title: 'Sample: delivery numbers due after the close, desk flags position risk', tag: 'earnings' },
    { at: '09:12', title: 'Sample: two brokers raise targets ahead of the print', tag: 'analyst' },
  ],
  NVDA: [{ at: '07:40', title: 'Sample: supply commentary lifts semiconductor names in pre-market', tag: 'analyst' }],
  AMD: [{ at: '08:20', title: 'Sample: data-centre order update filed with the exchange', tag: 'filing' }],
  AAPL: [{ at: '09:05', title: 'Sample: services growth note keeps the name range-bound', tag: 'analyst' }],
  MSFT: [{ at: '08:45', title: 'Sample: cloud contract extension reported', tag: 'deal' }],
  META: [{ at: '07:55', title: 'Sample: ad-spend survey points to a steady quarter', tag: 'analyst' }],
  SPY: [{ at: '08:30', title: 'Sample: index futures flat into the open', tag: 'macro' }],
  QQQ: [{ at: '08:30', title: 'Sample: mega-cap breadth narrows again', tag: 'macro' }],
}

/** Headlines per symbol, newest first for the session. */
export function headlinesFor(symbol: string): NewsItem[] {
  const items = HEADLINES[symbol.toUpperCase()] ?? []
  return items.map((h) => ({ symbol: symbol.toUpperCase(), at: h.at, title: h.title, tag: h.tag, source: 'fixture' }))
}

/** One high-impact event, deliberately outside the default entry window. */
export const CALENDAR: CalendarEvent[] = [
  { at: '08:30', label: 'Weekly jobless claims', impact: 'medium' },
  { at: '12:30', label: 'Sample CPI release', impact: 'high' },
]

export type Blackout = { label: string; at: string } | null

/** A high-impact event inside the entry window blocks new risk. */
export function blackoutFor(start: string, end: string): Blackout {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const hit = CALENDAR.find((e) => e.impact === 'high' && toMin(e.at) >= toMin(start) && toMin(e.at) <= toMin(end))
  return hit ? { label: hit.label, at: hit.at } : null
}

/** Simple regime label from the session's own bars. */
export function regimeFor(bars: Bar[]): 'trend' | 'range' | 'quiet' | 'event' {
  if (bars.length < 12) return 'quiet'
  const first = bars[0].open
  const last = bars[bars.length - 1].close
  const range = Math.max(...bars.map((b) => b.high)) - Math.min(...bars.map((b) => b.low))
  const move = Math.abs(last - first)
  if (range > 0 && move / range > 0.55) return 'trend'
  if (range / first < 0.006) return 'quiet'
  return 'range'
}
