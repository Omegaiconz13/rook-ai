import { bareTicker, chartHistory, TIMEFRAME_LABEL, timeframeFor, TIMEFRAMES } from '../../chartfeed'
import { INSTRUMENTS } from '../../market'
import { headlinesFor } from '../../news'
import { dailyLossCents, money, price, signedMoney } from '../../sizing'
import { deskSetups, FAMILY_LABEL } from '../../setups'
import type { Setup } from '../../setups'
import type { JournalRow } from '../../journal'
import { sessionLabel } from '../../time'
import { list, num, str } from '../args'
import { fail, ok } from '../result'
import type { ToolEntry } from '../types'

/*
  Tier 1: the tools that only read. Every one of them wraps a function the desk
  already uses on a screen, and returns the same numbers in the same units
  (integer cents, plus the formatted string the screen prints). None of them
  estimates, forecasts or fills a gap: when the desk has nothing, the tool says
  so and the model has to repeat that.

  These never consult the tier gate on their own; the gate rejects writes, and
  these tools have no side effects to reject.
*/

const round2 = (n: number) => Math.round(n * 100) / 100
const cents = (priceUnits: number) => Math.round(priceUnits * 100)

function setupRow(setup: Setup) {
  return {
    id: setup.id,
    symbol: setup.symbol,
    family: setup.family,
    rule: FAMILY_LABEL[setup.family],
    status: setup.status,
    triggerAt: setup.triggerAt,
    entryCents: setup.entryCents,
    entry: price(setup.entryCents),
    stopCents: setup.stopCents,
    stop: price(setup.stopCents),
    targetCents: setup.targetCents,
    target: price(setup.targetCents),
    riskPerShare: price(setup.riskPerShareCents),
    rMultiple: setup.rMultiple,
  }
}

function journalRow(row: JournalRow) {
  return {
    tradeId: row.tradeId,
    date: row.date,
    symbol: row.symbol,
    setup: row.setup,
    verdict: row.verdict,
    gateRule: row.gateRule || null,
    took: row.took,
    size: row.size,
    entry: row.entry,
    stop: row.stop,
    target: row.target,
    rPlanned: row.rPlanned,
    rResult: row.rResult,
    note: row.note,
    tags: row.tags,
  }
}

const TIMEFRAME_WORDS = TIMEFRAMES.join(', ')

const getQuote: ToolEntry = {
  name: 'get_quote',
  set: 'read',
  tier: 1,
  description: 'Last bar for a symbol: open, high, low, close, and the change from the bar before',
  args: {
    symbol: { type: 'symbol', required: true, desc: 'a ticker on the desk' },
    timeframe: { type: 'string', desc: `one of ${TIMEFRAME_WORDS}; the chart's timeframe when omitted` },
  },
  run: (args, ctx) => {
    const symbol = str(args, 'symbol') as string
    const asked = str(args, 'timeframe')
    const timeframe = asked ? timeframeFor(asked) : (timeframeFor(ctx.desk.timeframe) ?? '5')
    if (!timeframe) {
      return fail(`${asked} is not a timeframe the desk serves. Use one of ${TIMEFRAME_WORDS}.`, ['chart'])
    }

    const bars =
      symbol === ctx.desk.symbol && timeframe === ctx.desk.timeframe && ctx.desk.bars.length > 0
        ? ctx.desk.bars
        : chartHistory(symbol, timeframe)
    const last = bars[bars.length - 1]
    if (!last) {
      return fail(`No bars are loaded for ${symbol} at ${timeframe}, so there is no quote to read.`, [
        `chart:${symbol}:${timeframe}`,
      ])
    }

    const previous = bars.length > 1 ? bars[bars.length - 2] : null
    const changePct =
      previous && previous.close > 0 ? round2(((last.close - previous.close) / previous.close) * 100) : null

    return ok(
      {
        symbol,
        timeframe,
        label: TIMEFRAME_LABEL[timeframe],
        asOf: new Date(last.time).toISOString(),
        openCents: cents(last.open),
        open: price(cents(last.open)),
        highCents: cents(last.high),
        high: price(cents(last.high)),
        lowCents: cents(last.low),
        low: price(cents(last.low)),
        closeCents: cents(last.close),
        close: price(cents(last.close)),
        previousClose: previous ? price(cents(previous.close)) : null,
        changePct,
        direction: changePct === null ? 'flat' : changePct >= 0 ? 'up' : 'down',
        bars: bars.length,
      },
      [`chart:${symbol}:${timeframe}`],
    )
  },
}

const listLevels: ToolEntry = {
  name: 'list_levels',
  set: 'read',
  tier: 1,
  description: 'The rule lines drawn on the chart: range, entry, stop and target, in cents and in dollars',
  args: {
    symbol: { type: 'symbol', required: true, desc: 'the chart symbol whose levels to read' },
  },
  run: (args, ctx) => {
    const symbol = str(args, 'symbol') as string
    if (symbol !== ctx.desk.symbol) {
      return fail(
        `Levels are computed only for the chart's symbol, which is ${ctx.desk.symbol} right now. Switch the chart to ${symbol} and ask again.`,
        [`levels:${ctx.desk.symbol}`],
      )
    }
    if (ctx.desk.levels.length === 0) {
      return fail(`No written rule produced levels for ${symbol} today, so the chart draws none.`, [`levels:${symbol}`])
    }
    return ok(
      {
        symbol,
        count: ctx.desk.levels.length,
        levels: ctx.desk.levels.map((level) => ({
          label: level.label,
          priceCents: level.priceCents,
          price: price(level.priceCents),
        })),
      },
      [`levels:${symbol}`],
    )
  },
}

const listSetups: ToolEntry = {
  name: 'list_setups',
  set: 'read',
  tier: 1,
  description: 'The four written rules and what they found today, with entry, stop, target and R',
  args: {
    symbol: { type: 'symbol', desc: 'one ticker; every symbol on the desk when omitted' },
  },
  run: (args) => {
    const symbol = str(args, 'symbol')
    const found = deskSetups()
    const rows = symbol ? found.filter((setup) => setup.symbol === symbol) : found
    if (rows.length === 0) {
      return fail(
        symbol
          ? `None of the four written rules fired on ${symbol} today. That is an answer, not a gap.`
          : 'None of the four written rules fired anywhere on the desk today.',
        [symbol ? `setups:${symbol}` : 'setups:desk'],
      )
    }
    return ok(
      {
        count: rows.length,
        triggered: rows.filter((setup) => setup.status === 'triggered').length,
        setups: rows.map(setupRow),
      },
      [symbol ? `setups:${symbol}` : 'setups:desk'],
    )
  },
}

const scanDesk: ToolEntry = {
  name: 'scan_desk',
  set: 'read',
  tier: 1,
  description: "Every symbol's best setup today, triggered ones first, and the symbols with none",
  args: {},
  run: () => {
    const best = new Map<string, Setup>()
    for (const setup of deskSetups()) {
      if (!best.has(setup.symbol)) best.set(setup.symbol, setup)
    }
    const quiet = INSTRUMENTS.filter((instrument) => !best.has(instrument.symbol)).map((instrument) => instrument.symbol)
    return ok(
      {
        symbols: best.size,
        triggered: [...best.values()].filter((setup) => setup.status === 'triggered').length,
        best: [...best.values()].map(setupRow),
        quiet,
      },
      ['setups:desk'],
    )
  },
}

const readJournal: ToolEntry = {
  name: 'read_journal',
  set: 'read',
  tier: 1,
  description: 'Journal rows, newest first, with counts by verdict; filter by symbol, date or verdict',
  args: {
    symbol: { type: 'symbol', desc: 'only rows for this ticker' },
    date: { type: 'string', desc: 'only rows for this session date, YYYY-MM-DD' },
    verdict: { type: 'string', desc: 'only rows with this verdict', values: ['APPROVED', 'BLOCKED', 'MANUAL'] },
    limit: { type: 'integer', desc: 'how many rows to return, 1 to 50; default 10' },
  },
  run: (args, ctx) => {
    const symbol = str(args, 'symbol')
    const date = str(args, 'date')
    const verdict = str(args, 'verdict')
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fail(`date must be YYYY-MM-DD, not "${date}".`, ['journal'])
    }
    const limit = Math.min(50, Math.max(1, Math.round(num(args, 'limit') ?? 10)))

    // Rows are stored newest first; this keeps that order rather than re-sorting.
    const matched = ctx.desk.journal.filter(
      (row) => (!symbol || row.symbol === symbol) && (!date || row.date === date) && (!verdict || row.verdict === verdict),
    )
    const rows = matched.slice(0, limit)

    return ok(
      {
        counts: {
          total: ctx.desk.journal.length,
          matched: matched.length,
          approved: matched.filter((row) => row.verdict === 'APPROVED').length,
          blocked: matched.filter((row) => row.verdict === 'BLOCKED').length,
          manual: matched.filter((row) => row.verdict === 'MANUAL').length,
          took: matched.filter((row) => row.took).length,
        },
        rows: rows.map(journalRow),
        truncated: matched.length > rows.length,
        empty: ctx.desk.journal.length === 0,
      },
      ['journal', `journal:${date ?? ctx.desk.today}`],
    )
  },
}

const readNews: ToolEntry = {
  name: 'read_news',
  set: 'read',
  tier: 1,
  description: 'Headlines held for the symbols on the desk, each marked as seeded sample data',
  args: {
    symbols: { type: 'strings', required: true, desc: 'the tickers to read headlines for' },
  },
  run: (args) => {
    const asked = list(args, 'symbols').map(bareTicker)
    const known = new Set(INSTRUMENTS.map((instrument) => instrument.symbol))
    const usable = asked.filter((symbol) => known.has(symbol))
    const skipped = asked.filter((symbol) => !known.has(symbol))
    if (usable.length === 0) {
      return fail(`None of ${asked.join(', ')} are on the desk, so there are no headlines to read.`, ['news'])
    }
    const items = usable.flatMap((symbol) => headlinesFor(symbol))
    return ok(
      {
        count: items.length,
        items: items.map((item) => ({ symbol: item.symbol, at: item.at, title: item.title, tag: item.tag })),
        skipped,
        note: 'Seeded sample headlines, marked fixture. They are fictional and are not a feed.',
      },
      usable.map((symbol) => `news:${symbol}`),
    )
  },
}

const readAccount: ToolEntry = {
  name: 'read_account',
  set: 'read',
  tier: 1,
  description: 'Equity, day P&L, trades today, risk used, the kill switch and the session clock',
  args: {},
  run: (_args, ctx) => {
    const { account, limits, tickets, session, simulated } = ctx.desk
    const open = tickets.filter((t) => t.state === 'proposed' || t.state === 'confirmed' || t.state === 'filled').length
    return ok(
      {
        equityCents: limits.equityCents,
        equity: money(limits.equityCents),
        dayPnlCents: account.dayPnlCents,
        dayPnl: signedMoney(account.dayPnlCents),
        tradesToday: account.tradesToday,
        maxTradesPerDay: limits.maxTradesPerDay,
        riskUsedCents: account.riskUsedCents,
        riskUsed: money(account.riskUsedCents),
        dailyLossLimit: money(dailyLossCents(limits)),
        riskPerTrade: `${limits.riskPerTradePct}%`,
        minRewardRisk: limits.minRewardRisk,
        killSwitch: account.killSwitch,
        openTickets: open,
        market: sessionLabel(session.state),
        nowEt: session.nowEt,
        clock: simulated ? 'demo' : 'live',
        entryWindow: `${limits.entryWindowStart}–${limits.entryWindowEnd}`,
        flatBy: limits.flatBy,
        sessionDate: account.sessionDate,
      },
      ['account', 'limits'],
    )
  },
}

export const READ_TOOLS: ToolEntry[] = [
  getQuote,
  listLevels,
  listSetups,
  scanDesk,
  readJournal,
  readNews,
  readAccount,
]
