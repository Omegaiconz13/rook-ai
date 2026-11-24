# Data Model: AI Trading Desk

All money is stored in integer cents. All times are ISO-8601 UTC strings in storage
and rendered in `America/New_York`. Every numeric field that reaches the UI carries
a provenance value.

```ts
type Provenance = 'seed' | 'live' | 'user' | 'fallback'
type Side = 'long'   // v1 is long-only
```

## Instrument

A tradable US-equity symbol present in the fixture set.

| Field | Type | Rules |
|---|---|---|
| symbol | string | 1–5 uppercase letters; unique; `/^[A-Z]{1,5}$/` |
| name | string | 1–80 chars |
| exchange | string | NASDAQ / NYSE / AMEX |
| sector | string | free text, used for grouping |
| fixture | string | id of the bar fixture; must exist |
| avgVolume | number | integer shares, used for liquidity note |
| provenance | Provenance | `seed` in v1 |

Seeded set (v1): `TSLA`, `NVDA`, `AAPL`, `AMD`, `MSFT`, `SPY`, `QQQ`, `META`.
Fictional prices for every symbol except where the fixture is labelled `sample`.

## Bar

One 5-minute candle.

| Field | Type | Rules |
|---|---|---|
| symbol | string | must be a known instrument |
| sessionDate | string | `YYYY-MM-DD`, a US trading day |
| start | string | ISO UTC; minute % 5 === 0 |
| open/high/low/close | integer cents | `low <= min(open,close)`, `high >= max(open,close)`, all > 0 |
| volume | number | integer ≥ 0 |
| provenance | Provenance | `seed` or `live` |

Uniqueness: `(symbol, start)`. A session is 78 bars (09:30–16:00 ET), 82 with
pre-market.

## Setup

A named rule evaluated on bars. Families in v1: `orb` (opening-range breakout),
`flag` (bull flag), `fvg` (three-bar gap retest), `reclaim` (reclaimed 20-day
average).

| Field | Type | Rules |
|---|---|---|
| id | string | `${symbol}-${sessionDate}-${family}` |
| symbol | string | known instrument |
| family | `orb` | `flag` | `fvg` | `reclaim` |
| direction | Side | `long` |
| triggerAt | string | ISO UTC, inside the entry window |
| entryCents | integer | > 0; equals the triggering bar close for `orb` |
| stopCents | integer | > 0; `< entryCents` |
| targetCents | integer | > entryCents; `= entry + 2 × (entry − stop)` |
| riskPerShareCents | integer | `entry − stop` |
| rMultiple | number | `(target − entry) / riskPerShare`, 2 dp |
| rangeHighCents / rangeLowCents | integer | opening-range bounds (first 15 min) |
| status | `waiting` | `triggered` | `expired` |
| provenance | Provenance | `seed` in v1 |

**State machine**: `waiting → triggered` when a completed bar closes above
`rangeHigh` inside the entry window; `waiting|triggered → expired` when the entry
window ends or the session closes. `expired` is terminal. A setup cannot return to
`waiting`.

## RiskLimits

The trader's written rules. One record per browser.

| Field | Type | Default | Rules |
|---|---|---|---|
| equityCents | integer | 500000 ($5,000) | 100_00 ≤ x ≤ 100_000_000_00 |
| riskPerTradePct | number | 1.0 | 0.1–5.0, one decimal |
| dailyLossPct | number | 3.0 | 0.5–10.0 |
| positionCapPct | number | 50 | 5–100 |
| cashBufferPct | number | 10 | 0–50 |
| maxTradesPerDay | integer | 3 | 1–20 |
| minRewardRisk | number | 1.5 | 0.5–5.0 |
| entryWindowStart | string | `09:35` | `HH:MM`, ET, before end |
| entryWindowEnd | string | `11:30` | `HH:MM`, ET, after start |
| flatBy | string | `15:55` | `HH:MM` ET |

Derived (never stored): `maxRiskCents = round(equity × riskPct / 100)`,
`dailyLossCents = round(equity × dailyPct / 100)`.

Seed default: max risk $50, daily loss $150, position cap $2,500, cash available
$4,500.

## Account

| Field | Type | Rules |
|---|---|---|
| equityCents | integer | mirrors `RiskLimits.equityCents` |
| dayPnlCents | integer | signed; `≤ 0` means a loss |
| tradesToday | integer | ≥ 0; increments on a filled paper ticket |
| riskUsedCents | integer | sum of `size × riskPerShare` for filled tickets today |
| killSwitch | boolean | default `false` |
| sessionDate | string | resets the three counters when the date changes |

## TradePlan

A proposal, not an order.

| Field | Type | Rules |
|---|---|---|
| id | string | uuid |
| symbol | string | known instrument |
| direction | Side | `long` |
| entryCents | integer | > 0 |
| stopCents | integer | > 0, `< entryCents` |
| targetCents | integer | > entryCents |
| riskPerShareCents | integer | `entry − stop`, > 0 |
| rMultiple | number | 2 dp |
| setupId | string | nullable; links to a Setup |
| status | `draft` | `checked` | `approved` | `blocked` | `ticketed` |
| provenance | Provenance | inherits the setup |

**State machine**: `draft → checked` on gate evaluation; `checked → approved` or
`blocked` by the gate only. `approved → ticketed` when the user confirms a paper
ticket. `blocked` is terminal for that plan id; re-checking creates a new id.

## GateVerdict

| Field | Type | Rules |
|---|---|---|
| planId | string | existing plan |
| verdict | `approved` | `blocked` |
| ruleId | string | `R-01`..`R-15`; the first failing rule, or `null` when approved |
| reason | string | one sentence, names the numbers |
| size | integer | null when blocked |
| decidingLimit | `risk-per-trade` | `position-cap` | `cash-buffer` | null when blocked |
| lossAtStopCents | integer | null when blocked |
| rewardRisk | number | 2 dp |
| checkedAt | string | ISO UTC |
| limitsSnapshot | RiskLimits | frozen copy used for the check |

Verdicts are append-only; history is what the journal reads.

## SeatNote

| Field | Type | Rules |
|---|---|---|
| role | `analyst` | `news` | `setup` | `bull` | `bear` | `trader` | `decider` | `chief` |
| verdict | `pass` | `block` | `info` | `deal` deterministically from the packet |
| reason | string | ≤ 220 chars, single sentence |
| evidence | string[] | 1–4 lines, each traceable to a packet field |
| packetRef | string | field path the note cites, e.g. `gate.ruleId` |

Seat order is fixed: analyst → news → setup → bull → bear → trader → decider →
chief. `risk` is not a seat; it is the gate rendered inline between `trader` and
`decider`.

## Memo

| Field | Type | Rules |
|---|---|---|
| id | string | uuid |
| planId | string | existing plan |
| gate | GateVerdict | embedded, not summarised away |
| notes | SeatNote[] | 8 entries in seat order |
| rubricScore | integer | 1–5; `≤ 2` when the gate blocked |
| decision | `TAKE` | `PASS`; `TAKE` needs an approved gate, a score of 3 or more, and no setup veto; must be `PASS` when the gate blocked or the setup seat blocked |
| counterCase | string | the strongest point against, always present |
| createdAt | string | ISO UTC |

The setup seat vetoes a plan whose written setup expired before a trigger
(`setupVeto`). The decider may not outvote it: such a memo can score 3–4 and
still reads `PASS`, and the chief names the setup seat as the stop.

## SimResult

| Field | Type | Rules |
|---|---|---|
| symbol, planId | string | existing |
| seed | integer | 0–2^32−1, shown in UI |
| runs | integer | 10_000 |
| targetFirst / stopFirst / neither | number | percentages, 1 dp, sum 100 ± 0.2 |
| avgR | number | 2 dp |
| historicalOccurrences | integer | ≥ 0 |
| historicalWins / historicalLosses / historicalNeither | integer | sum = occurrences |
| verdictLine | string | one sentence; must include "too early" under 20 occurrences |
| createdAt | string | ISO UTC |

## JournalRow

Fixed columns, exported in this order:

```text
trade_id, date, session, symbol, setup, gate_rule, verdict, took, size,
entry, stop, target, r_planned, r_result, rules_followed, note, memo_id
```

| Column | Type | Rules |
|---|---|---|
| trade_id | string | uuid |
| date | string | `YYYY-MM-DD` (ET session date) |
| session | `pre` | `open` | `close` |
| symbol | string | known instrument |
| setup | string | family or `manual` |
| gate_rule | string | `R-xx` or empty when approved |
| verdict | `APPROVED` | `BLOCKED` | `MANUAL` |
| took | boolean | false for every blocked row |
| size | integer | 0 when blocked |
| entry/stop/target | string | dollars, 2 dp |
| r_planned | number | 2 dp |
| r_result | number | 2 dp; empty until closed; `0` when not taken |
| rules_followed | boolean | user-set on taken rows, `false` on blocked rows |
| note | string | ≤ 280 chars |
| memo_id | string | nullable |
| tags | string[] | ≤ 8 labels, 24 chars each, case-insensitively deduped |
| edited_at | string | ISO UTC; null until the reader changes the row |
| source | `gate` | `manual` |

`tags`, `edited_at` and `source` are stored and exported in the JSON backup but are **not** CSV
columns: the CSV stays the 17 columns above, in that order, so a spreadsheet written against
the old header still reads. `MANUAL` means the reader wrote the row by hand — a trade the gate
never saw — so no report can claim the gate approved it. `source` is `manual` exactly when the
verdict is `MANUAL`.

## DayNote

One note per session date, kept beside the rows rather than inside them.

| Field | Type | Rules |
|---|---|---|
| date | string | `YYYY-MM-DD` (ET session date), unique |
| note | string | ≤ 2,000 chars, trimmed; an empty note is removed |
| updatedAt | string | ISO UTC of the last save |

## JournalBundle

The backup file (`rook-journal-<date>.json`): `{ app: 'rook', kind: 'journal', schema: 2,
exportedAt, rows: JournalRow[], dayNotes: DayNote[] }`. Restoring replaces both lists in this
browser; a bare array of rows is accepted from an older export. Rows from before `schema: 2`
are filled forward on read (`migrateJournal`), never rejected.

Storage keys: rows under `desk:v1:journal` (cap 2,000, newest first), day notes under
`desk:v1:daynotes`.

## PaperTicket

| Field | Type | Rules |
|---|---|---|
| id | string | uuid |
| planId | string | approved plan only |
| symbol, side | string | `long` |
| size | integer | equals the gate's approved size; never larger |
| entryCents / stopCents / targetCents | integer | copied from the plan |
| maxLossCents | integer | `size × (entry − stop)` |
| status | `proposed` | `confirmed` | `filled` | `cancelled` |
| confirmedAt / filledAt | string | null until reached |

**State machine**: `proposed → confirmed` only after the confirmation dialog echoes
entry, stop, target, size and max loss; `confirmed → filled` when a later fixture bar
touches the entry; `confirmed|filled → cancelled` by the kill switch. A ticket can
never be edited after `confirmed` — cancel and create a new one.

## Derivations the UI needs

- `openRiskCents(account, tickets)` = sum of `maxLossCents` for confirmed, unfilled,
  uncancelled tickets.
- `remainingRiskCents` = `dailyLossCents − max(0, −dayPnlCents) − riskUsedCents`.
- `deskCounts(verdicts)` = `{ checked, blocked, taken }` for today's session date.
- `weekSummary(rows)` = rule breaks, blocked count, taken count, sum R, and a
  "sample too small" flag when fewer than 10 rows.

## Storage keys

`desk:v1:limits`, `desk:v1:account`, `desk:v1:journal`, `desk:v1:memos`,
`desk:v1:tickets`, `desk:v1:seed`. Each is validated on read; a failing slice is
reset to its default and a single notice is shown, never a crash.
