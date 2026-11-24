# 05 — Automations and Strategy Studio

Minara has two programmable products and they are aimed at different people. **Automations** are for
the user who can describe what they want in a sentence. **Strategy Studio** is for the user who will
accept generated code and backtest it.

## Automations (desktop app only)

Every automation is three parts, and the schema is worth copying exactly:

| Part | Decides | Values |
|---|---|---|
| **Trigger** | When | interval (5 min, daily, weekly), calendar (weekdays 09:00 local), once at a time, manual "Run once", price crosses / price holds, wallet shows a possible swap, address trades perps |
| **Steps** | What | fetch market data, check a condition, write an AI summary, prepare or place a trade |
| **Delivery** | Notify | in-app, Telegram, Discord, Slack, email, other connected channels |

The engine splits work by nature: **precise comparisons run as plain calculations** (fast, exact,
free); **judgement work goes to the model** (credits). A price threshold is never decided by an LLM.
That single rule prevents most automation failures and most wasted credits.

### The four use-case families

1. **Scheduled briefs and reports** — morning market brief, daily P&L report, weekly macro summary,
   reminders.
2. **Price alerts** — "tell me when BTC breaks $120k", "alert me while ETH is below $3k". Cross vs hold.
3. **Wallet and trader monitoring** — a watched wallet swaps, or a Hyperliquid/Lighter trader opens a
   position.
4. **Automated trading plans** — recurring buys, laddered orders, mirroring a wallet.

### Automated trading plans, and the permission ladder

Templates: **recurring buy** (buy more when low, less when high), **ladder buy/sell** (staggered
orders across a range), **mirror a wallet** (fixed size per trade, daily spending cap).

Guardrails, in their words:

- **It asks before it builds** — confirms asset, wallet, size, leverage, limits before saving a plan
  that can trade.
- **Trades wait for you by default** — the run pauses at "Waiting for your approval".
- **Test never trades** — a dry run that shows what the plan would do.
- **Execution permissions** — every mode except **Hands-off** still asks to confirm money moves.

That is a four-level permission ladder (Test → Confirm every trade → Confirm per plan → Hands-off) and
it is the most copyable idea in the whole automation product. Rook's equivalent is simpler because
nothing is real: paper fills only. But Rook should still show the ladder, because the *user's* mental
model of "how much rope am I giving this thing" is the thing being trained.

Note the honest limitation they publish: Automations are desktop-only. The web app links to the
download. A capability that needs the user's machine is local, not hidden.

## Strategy Studio

- Location: `/app/trade/strategy-studio`. Also marketed at `strategy.minara.ai`.
- Language: **Pine Runtime**, Minara's TypeScript DSL (not Pine Script; the name is a nod to it).
- Two strategy classes:
  - **Time-series** — one asset, signals on its own price. Entry/exit logic, optional indicators.
  - **Cross-sectional** — rank a universe by factor, go long the top / short the bottom, rebalance.
- Lifecycle: describe → generated code → read it → backtest → read metrics → optimise → **paper** →
  deploy. Refinement happens **through chat**, not by hand-editing code.
- Deployment: a deployed strategy executes automatically, opening and closing positions per its code.

### The prompt contract for strategy generation

The Academy teaches that a good strategy prompt specifies four things: **asset, timeframe, entry
condition, exit condition**. Their canonical example:

> Go long BTC on the 1-hour chart when the 9-EMA crosses above the 21-EMA. Exit when RSI exceeds 70 or
> price drops 3% from entry.

And the caveat they publish prominently: *"Generated code is a starting point. Read it before
backtesting, and validate in paper trading before you deploy real capital."*

Rook's Vela work (specs 002/003) is the same idea with a different chart engine and no code
generation. The prompt contract — asset, timeframe, entry, exit — is directly reusable as the input
schema for a Rook "describe a setup" feature.

### Backtesting and metrics

Backtest takes an asset and a date range, returns metrics, an equity curve, a performance summary,
and a trade list. Optimisation runs parameter sweeps (time-series) or factor combinations
(cross-sectional). The Academy has dedicated pages for *reading the metrics* and *reading
backtest metrics* — again, the docs anticipate the confusion rather than explaining after the fact.

## Strategy Market (the marketplace)

Six documented flows: **discover**, **compare top strategies**, **evaluate a strategy**, **run a
strategy**, **publish and manage**, **creators and profiles**. Creators get visibility settings,
subscribers, and earnings (`academy/manage-your-strategies/visibility-subscribers-and-earnings.md`).

This is the supply-side flywheel: the platform does not need to author strategies, it needs a place
where authors are incentivised to. Rook is nowhere near this and should not pretend otherwise — but a
read-only "published desk runs" page is a cheap precursor.

## Autopilot and the Sharpe Guard

Autopilot executes strategy/Copilot signals unattended. **Sharpe Guard** is their risk overlay, and
their own FAQ documents the two behaviours users complain about, by design:

- **Large allocation on high confidence** — "by default, Sharpe Guard may deploy a large portion of
  available capital when signal confidence is high". The documented fix is the **Max position size**
  parameter, not a code change.
- **Longs only during an uptrend** — direction is regime-dependent; it refuses shorts in a sustained
  uptrend on purpose, "to prevent trading against momentum".

That second one is a genuinely interesting design position: a strategy that *declines* to take a valid
signal because of regime. Rook's desk already refuses trades (rule-based, journaled) — the same idea,
different mechanism. Rook's refusals are its Sharpe Guard, and they are already the most distinctive
thing in the repo.

## Where the two products meet the API

Automations can call the model (credits) but the *condition* logic runs on their backend. The Agent
API exposes the model side only. So a third-party automation has to reimplement triggers. That is a
gap in their offering and an opportunity for Rook: a paper desk with an explicit, documented trigger
schema and a local-only execution path is a *simpler* thing to integrate against.

## Numbers to keep

- 4 trigger families, 3 delivery plus in-app, 4 permission levels.
- 2 strategy classes, 2 optimisation modes (parameters, factors).
- 6 marketplace flows, 3 creator-monetisation concepts (visibility, subscribers, earnings).
- 2 live benchmark strategies: MINARA V2 (BTC perps, trend) and MINARA V1 (SILVER perps), real capital.
