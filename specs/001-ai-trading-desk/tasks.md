---

description: "Task list for the AI Trading Desk feature"
---

# Tasks: AI Trading Desk

**Input**: Design documents from `specs/001-ai-trading-desk/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included only where the constitution requires them — the deterministic
risk, sizing, simulation and CSV modules. No UI test framework is added.

**Organization**: Tasks are grouped by user story so each is demoable on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency)
- **[Story]**: US1–US5 from `spec.md`

## Path Conventions

Single Vite project: `src/` at repository root. All paths below are repo-relative.

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: prepare the template for adaptation without changing behaviour yet.

- [x] T001 Create `src/shared/market.ts` with `Instrument`, `Bar`, `Quote`, `Provenance` types from `data-model.md`
- [x] T002 [P] Seed the instrument universe (`TSLA`, `NVDA`, `AAPL`, `AMD`, `MSFT`, `SPY`, `QQQ`, `META`) in `src/shared/market.ts` with clearly fictional reference prices
- [x] T003 [P] Generate and check in one session of 78 five-minute bars per symbol under `src/shared/fixtures/` (JSON, integer cents, ET session date 2026-11-19)
- [x] T004 [P] Add `src/shared/time.ts`: ET session clock, holidays/early closes 2026–2027, `sessionState()`, `inEntryWindow()`, `flatByPassed()` (research D-12)
- [x] T005 Add `"test": "bun test"` to `package.json` scripts and confirm `bun test` runs with zero tests
- [x] T006 [P] Keep `src/lib/storage.ts` as-is and add `desk:v1:*` key constants in `src/lib/desk.ts` (empty slices for now)

**Checkpoint**: fixtures and time helpers exist; the app still renders Cramly.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: pieces every story needs. No user story work starts before this phase.

- [x] T007 [P] Add `Disclaimer` to `src/content.ts` and create `src/components/Disclaimer.tsx` (renders on every `/app` route)
- [x] T008 [P] Create `src/components/SourceBadge.tsx` for `SAMPLE DATA` / `LIVE · delayed` / `USER`
- [x] T009 [P] Create `src/components/Verdict.tsx`: APPROVED/BLOCKED pill + `R-xx` rule chip + reason line
- [x] T010 Create `src/lib/desk.ts`: typed slices for limits, account, journal, memos, tickets, seed; validated reads with defaults (data-model storage keys)
- [x] T011 [P] Extend `src/shared/validate.ts` with `validateSymbol`, `validateLimits`, `validatePlan` returning field-keyed errors
- [x] T012 [P] Create `src/pages/app/AppShell.tsx` nav update: Desk · Room · Gate · Journal · Ask (icons from `lucide-react`)
- [x] T013 [P] Replace `src/components/FileStack.tsx` usage on the hero with `src/components/TradeCard.tsx` (plan card: symbol, entry, stop, target, R, gate status)
- [x] T014 Rewrite `src/App.tsx` routes: `/app`, `/app/setup/:symbol`, `/app/room`, `/app/risk`, `/app/journal`, `/app/chat`; remove Library/Flashcards/Quiz routes
- [x] T015 Delete study-specific modules: `src/shared/packs.ts`, `src/pages/app/{Library,Chat,Flashcards,Quiz,DocPicker,NoDocs}.tsx`, `src/pages/app/useActiveDoc.ts`, `src/components/UploadDialog.tsx`
- [x] T016 [P] Point `src/components/ChatBubble.tsx` at desk language (keep component, change props naming only where needed)

**Checkpoint**: app compiles with the new routes and empty screens; `bun run typecheck` green.

---

## Phase 3: User Story 1 — Today's desk (P1) 🎯 MVP part 1

**Goal**: a trader opens `/app` and sees the session, the watchlist and today's counts.

**Independent Test**: with no network and no stored state, `/app` renders ≥ 3 seeded setups with source badges and no console errors.

- [x] T017 [P] [US1] Implement opening-range + flag + reclaim detection in `src/shared/setups.ts` returning `Setup[]` per `data-model.md`
- [x] T018 [P] [US1] Unit-test `src/shared/setups.ts` against the TSLA fixture (opening range 354.47–362.18, trigger close 364.18, stop 358.32, 2R target 375.90) in `src/shared/setups.test.ts`
- [x] T019 [US1] Create `src/pages/app/Desk.tsx`: header with session state, regime label, blackout window, and `deskCounts` tiles
- [x] T020 [US1] Build the setup table in `Desk.tsx`: symbol, family, trigger time (ET), entry/stop/target, R, status, source badge, row action "Send to room"
- [x] T021 [P] [US1] Add symbol search and family filter with `Segmented` and `Field`
- [x] T022 [P] [US1] Add `src/components/StatTile.tsx` and wire checked/blocked/taken tiles from `desk.ts`
- [x] T023 [US1] Implement `GET /api/desk/scan` in `src/worker/index.ts` using `src/shared/setups.ts`
- [x] T024 [US1] Implement `src/lib/deskApi.ts#scan` with typed response and error mapping; Desk falls back to local computation when the Worker is unavailable
- [x] T025 [US1] Handle empty, expired and unknown-symbol states with `EmptyState` + `Notice`
- [x] T026 [US1] Verify `quickstart.md` V1 (offline demo) and record the result in the PR/commit note

**Checkpoint**: US1 demoable on its own; nothing else built yet.

---

## Phase 4: User Story 2 — Risk gate (P1) 🎯 MVP part 2

**Goal**: hard limits, exact sizing, one blocking rule named.

**Independent Test**: `contracts/risk-engine.md` examples A–F reproduce exactly, in browser and via Worker.

- [x] T027 [P] [US2] Create `src/shared/sizing.ts`: integer-cent helpers, `sizeFor()`, `decidingLimit()`, `rewardRisk()`
- [x] T028 [US2] Implement `src/shared/risk.ts#checkPlan` with rules `R-01`..`R-15` in the documented order
- [x] T029 [US2] Write `src/shared/risk.test.ts`: table-driven, one case per rule plus examples A–F and the six invariants
- [x] T030 [US2] Write `src/shared/sizing.test.ts`: rounding, caps, argmin tie-break, no float drift on repeated sizing
- [x] T031 [US2] Implement `POST /api/risk/check` in `src/worker/index.ts`, stamping `checkedAt` server-side, validating with T011
- [x] T032 [US2] Build `src/pages/app/RiskGate.tsx`: limits editor (equity, risk %, daily %, cap %, buffer %, max trades, min R:R, window, flat-by) persisted to `desk:v1:limits`
- [x] T033 [US2] Build the plan checker form in `RiskGate.tsx` with live verdict preview from `checkPlan` (client-side, same module)
- [x] T034 [US2] Render the verdict panel: size, max loss, R:R, deciding limit, rule table used, copy-reason button
- [x] T035 [US2] Add the kill switch to `AppHeader.tsx` and `RiskGate.tsx` with a visible state in both
- [x] T036 [US2] Block ticketing for any `expired` setup and outside the entry window, with the reason shown
- [x] T037 [US2] Append every verdict to `desk:v1:journal` via `src/shared/journal.ts#appendVerdict`
- [x] T038 [US2] Verify `quickstart.md` V2–V5 and confirm byte-identical verdicts between UI and curl

**Checkpoint**: MVP complete — desk + gate, no room, no simulator.

---

## Phase 5: User Story 3 — The room (P2)

**Goal**: nine seats, one memo, no TAKE after a block.

**Independent Test**: blocked plan produces a PASS memo naming `R-12`; approved plan produces a 3–5 score memo with a paper ticket offer.

- [x] T039 [P] [US3] Create `src/shared/packet.ts`: `buildPacket(plan, limits, account, session, gate, setups, news)` with provenance on every field
- [x] T040 [US3] Implement scripted seat notes in `packet.ts` for the eight roles with 2–4 branches each, fixed format, `packetRef` on every note
- [x] T041 [US3] Implement `POST /api/room/run`: run gate first, halt on a missing packet field with 422, force `PASS` and score ≤ 2 on a block
- [x] T042 [P] [US3] Create `src/components/SeatCard.tsx` (role, verdict, reason, evidence, packet ref)
- [x] T043 [US3] Build `src/pages/app/Room.tsx`: ordered seat list, inline gate card between trader and decider, memo panel with rubric score and counter-case
- [x] T044 [US3] Persist memos to `desk:v1:memos` and show the last memo on `/app`
- [x] T045 [US3] Implement `GET /api/news` with seeded, clearly fictional headlines per symbol
- [x] T046 [US3] Add "Ask the desk" in `src/pages/app/AskDesk.tsx`: answers only from the current packet, cites `packetRef`, refuses questions outside it
- [x] T047 [US3] Verify `quickstart.md` V7

---

## Phase 6: User Story 4 — Time Machine (P3)

**Goal**: reproducible odds before the trade.

**Independent Test**: seed 19 twice → identical percentages; under 20 occurrences → inconclusive label.

- [x] T048 [P] [US4] Implement `mulberry32` + time-of-day bucketed resampling in `src/shared/simulate.ts`
- [x] T049 [US4] Implement the historical re-run of the same rule over fixture sessions in `simulate.ts`
- [x] T050 [US4] Write `src/shared/simulate.test.ts`: determinism, probability sum, under-20 label, clamping of `runs`/`seed`
- [x] T051 [US4] Implement `POST /api/simulate` in `src/worker/index.ts`
- [x] T052 [US4] Create `src/components/BarChart.tsx`: SVG candles, opening-range band, entry/stop/target lines, hover readout, no dependency
- [x] T053 [US4] Build `src/pages/app/Setup.tsx` for `/app/setup/:symbol`: chart + plan + Time Machine panel (seed input, three probabilities, average R, sample size, verdict line)
- [x] T054 [US4] Persist the chosen seed in `desk:v1:seed` and show it with the result
- [x] T055 [US4] Verify `quickstart.md` V6

---

## Phase 7: User Story 5 — Journal, paper ticket, review (P3)

**Goal**: the memory of the system, including blocked trades.

**Independent Test**: one block + one approval → two correctly shaped rows and a CSV with the documented header.

- [x] T056 [P] [US5] Implement `src/shared/journal.ts`: row schema, `appendVerdict`, `weekSummary`, `toCsv` with escaping
- [x] T057 [US5] Write `src/shared/journal.test.ts`: header order, CSV quoting/escaping, small-sample flag
- [x] T058 [US5] Build `src/pages/app/Journal.tsx`: table with the fixed columns, filters (taken/blocked/all), copy reason, export CSV
- [x] T059 [US5] Add the weekly review panel: rule breaks, blocked count, taken count, sum R, one suggested change, "sample too small" when < 10 rows
- [x] T060 [US5] Implement the paper ticket flow: `PaperTicket` state machine in `src/lib/desk.ts`, confirmation dialog echoing all five numbers, `maxLossCents` asserted against the gate
- [x] T061 [US5] Simulate fills against later fixture bars (touch of entry → filled) and record `r_result` on close against stop/target
- [x] T062 [US5] Wire the kill switch to cancel `proposed`/`confirmed` tickets and block new ones
- [x] T063 [US5] Verify `quickstart.md` V8

---

## Phase 8: Polish & cross-cutting

- [x] T064 [P] Rewrite `src/content.ts`: brand, tagline, nav, hero, features (desk, gate, room, time machine), how-it-works, stats (checks/rules/seats), plans, FAQ, about, footer — no performance claims
- [x] T065 [P] Update `src/sections/*` copy and imagery: hero uses `TradeCard`; replace the seven `public/images/*.webp` study assets with desk art
- [x] T066 [P] Update `src/pages/{Home,Pricing,About,Login,Signup}.tsx` for the new copy; keep auth behaviour unchanged
- [x] T067 Extend `src/pages/Styleguide.tsx` with `Verdict`, `SeatCard`, `BarChart`, `StatTile`, `SourceBadge`, `Disclaimer` in every state
- [x] T068 [P] Add table/candle/chip styles to `src/styles.css` using existing tokens only
- [x] T069 Add a 404-style empty state for `/app/setup/:symbol` with an unknown symbol
- [x] T070 [P] Update `README.md` routes and Worker table to match the desk; keep run commands accurate
- [x] T071 Run `bun run typecheck`, `bun test`, `bun run build`; fix all failures
- [x] T072 Grep the built bundle for secrets and provider URLs reachable from the client; fix any leak
- [x] T073 Walk `quickstart.md` V1–V9 end to end on the preview and record results, including anything not checked

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** → all stories.
- **US1 and US2** are both P1; US2 depends on US1 only for the setup data it gates.
  Build US1's fixtures and `setups.ts` first, then the gate.
- **US3** depends on US2 (needs `GateVerdict`) and on US1 (needs a plan).
- **US4** depends on US1 (bars) and US2 (plan levels). Independent of US3.
- **US5** depends on US2 (verdicts) and US3 (memo id); the paper-ticket part also
  uses US4's bars for fills.
- **Polish** last, except T064–T065 (copy/imagery), which can start any time after
  the route map is fixed.

### Parallel opportunities

- T002–T004, T007–T009, T011–T013, T017–T018, T021–T022, T027, T039/T042, T048,
  T056, T064–T065, T068, T070 are safe to run concurrently (different files).
- Do not parallelise T014/T015 (route and delete churn) with page work.

## MVP boundary

Phases 1–4 deliver: seeded desk, deterministic gate, persisted journal of verdicts.
That is demoable and valuable with no room, no simulator and no live data.

---

## Deviations from this task list, as built

- **T003** — fixtures are TypeScript (`src/shared/fixtures.ts`, seeded PRNG), not
  JSON under `src/shared/fixtures/`. Deterministic without a JSON loader, and the
  same module feeds the browser, the Worker and the tests.
- **T024** — there is no `src/lib/deskApi.ts`. The desk screens compute locally
  from the shared modules; only the room, the gate check and the simulator call
  the Worker, and each falls back to the same local code when the fetch fails.
- **T035** — the kill switch lives in the app shell (sidebar and mobile bar) and
  in the gate, not in `AppHeader`. One control reachable from every screen was
  the requirement; `AppHeader` stays presentational.
- **T060** — the ticket state machine is `src/shared/ticket.ts` (pure and tested),
  with the storage calls in `src/lib/desk.ts`, rather than the whole thing in
  `desk.ts`.
