# Implementation Plan: AI Trading Desk

**Branch**: `001-ai-trading-desk` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-ai-trading-desk/spec.md`

## Summary

Turn the Cramly study-assistant template into a supervised intraday trading desk.
The marketing shell, design tokens, router, component library and Hono Worker stay.
Everything study-shaped is replaced: `src/shared/packs.ts` becomes market fixtures
and a deterministic risk engine; the four demo app screens become Today's desk, a
setup detail with the Time Machine, the nine-seat room, the risk gate, the journal
and a grounded "ask the desk" panel.

The technical bet is that the demo requires no keys: fixtures ship in the bundle,
all money math is pure TypeScript shared by browser and Worker, agent prose is
scripted from the packet, and live public data is a Worker-only upgrade behind the
same interfaces.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict, `bun run typecheck`)

**Primary Dependencies**: React 19, Vite 8, Hono 4.13, `@cloudflare/vite-plugin`,
Tailwind 4, `motion`, `lucide-react`. No new runtime dependencies planned; charts
are hand-rolled SVG and tests use `bun test`.

**Storage**: browser `localStorage` under a versioned key (`desk:v1:*`) for limits,
account, journal, memos and paper tickets. No server persistence in v1. D1 is the
documented upgrade path, not built now.

**Testing**: `bun test` over `src/shared/*.test.ts` (pure functions only: risk,
sizing, R math, seeded PRNG, CSV). UI verified by hand on the preview; no browser
test framework in v1.

**Target Platform**: Cloudflare Workers + static SPA (existing `wrangler.jsonc`),
served locally by Vite on port 3000 for the chat preview.

**Project Type**: single-project web app (React SPA + Hono Worker in one Vite app).

**Performance Goals**: gate verdict under 5 ms for one plan; Time Machine 10,000
simulations under 400 ms on a laptop; first route paint unaffected (no new large
bundles); `/api/market/*` cached responses under 50 ms at the edge.

**Constraints**: demo fully offline; no secrets in repo or bundle; USD only;
US-equity session times evaluated in `America/New_York`; integer cents for money;
deterministic output for a given seed.

**Scale/Scope**: 6 app routes, ~8 seeded instruments with one session of 5-minute
bars each, 3 setup families, 1 gate rule set, 9 room seats, 1 journal schema.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Evidence |
|---|---|---|---|
| I. Paper Before Live | No code path calls a brokerage; kill switch on every ticketing screen | PASS | FR-029..031, FR-016; `contracts/worker-api.md` has no broker endpoints |
| II. Code Decides, Agents Advise | All money rules in `src/shared/risk.ts`, pure, shared; room cannot override | PASS | FR-012..019; `contracts/risk-engine.md` |
| III. Every Number Has a Source | Provenance on every figure; sample badges; NY timestamps | PASS | FR-003, FR-005, FR-032; `data-model.md` provenance field |
| IV. Educational, Never Advice | No returns/win-rate claims; disclaimer on every app screen | PASS | FR-002, FR-003; copy rules in research.md D-10 |
| V. Offline Demo, Opt-In Live | Fixtures first; Worker-only providers; labelled fallback | PASS | FR-032, SC-001; research.md D-01..D-03 |
| VI. One Design System, Smallest Diff | Reuse tokens/components/router; no new deps | PASS | FR-034; dependency decision in research.md D-04, D-08 |

No violations, so Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-trading-desk/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Entities, validation, state machines
├── quickstart.md        # Runnable validation scenarios
├── contracts/
│   ├── worker-api.md    # HTTP contract for /api/*
│   └── risk-engine.md   # Rule set, order, signatures, worked examples
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (speckit-tasks output)
```

### Source Code (repository root)

```text
src/
├── App.tsx                      # MODIFY: new routes
├── content.ts                   # MODIFY: brand, nav, hero, features, plans, FAQ, about
├── styles.css                   # MODIFY: add table/candle/deck styles on existing tokens
├── components/
│   ├── BarChart.tsx             # ADD: SVG candles + opening range + levels
│   ├── SeatCard.tsx             # ADD: fixed-format room seat note
│   ├── Verdict.tsx              # ADD: APPROVED / BLOCKED pill with rule id
│   ├── TradeCard.tsx            # ADD: plan card (replaces FileStack on the hero)
│   ├── SourceBadge.tsx          # ADD: SAMPLE DATA / LIVE badge
│   ├── Disclaimer.tsx           # ADD: app-screen educational notice
│   ├── StatTile.tsx             # ADD: numeric tile for desk counts
│   └── (existing 30)            # KEEP: Button, Field, Modal, Toast, Segmented, ...
├── lib/
│   ├── desk.ts                  # ADD: limits, account, journal, memos, tickets (localStorage)
│   ├── deskApi.ts               # ADD: typed fetch wrappers for /api/*
│   ├── storage.ts               # KEEP: versioned store
│   ├── router.tsx               # KEEP: History router + match()
│   └── cx.ts                    # KEEP
├── pages/
│   ├── Home.tsx, Pricing.tsx, About.tsx, Login.tsx, Signup.tsx, NotFound.tsx   # MODIFY: copy only
│   ├── Styleguide.tsx           # KEEP, extend with new components
│   └── app/
│       ├── AppShell.tsx         # MODIFY: nav labels for the desk
│       ├── AppHeader.tsx        # MODIFY: account menu, kill switch indicator
│       ├── Desk.tsx             # ADD: Today's desk (replaces Library)
│       ├── Setup.tsx            # ADD: /app/setup/:symbol + Time Machine panel
│       ├── Room.tsx             # ADD: nine seats + memo
│       ├── RiskGate.tsx         # ADD: limits editor + plan checker + ticket
│       ├── Journal.tsx          # ADD: rows, weekly review, CSV export
│       └── AskDesk.tsx          # ADD: grounded Q&A (replaces Chat.tsx)
├── sections/                    # MODIFY: Hero, Features, HowItWorks, Stats, Testimonials, Faq, Cta, Footer
├── shared/
│   ├── market.ts                # ADD: types + seeded universe/bar fixtures
│   ├── setups.ts                # ADD: opening-range + family detection, plan math
│   ├── risk.ts                  # ADD: pure gate (rules R-01..R-15)
│   ├── risk.test.ts             # ADD: table-driven gate tests
│   ├── sizing.ts                # ADD: integer-cent sizing helpers
│   ├── sizing.test.ts           # ADD: sizing/R math tests
│   ├── packet.ts                # ADD: packet assembly + scripted seat notes
│   ├── simulate.ts              # ADD: seeded Monte Carlo + historical re-run
│   ├── simulate.test.ts         # ADD: determinism test
│   ├── journal.ts               # ADD: row schema, weekly summary, CSV
│   ├── time.ts                  # ADD: NY session clock, blackout windows
│   └── validate.ts              # KEEP: extend with symbol/limit validation
└── worker/
    ├── index.ts                 # MODIFY: mount new routes
    ├── market.ts                # ADD: provider adapters + normalization + cache
    └── market.test.ts           # ADD: adapter parse tests on fixtures

DELETED (study-specific): src/shared/packs.ts, src/pages/app/Library.tsx,
Chat.tsx, Flashcards.tsx, Quiz.tsx, DocPicker.tsx, NoDocs.tsx, useActiveDoc.ts,
src/components/UploadDialog.tsx, FileStack.tsx (replaced by TradeCard)
```

**Structure Decision**: single Vite project, existing layout preserved. Business
logic lives in `src/shared/` (imported by both React and the Worker), UI in
`src/pages/app/`, provider code isolated in `src/worker/market.ts` so the app can be
built with no network.

## Complexity Tracking

Empty — no constitution gates were waived.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
