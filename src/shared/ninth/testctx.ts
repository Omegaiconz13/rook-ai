import { chartHistory } from '../chartfeed'
import { barsFor, dailyFor } from '../fixtures'
import type { JournalRow } from '../journal'
import { SESSION_DATE } from '../market'
import { checkPlan } from '../risk'
import type { RiskLimits } from '../risk'
import { planFromSetup, setupsFor } from '../setups'
import type { DeskSnapshot, TurnContext } from './types'

/*
  A turn context for tests only: the desk snapshot built from the real fixtures
  and the real written rules, with a written-limits fixture rather than the UI's
  defaults. Tests assert against these numbers, so a test that passes here would
  pass with the same snapshot in the browser.
*/

export const TEST_LIMITS: RiskLimits = {
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

export function journalRow(over: Partial<JournalRow> = {}): JournalRow {
  return {
    tradeId: 'trade-1',
    date: SESSION_DATE,
    session: 'open',
    symbol: 'TSLA',
    setup: 'orb',
    gateRule: '',
    verdict: 'APPROVED',
    took: true,
    size: 6,
    entry: '393.06',
    stop: '388.32',
    target: '402.54',
    rPlanned: '2.00',
    rResult: null,
    rulesFollowed: true,
    note: '',
    memoId: null,
    tags: [],
    editedAt: null,
    source: 'gate',
    ...over,
  }
}

export function testContext(over: Partial<DeskSnapshot> = {}): TurnContext {
  const symbol = over.symbol ?? 'TSLA'
  const timeframe = over.timeframe ?? '5'
  const limits = over.limits ?? TEST_LIMITS
  const account =
    over.account ?? {
      equityCents: limits.equityCents,
      dayPnlCents: 0,
      tradesToday: 1,
      riskUsedCents: 0,
      killSwitch: false,
      sessionDate: SESSION_DATE,
    }
  const session = over.session ?? { state: 'open', nowEt: '10:12' }
  const setups = over.setups ?? setupsFor(symbol, barsFor(symbol), dailyFor(symbol))
  const active = setups.find((setup) => setup.status === 'triggered') ?? setups[0]
  const gate =
    over.gate !== undefined
      ? over.gate
      : active
        ? checkPlan({
            plan: planFromSetup(active),
            limits,
            account: { ...account, equityCents: limits.equityCents },
            session,
            history: [],
          })
        : null

  const desk: DeskSnapshot = {
    symbol,
    timeframe,
    bars: over.bars ?? chartHistory(symbol, timeframe),
    levels:
      over.levels ??
      [
        { label: '20-day SMA', priceCents: 38_830 },
        { label: 'opening low', priceCents: 38_832 },
        { label: 'entry', priceCents: 39_306 },
        { label: 'stop', priceCents: 38_832 },
        { label: 'target', priceCents: 40_254 },
      ],
    setups,
    journal: over.journal ?? [],
    tickets: over.tickets ?? [],
    confirmed: over.confirmed ?? [],
    gate,
    limits,
    account,
    session,
    simulated: over.simulated ?? true,
    today: over.today ?? SESSION_DATE,
  }
  return { question: 'test', traceId: 'trace-test', desk }
}
