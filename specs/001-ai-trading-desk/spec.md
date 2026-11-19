# Feature Specification: AI Trading Desk

**Feature Branch**: `001-ai-trading-desk`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "Change the AI study assistant template into an AI trading app with different features and tools, planned from the AI trading library (agent team + risk gate), the CoTrader 7-agent guide, the day-trader-skill repository and the claude-trading-skills repository."

**Working name**: "Desk" (placeholder; final brand goes in `src/content.ts`).

## Product framing

A supervised AI trading desk for intraday US-equity traders. Nine seats look at one
setup — analyst, news, setup rules, bull, bear, risk manager, trader, decider, chief
— and produce a one-page decision memo. The risk manager is plain code: it can say
no, and no other seat can overrule it. Paper trading is the only execution path.

The product is a process tool, not a signal service. It never says what to buy.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See today's desk (Priority: P1)

A trader opens the app before the session and sees one screen: the session window
and its state, a small watchlist of setups that fired on seeded 5-minute bars, the
regime label, any news blackout window, and yesterday's count of blocked trades.
Each row shows symbol, setup name, trigger time, entry, stop, target and R multiple.

**Why this priority**: without a desk view there is nothing to arbitrate; it is the
surface every other story hangs off, and it alone replaces the template's Library
screen with something a trader recognises.

**Independent Test**: open `/app` with no network and no prior localStorage; the
seeded watchlist renders with source labels, and the empty/expired states appear
when a seed row is deleted.

**Acceptance Scenarios**:

1. **Given** seeded fixtures and no stored state, **When** the user opens `/app`,
   **Then** at least three setups appear with symbol, setup name, entry, stop,
   target, R multiple and a `SAMPLE DATA` label.
2. **Given** the user filters to one setup family, **When** the filter changes,
   **Then** only matching rows remain and the count updates.
3. **Given** a setup whose entry window has closed, **When** the row is shown,
   **Then** it reads `expired` and cannot be sent to the room.

---

### User Story 2 - Gate a trade with hard limits (Priority: P1)

A trader sets account size, max risk per trade, daily loss limit, position cap, max
trades per day, minimum reward-to-risk and the entry window. They paste or select a
plan (entry, stop, target); the gate returns APPROVED with an exact share count, or
BLOCKED with the single rule that failed. The screen shows which limit decided the
size and the maximum loss at the stop in dollars.

**Why this priority**: this is the product's differentiator and the only place money
math is decided. It is also fully testable with no other screen built.

**Independent Test**: run the gate on the seeded example from
`contracts/risk-engine.md` and get six shares approved at a 2R target, and a block
on `R-12 reward:risk` at a 1R target.

**Acceptance Scenarios**:

1. **Given** limits of $5,000 equity, 1% risk, 50% position cap, min RR 1.5,
   **When** a long at 364.18 with stop 358.32 and target 375.90 is checked,
   **Then** the verdict is APPROVED with 6 shares, loss at stop $35.16, size
   decided by `position-cap`.
2. **Given** the same plan with target 370.04, **When** it is checked, **Then** the
   verdict is BLOCKED with rule `R-12` and the message states the RR is 1.00 against
   a 1.50 minimum.
3. **Given** the kill switch is on, **When** any plan is checked, **Then** the
   verdict is BLOCKED with `R-01` regardless of other inputs.
4. **Given** the day's loss already exceeds the daily limit, **When** a plan is
   checked, **Then** the verdict is BLOCKED with `R-04` and no size is returned.

---

### User Story 3 - Run the room and read the memo (Priority: P2)

A trader sends a setup to the room. Eight seats produce fixed-format notes in
sequence (analyst, news, setup, bull, bear, trader, decider), the risk gate returns
its verdict inline, and the chief writes a one-paragraph summary. The result is a
memo with a 1–5 rubric score and a TAKE / PASS verdict that the gate can veto.

**Why this priority**: it is the story the sources are really about, but it is only
credible once the gate (US2) exists, so it follows it.

**Independent Test**: send the seeded TSLA-style setup to the room; every seat card
renders, the risk verdict matches US2's answer, the memo scores 3/5 and reads PASS
because the gate blocked, and the blocked reason appears in the memo.

**Acceptance Scenarios**:

1. **Given** a gated plan that was BLOCKED, **When** the room runs, **Then** the
   decider's verdict is PASS and the memo names the blocking rule.
2. **Given** a gated plan that was APPROVED, **When** the room runs, **Then** the
   memo scores between 3 and 5 and offers a paper ticket, never a live one.
3. **Given** a seat fails (provider missing, malformed packet), **When** the room
   runs, **Then** the run halts at that seat with a visible reason and no memo is
   produced.

---

### User Story 4 - Look before risking: Time Machine (Priority: P3)

A trader opens a setup and runs the Time Machine: 10,000 seeded replays of the rest
of the session from that symbol's own 5-minute bars, plus a re-run of the same rule
over every past session in the fixture. It reports target-first, stop-first and
neither-by-close probabilities, average R, sample size and one honest verdict line.

**Why this priority**: the most distinctive tool in the source repositories, but it
is an amplifier — it needs the desk and the plan first.

**Independent Test**: run it twice with the same seed and get identical
probabilities; change the seed and see them move within the reported range.

**Acceptance Scenarios**:

1. **Given** the seeded fixture, **When** the simulation runs with seed 19,
   **Then** the same three probabilities are produced on every run, summing to 100%
   within rounding.
2. **Given** fewer than 20 historical occurrences, **When** the result renders,
   **Then** it is labelled `too early to conclude` and no verdict is asserted.

---

### User Story 5 - Journal the decision, including the blocked ones (Priority: P3)

Every gate verdict and room memo is written to a local journal with a fixed set of
columns. The trader reviews the week: rule breaks, blocked trades, taken trades,
R result and one suggested change. Rows can be exported as CSV.

**Why this priority**: the sources call the journal the memory of the system, but it
is only populated once the gate and room exist.

**Independent Test**: block one plan and approve another, then open the journal and
see two rows, one with a result of `not taken` and the blocking rule recorded.

**Acceptance Scenarios**:

1. **Given** two verdicts in a session, **When** the journal opens, **Then** both
   rows exist with timestamp, symbol, setup, gate rule, verdict and R.
2. **Given** seven or more rows in a week, **When** the weekly review runs,
   **Then** it lists rule breaks, blocked count and a single suggested change.
3. **Given** the user exports, **When** the CSV is opened, **Then** the header row
   matches the documented journal columns exactly.

---

### Edge Cases

- Market closed, pre-market or late in the session: the desk shows the session
  state and disables ticketing; nothing styles itself as an entry opportunity.
- Data feed unavailable in live mode: fall back to labelled sample data and show
  the last fetch time, never a silent partial screen.
- A user types a stop above the entry, a target below it, or a zero-width stop:
  the gate blocks with a specific rule, not a generic error.
- Equity below the minimum size (one share costs more than the cash buffer allows):
  block with `R-11` and explain the arithmetic in words.
- Duplicate symbol ticket in the same session: block with `R-13`.
- Seeded symbol missing from the universe: the setup row hides and a single notice
  explains why.
- localStorage from a previous demo version: migrate or reset under a new version
  key, never render half-parsed state.
- Very large account or absurd limits: clamp to documented maxima and show the
  clamped value.
- A user opens `/app/setup/:symbol` for an unknown symbol: 404-style empty state
  with a route back to the desk.

## Requirements *(mandatory)*

### Functional Requirements

**Brand and shell**

- **FR-001**: The marketing site MUST be re-written for the trading desk, reusing
  the existing sections, with brand, tagline, nav, plans, FAQ, testimonials and
  footer sourced from `src/content.ts`.
- **FR-002**: The site MUST NOT claim returns, win rates, accuracy or profitability,
  and MUST NOT describe the product as a signal service.
- **FR-003**: Every app screen MUST show an educational / not-financial-advice
  notice, and a data-source badge (`SAMPLE DATA` or `LIVE · delayed`).

**Today's desk**

- **FR-004**: `/app` MUST list seeded setups with symbol, setup family, trigger
  time (New York), entry, stop, target, R multiple and status
  (`triggered` | `waiting` | `expired`).
- **FR-005**: Users MUST be able to filter by setup family and search by symbol.
- **FR-006**: `/app` MUST show session state (pre-market, open, closing window,
  closed), a regime label, and any calendar blackout window.
- **FR-007**: `/app` MUST show today's counts: verdicts checked, blocked, taken,
  and the remaining daily risk budget in dollars.

**Setup detail**

- **FR-008**: `/app/setup/:symbol` MUST show the seeded 5-minute bars for that
  symbol with the opening range, entry trigger, stop and target marked.
- **FR-009**: The detail view MUST show the plan's R multiple and the Time Machine
  entry point.
- **FR-010**: The detail view MUST NOT label any level as a recommendation; it
  shows the user's rules evaluated on the chart.

**Risk gate**

- **FR-011**: Users MUST be able to edit and persist limits: equity, risk per trade
  (percent), daily loss limit (percent), position cap (percent), max trades per day,
  minimum R:R, cash buffer (percent) and entry window.
- **FR-012**: The gate MUST evaluate the full rule set in a documented order and
  return the first failing rule with a human-readable reason.
- **FR-013**: The gate MUST return an integer share count, the loss at stop in
  dollars, the reward-to-risk achieved and the name of the limit that set the size.
- **FR-014**: The gate MUST be deterministic and identical in browser and Worker.
- **FR-015**: The gate MUST refuse any plan with no stop.
- **FR-016**: A kill switch MUST block all new tickets until explicitly reset, and
  the state MUST be visible wherever a ticket can be created.
- **FR-017**: Users MUST be able to copy a blocked reason and see the full rule
  table the gate used.

**The room**

- **FR-018**: The room MUST run seats in a fixed order and render each seat's note
  in a fixed format with the seat's role, verdict and one-line reason.
- **FR-019**: The room MUST include the gate's verdict and MUST NOT produce a TAKE
  memo when the gate blocked.
- **FR-020**: The memo MUST contain direction, entry, stop, target, size, max loss,
  rubric score 1–5, verdict and the strongest counter-case.
- **FR-021**: A failed seat MUST halt the run with a visible reason and no memo.

**Time Machine**

- **FR-022**: The simulation MUST be seeded, reproducible and computed from the
  symbol's own 5-minute bars, resampled by time-of-day bucket.
- **FR-023**: Results MUST report target-first, stop-first, neither-by-close,
  average R, sample size and the number of historical occurrences.
- **FR-024**: Under 20 historical occurrences the result MUST be labelled
  inconclusive and MUST NOT assert an edge.

**Journal**

- **FR-025**: Every gate verdict and memo MUST append a journal row with a fixed
  column set.
- **FR-026**: The journal MUST distinguish taken, blocked and not-taken decisions.
- **FR-027**: The weekly review MUST summarise rule breaks, blocked count and one
  suggested change, and MUST say when the sample is too small to conclude anything.
- **FR-028**: Journal export MUST produce CSV with the documented header.

**Paper orders**

- **FR-029**: An approved plan MUST be convertible into a bracket paper ticket
  showing entry, stop, target, size and maximum loss.
- **FR-030**: Submitting a paper ticket MUST require an explicit confirmation that
  echoes the exact numbers, and MUST be recorded in the journal.
- **FR-031**: Paper fills MUST be simulated against the fixture bars; no external
  broker call is made in v1.

**Data and plumbing**

- **FR-032**: All market-data access MUST go through the Worker, with documented
  caching and provenance, and the app MUST run fully offline on seeded fixtures.
- **FR-033**: The Worker MUST expose the endpoints in `contracts/worker-api.md` and
  reject malformed input with the documented status codes.
- **FR-034**: The app MUST reuse the existing router, tokens and component library,
  and MUST keep `bun run typecheck` and `bun run build` passing.

### Key Entities

- **Instrument**: a tradable symbol with name, exchange, sector and the fixture set
  it belongs to.
- **Bar**: one 5-minute candle (symbol, session date, start time, open, high, low,
  close, volume, provenance).
- **Setup**: a named rule evaluated on bars, producing direction, trigger time,
  entry, stop, target and status.
- **RiskLimits**: the trader's written limits (equity and the percentages above).
- **TradePlan**: direction, symbol, entry, stop, target, risk per share, R multiple,
  source setup and status.
- **GateVerdict**: APPROVED or BLOCKED, rule id, reason, size, loss at stop, RR,
  deciding limit, timestamp.
- **SeatNote**: role, verdict, reason, one or more evidence lines, provenance.
- **Memo**: the decision record — plan, gate verdict, seat notes, rubric score,
  TAKE/PASS, counter-case, created time.
- **SimResult**: seeded probabilities, average R, sample size, seed, verdict line.
- **JournalRow**: timestamp, symbol, setup, gate rule, verdict, taken flag, R,
  note, memo id.
- **Account**: equity, day P&L, trades taken today, risk used today, kill switch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the network disabled, all six app screens render from fixtures,
  and every figure shows a source badge; zero unlabelled numbers appear.
- **SC-002**: The gate explains a blocked trade with a rule id and a human sentence
  in 100% of the documented edge cases in `contracts/risk-engine.md`.
- **SC-003**: The same plan and limits produce byte-identical verdicts in the
  browser and through the Worker, verified by a shared unit-test table.
- **SC-004**: A new user can go from the landing page to a blocked trade with a
  reason in under 90 seconds, with no signup and no keys.
- **SC-005**: The Time Machine returns identical results for the same seed across
  reloads, and its three probabilities sum to 100% ± 0.2.
- **SC-006**: Every memo produced by the room includes a gate verdict and a
  counter-case; no memo exists with a TAKE verdict after a block.
- **SC-007**: `bun run typecheck`, `bun run build` and `bun test` pass on a clean
  checkout with dependencies installed from the lockfile.
- **SC-008**: No secret, key or brokerage credential appears anywhere in the
  repository or in client-side bundles.

## Assumptions

- **Audience**: intraday US-equity day traders (the `day-trader-skill` model).
  Swing/portfolio features from `claude-trading-skills` are explicitly deferred.
- **Execution**: paper only in v1. No broker integration, no live order routing, no
  OAuth to a brokerage.
- **Data**: v1 ships seeded fixtures for a handful of instruments (a session of
  5-minute bars each). Live public data (Yahoo chart JSON / Stooq CSV, SEC EDGAR
  for filings) is a Worker-side upgrade, optional, and never required for the demo.
- **Accounts**: the demo login stays as-is (validated by the Worker, session in
  localStorage). Journal and limits are per-browser, not per-account.
- **Narrative**: agent seat text is scripted from the packet in v1. A model call is
  a later, optional addition behind the Worker, never in the browser.
- **Copy provenance**: the method and algorithms are adapted from MIT-licensed
  repositories; the library and CoTrader guides are used as specifications, not
  copied as interface copy.
- **Scope boundary**: no options, futures, crypto, shorting, tax, backtesting of
  arbitrary user strategies, mobile app or multi-user teams.

## Out of Scope (v1)

Live trading, brokerage connections, short selling, options, futures, crypto,
portfolio/dividend workflows, real-time streaming quotes, social features, billing,
AI model calls with user keys, and any performance claim.
