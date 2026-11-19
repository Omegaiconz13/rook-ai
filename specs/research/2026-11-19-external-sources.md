# External source review — 19 Nov 2026

What is worth taking from the sources the user pointed at, what is not, and why.
This is a research note, not a spec. Items 1, 2, 3 and 6 are built; items 4 and
5 are not.

Constitution tests applied to every candidate: paper only · code decides risk ·
every number has provenance · educational, never advice · works offline with zero
keys · smallest diff.

## Sources actually read

| Source | What I read | What I did not |
| --- | --- | --- |
| `x.com/RohOnChain` | Profile header; several posts and long-form articles via search extracts | The timeline itself (X requires login; posts are loaded by JS) |
| `github.com/roan-maverick` | Full public repo list; `tradingview-indicator-for-ai-agents` README | Pine source, `PACKET_SCHEMA.md`, agent prompt |
| `github.com/LuxAlgo` | Full org repo list; READMEs for `edge-stats`, `prop-firm-sim`, `Vela` | Cloning or running any of them; `trade-journal`, `market-trackers`, `whale-options` READMEs |
| `luxalgo.com` | Licensing page, Library licence, `llms.txt`, PineTS developer docs | The platform itself (needs a paid TradingView account) |

## Reading of the two sources

**RohOnChain** is a distribution-first account: every post is a "this is
DANGEROUS / wins almost every trade" hook wrapped around a new model release,
with an affiliate CTA (AgenKit, `nace-mcp`, API keys) and headline accuracy
figures ("85.7% on finance") that carry no sample size. That is the opposite of
what this project promises, and none of the architecture (on-chain HFT,
prediction markets, 50-signal stacking scored by a paid API) fits a paper
intraday equity desk.

One artefact is genuinely good: **AI Agent Lens**, the MIT Pine indicator whose
whole premise is that an agent cannot trade colours — so every closed candle
becomes one structured JSON packet. That is the same problem `src/shared/packet.ts`
already solves, and its field list is a better checklist than ours.

**LuxAlgo** is the opposite kind of source: open-source engines with licences
and explicit non-goals. Three of them matter, one is a licensing trap, and two
are out of scope by constitution.

## Verdict table

| Candidate | Licence | Fit | Verdict |
| --- | --- | --- | --- |
| AI Agent Lens packet schema (ideas only) | MIT | High | **Take the schema**, not the Pine |
| `edge-stats` statistical envelope | MIT | High | **Reimplement the envelope** in `src/shared/stats.ts`; do not vendor the engine |
| `prop-firm-sim` assumption flags + block bootstrap | MIT | High | **Take both ideas** |
| `trade-journal` calendar/expectancy views | MIT | Medium | Take the calendar idea |
| `market-trackers` + `-data` | MIT / CC0 | Medium | Vendor a small CC0 snapshot for the news seat — only if the news seat must become real |
| `Vela` | Apache-2.0 **+ attribution watermark** | Low | **No.** One chart does not justify a WebGL2 charting dependency and a permanent watermark |
| `PineTS`, `Vela-pinets` | **AGPL-3.0** | None | **No.** Copyleft would reach the whole app |
| LuxAlgo platform: Price Action Concepts®, Signals & Overlays®, Oscillator Matrix®, screeners, AI backtesters | CC BY-NC-SA 4.0 (free Library); paid invite-only TradingView scripts | Medium as vocabulary | **No as code.** No signal API, no exportable source, share-alike would reach our files; take the concepts as written rules |
| `trade-relay`, `broker-sdk` | MIT | None | **No.** Live execution is forbidden by the constitution |
| `whale-options` | MIT | None | **No.** Options flow is outside a long-only equity desk |
| Kronos / next-candle prediction threads | — | None | **No.** A "predicts the next candle" claim with no sample size is the exact thing the constitution forbids |
| Any paid scoring API (Drex, AgenKit) | — | None | **No.** Breaks the zero-key offline demo |

## The LuxAlgo platform itself

The GitHub org is only the open-source edge of the product. The platform is
invite-only Pine Script on TradingView, sold per seat, with its own screeners
and backtester. Three things follow from the terms pages:

- **No signal API.** The values exist as plots on their chart, not as a document
  a Worker can fetch. There is nothing in this app to call.
- **The Library is CC BY-NC-SA 4.0.** Free to read, not free to embed:
  non-commercial *and* share-alike, so a port would put that licence on our
  files. Paid toolkits keep their source protected; even their own Quant agent
  may change inputs but not read the code.
- **The runtimes are the licensing trap.** `PineTS` is AGPL-3.0 or a paid seat;
  `Vela`'s watermark-free build is proprietary and the Apache-2.0 core is the
  part we do not need.

The vocabulary is still the most useful thing in the review: order blocks, fair
value gaps, structure breaks, sweeps. We take those as written rules on our own
bars, with our own numbers, and none of their code.

## What is actually worth building

### 1. A real statistics envelope — `src/shared/stats.ts`

Today the journal says "sample too small: 1 of 10 rows". That is a guess with a
constant in it. `edge-stats` shows the honest version, and it is small enough to
own outright: every percentage ships with its N and a **Wilson 95% interval**,
nothing is reported below 10 samples, a warning appears below 30, and the sample
is split in half to see whether the halves agree.

Deliverable: pure module + tests; Journal tiles and weekly review read from it.
Every number in the UI then has a sample size attached, which is what
"every number has provenance" was supposed to mean.

Effort: ~half a day. Risk: none — no dependency, no network.

### 2. Packet v2 — candle anatomy and a factor-scored confluence — built

Borrow AI Agent Lens's field list where ours is thin: body/wicks, close position
in range, range vs ATR, gap, pattern name, the last five bars as a sequence, and
a 0–100 score built from five named factors with the points shown per factor.

The good methodological point in the "50 signals" thread is not the 50 signals —
it is that ten trend signals are one opinion, not ten votes. If we show a
confluence score, each family contributes once, and the seat card shows the
contributions so a reader can see the arithmetic.

What shipped: `packet.reading` describes the last candle in words (body,
wicks, close position in the range, range against ATR14, session gap, pattern
name, the last five closes), and the analyst seat cites it. The memo now
carries `factors` — four named weights, five points: gate 2, reward:risk 1,
calendar 1, setup 1 — and the memo card prints each factor's points and reason,
so the score is arithmetic a reader can check. The scale stayed 1–5 rather than
0–100: it is the scale the gate tests and the seat copy already use, and
re-scaling it would change the contract without adding information.

Effort: ~1 day including tests. Risk: low; packet is already the contract
between the Worker and the seats.

### 3. Assumptions echoed with every simulated number — built

`prop-firm-sim` prints `assumptions.flags` inside every result rather than in a
footnote. Our replay has the same unmodelled pieces: no slippage, no partial
fills, a stop and a target in the same bar resolved stop-first, flat at the last
close. Today that lives in prose in the README. It should be attached to the
result the user is looking at.

What shipped: `SIM_ASSUMPTIONS` travels inside every `SimResult` and is printed
under the Time Machine numbers as "Assumptions behind these numbers" — no
slippage, no partial fills, stop-first on a bar that spans both levels, flat at
the last close, and per-bucket draws that kill streaks.

Effort: ~2 hours. Risk: none.

### 4. Open a statistic and see the sessions behind it — built

`edge-stats` lets you drill from "gap filled 80% (N=30)" into the actual session,
with the bars and the levels drawn. We have the bars (`pastSessionsFor`) and a
chart component, so the equivalent is: click a setup's hit rate, get the matching
sessions, open one on `BarChart` with entry/stop/target drawn.

This is the highest-value item on the list and the most work — a route, a filter,
and a level-drawing mode on the chart.

What shipped: `occurrencesFor(symbol, family)` returns every past trigger with
its date, levels and outcome, and the Time Machine count is now declared from
that same list rather than computed separately — the statistic and the evidence
cannot drift apart. The setup page lists the sessions, and each one opens at
`/app/session/:symbol/:date?family=…` on the existing `BarChart` with that
morning's entry, stop, target and range drawn. No chart component change was
needed: it already took levels as props.

Effort: ~1.5 days. Risk: medium; touches the chart component.

### 5. Block bootstrap in the Time Machine — built

Currently `simulate.ts` draws returns parametrically per time-of-day bucket.
`prop-firm-sim` resamples real R-multiples in blocks so streaks survive, and
shows that with tight loss limits the i.i.d. assumption flatters you. We can run
both and show the gap: parametric vs bootstrap. That is a better lesson than
either number alone.

What shipped: `simulate.ts` runs a second pass that lifts 15-bar blocks out of
the past sessions, started at a random offset, and reports the same four
numbers. On the worked TSLA plan the per-bar line says target first 1.1% and
stop first 18.4%, while the block line says 3.6% and 32.3% — the i.i.d. draw
was flattering the plan, which is the lesson. The result carries both.

Effort: ~half a day. Risk: low.

### 6. Gap retest — built

A fourth setup family (`fvg`) in `src/shared/setups.ts`, in the same shape as
the other three: a three-bar imbalance at least five basis points wide, entered
on the first close back above the top of the gap after price wicks into it,
stopped at the far side of the gap, targeted at 2R. It exists because the
price-action vocabulary is worth having as a rule, and because the gate can
compare four families on the same levels. No Pine, no vendor code, no new
dependency; the definition is pinned in code because a concept with a free
parameter is taste, not a rule.

## Suggested order

1. `stats.ts` + journal wiring (1)
2. assumptions block on the replay result (3)
3. packet v2 with factor contributions (2)
4. block bootstrap (5)
5. drill-down sessions (4)
6. CC0 news snapshot (only if the news seat needs to stop being fixture prose)

Items 1–3 are independent, offline, and each is a day or less. Item 4 is the one
that changes how the product feels.

## Non-goals this review confirms

- No charting dependency. `Vela` is impressive and wrong for a one-chart demo;
  the watermark requirement alone would put someone else's brand on the desk.
- No Pine runtime, no AGPL anywhere in the bundle, and no LuxAlgo Library
  script: CC BY-NC-SA would reach our files through share-alike.
- No broker, no relay, no live order path — not even read-only history import in
  this phase.
- No hosted model or paid scoring API in the demo path.
- No accuracy headline without N, ever. That rule is why most of the source
  material here is unusable.
