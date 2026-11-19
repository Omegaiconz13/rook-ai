import { useCallback } from 'react'

import type { JournalRow } from '../shared/journal'
import type { Memo, Packet } from '../shared/packet'
import type { Account, RiskLimits, SessionInfo } from '../shared/risk'
import { cancelTicket } from '../shared/ticket'
import type { PaperTicket } from '../shared/ticket'
import { DEMO_CLOCK, etNow, inEntryWindow, sessionStateAt } from '../shared/time'
import { readStore, useStored, writeStore } from './storage'

/*
  Everything the desk remembers, all in this browser: the written limits, the
  account state, the journal and the (demo) account name. Keys are namespaced
  `desk:v1:` by storage.ts so a future schema can migrate without guessing.
*/

export type User = { name: string; email: string }

export const KEY = {
  limits: 'v1:limits',
  account: 'v1:account',
  journal: 'v1:journal',
  memos: 'v1:memos',
  user: 'v1:user',
  confirmed: 'v1:confirmed',
  seed: 'v1:seed',
  tickets: 'v1:tickets',
} as const

export const LIMIT_DEFAULTS: RiskLimits = {
  equityCents: 500_000,
  riskPerTradePct: 1,
  dailyLossPct: 3,
  positionCapPct: 50,
  cashBufferPct: 10,
  maxTradesPerDay: 3,
  minRewardRisk: 1.5,
  entryWindowStart: '09:35',
  entryWindowEnd: '11:30',
  flatBy: '15:55',
}

export type StoredAccount = Omit<Account, 'equityCents'>

export const ACCOUNT_DEFAULTS: StoredAccount = {
  dayPnlCents: 0,
  tradesToday: 0,
  riskUsedCents: 0,
  killSwitch: false,
  sessionDate: DEMO_CLOCK.date,
}

export function useLimits() {
  return useStored<RiskLimits>(KEY.limits, LIMIT_DEFAULTS)
}

export function useAccountState() {
  return useStored<StoredAccount>(KEY.account, ACCOUNT_DEFAULTS)
}

export function useUser() {
  return useStored<User | null>(KEY.user, null)
}

/** The Time Machine seed, remembered so a reload reproduces the same odds. */
export function useSeed() {
  return useStored<number>(KEY.seed, 19)
}

export function useJournal() {
  return useStored<JournalRow[]>(KEY.journal, [])
}

/** Account as the gate expects it: equity always mirrors the written limits. */
export function accountFor(limits: RiskLimits, stored: StoredAccount): Account {
  return { ...stored, equityCents: limits.equityCents }
}

/** Confirmed paper tickets today, used by the duplicate-ticket rule. */
export function useConfirmed() {
  return useStored<{ symbol: string; sessionDate: string }[]>(KEY.confirmed, [])
}

export type StoredMemo = { memo: Memo; packet: Packet }

/** Saved memos, newest first. The packet travels with the memo so the ask panel
    can cite exactly what the room saw, even if limits change afterwards. */
export function useMemos() {
  return useStored<StoredMemo[]>(KEY.memos, [])
}

export function appendMemo(entry: StoredMemo) {
  const list = readStore<StoredMemo[]>(KEY.memos, [])
  writeStore(KEY.memos, [entry, ...list].slice(0, 50))
}

export function useLastMemo(): StoredMemo | null {
  const [memos] = useMemos()
  return memos[0] ?? null
}

export function appendJournal(row: JournalRow) {
  const rows = readStore<JournalRow[]>(KEY.journal, [])
  writeStore(KEY.journal, [row, ...rows].slice(0, 200))
}

export function updateJournalRow(tradeId: string, patch: Partial<JournalRow>) {
  const rows = readStore<JournalRow[]>(KEY.journal, [])
  writeStore(KEY.journal, rows.map((r) => (r.tradeId === tradeId ? { ...r, ...patch } : r)))
}

export function useJournalActions() {
  const append = useCallback((row: JournalRow) => appendJournal(row), [])
  const clear = useCallback(() => writeStore(KEY.journal, []), [])
  return { append, clear }
}

export function useTickets() {
  return useStored<PaperTicket[]>(KEY.tickets, [])
}

/** Insert or replace a ticket; newest first. */
export function saveTicket(ticket: PaperTicket) {
  const list = readStore<PaperTicket[]>(KEY.tickets, [])
  const next = list.some((t) => t.id === ticket.id) ? list.map((t) => (t.id === ticket.id ? ticket : t)) : [ticket, ...list]
  writeStore(KEY.tickets, next.slice(0, 100))
}

/** Cancel every ticket that is still live and report how many were stopped. */
export function cancelOpenTickets(reason = 'Cancelled by the kill switch.'): number {
  const list = readStore<PaperTicket[]>(KEY.tickets, [])
  const open = list.filter((t) => t.state === 'proposed' || t.state === 'confirmed' || t.state === 'filled')
  if (open.length === 0) return 0
  writeStore(KEY.tickets, list.map((t) => (open.some((o) => o.id === t.id) ? cancelTicket(t, reason) : t)))
  return open.length
}

/** The kill switch, in one place: on, plus every live ticket cancelled. */
export function engageKillSwitch(): number {
  const account = readStore<StoredAccount>(KEY.account, ACCOUNT_DEFAULTS)
  writeStore(KEY.account, { ...account, killSwitch: true })
  return cancelOpenTickets()
}

export type DeskSession = { session: SessionInfo; simulated: boolean }

/**
 * The gate needs a session state. The live clock is used only while the market
 * is open and inside the default entry window; otherwise the demo runs on the
 * sample session's 10:12 and every screen that depends on it says so.
 */
export function useDeskSession(): DeskSession {
  const state = sessionStateAt()
  const live = etNow()
  if (state === 'open' && inEntryWindow(live.time, LIMIT_DEFAULTS.entryWindowStart, LIMIT_DEFAULTS.entryWindowEnd)) {
    return { session: { state: 'open', nowEt: live.time }, simulated: false }
  }
  return { session: { state: 'open', nowEt: DEMO_CLOCK.time }, simulated: true }
}

export function resetDesk() {
  for (const key of Object.values(KEY)) writeStore(key, undefined)
}
