import { SESSION_DATE } from './market'
import type { SessionState } from './market'

/*
  US-equity session clock. Everything is evaluated in America/New_York so a
  browser in another timezone still sees the right session. The holiday table
  covers 2026–2027 (regular holidays plus the two early closes) and is sample
  data like the rest of the demo: it is not a market data feed.
*/

const TZ = 'America/New_York'

const HOLIDAYS = new Set([
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31',
  '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
])

/** Sessions that close at 13:00 New York. */
const EARLY_CLOSES = new Set(['2026-11-27', '2026-12-24', '2027-11-26'])

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Current New York date and 24-hour time, e.g. { date: '2026-11-19', time: '10:12' }. */
export function etNow(now: Date = new Date()): { date: string; time: string } {
  const p = Object.fromEntries(parts.formatToParts(now).map((x) => [x.type, x.value]))
  const hour = p.hour === '24' ? '00' : p.hour
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}` }
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

export function isTradingDay(date: string): boolean {
  if (HOLIDAYS.has(date)) return false
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  return day !== 0 && day !== 6
}

/** pre < 09:30 · open 09:30–15:54 · close 15:55–15:59 · closed after that. */
export function sessionStateAt(now: Date = new Date()): SessionState {
  const { date, time } = etNow(now)
  if (!isTradingDay(date)) return 'closed'
  const m = minutesOf(time)
  const lastBar = EARLY_CLOSES.has(date) ? 13 * 60 : 15 * 60 + 55
  if (m < 9 * 60 + 30) return 'pre'
  if (m < lastBar) return 'open'
  if (m < lastBar + 5) return 'close'
  return 'closed'
}

export function sessionLabel(state: SessionState): string {
  return state === 'pre' ? 'Pre-market' : state === 'open' ? 'Session open' : state === 'close' ? 'Closing window' : 'Session closed'
}

export function inEntryWindow(time: string, start: string, end: string): boolean {
  const m = minutesOf(time)
  return m >= minutesOf(start) && m <= minutesOf(end)
}

export function pastFlatBy(time: string, flatBy: string): boolean {
  return minutesOf(time) >= minutesOf(flatBy)
}

/** The demo clock: the desk session's morning, used when the market is shut. */
export const DEMO_CLOCK = { date: SESSION_DATE, time: '10:12' }
