# AI Trading Desk Constitution

<!-- Working product name: "Desk". Final brand name lives in src/content.ts (BRAND.name). -->

## Core Principles

### I. Paper Before Live (NON-NEGOTIABLE)

Nothing in this product places a live order. Paper trading is the default and the
only execution path in v1. Any order ticket is a proposal until the user confirms
it word for word, and the confirmation screen must show symbol, side, quantity,
entry, stop, target and maximum loss at the stop in currency. A kill switch that
cancels working orders and blocks new ones MUST exist on every screen that can
submit. Live brokerage credentials are never stored in this repository.

Rationale: the sources this product is built on are unanimous — most day traders
lose money, and one uncontrolled session ends an account.

### II. Code Decides, Agents Advise

Every rule that can cost money is deterministic TypeScript: position size, the
daily loss limit, distance to the drawdown floor, trade count, reward-to-risk,
session window. These live in `src/shared/risk.ts` as pure functions shared by
browser and Worker. No model output, and no user interface control, can raise a
limit or clear a block. Agent seats produce prose and verdicts that the gate reads
as input; the gate's answer is final.

Rationale: an AI can be persuaded, and it can get arithmetic wrong. A limit has to
give the same answer every time.

### III. Every Number Has a Source

No displayed price, level, percentage or probability may be invented. Each figure
carries provenance: `seed` (bundled fixture), `live` (provider call, with source
and fetch time), or `user` (typed by the user). Seeded values are labelled as
sample data wherever they appear, and every screen shows whether it is running on
sample or live data. Timestamps are shown in New York time with the session date.

Rationale: hallucinated levels are the single most damaging failure mode of AI
trading tools, and the reason this product's pitch is process rather than signals.

### IV. Educational, Never Advice

The product does not tell anyone what to trade. Copy, empty states, verdicts and
memos describe checks against the user's own written rules. Every app screen
carries a visible "not financial advice / educational only / trading involves
risk" notice, and no screen may imply expected returns, win rates or profitability.
The word "signal" is not used as a promise. No testimonials or stats claim
performance.

Rationale: the CFTC's guidance and both source repositories say the same thing —
AI does not turn trading into a money machine.

### V. Offline Demo, Opt-In Live Data

The full demo MUST work with zero API keys and zero network calls: seeded
instruments, seeded 5-minute bars, seeded packets. Live data is an upgrade behind
the same interfaces, fetched only through the Worker (never directly from the
browser), edge-cached, and rate-limited politely. Provider outages degrade to
labelled sample data, never to blank screens or silent invention.

Rationale: the starter template's best property is that it runs for free; the demo
must stay reviewable in a browser with no setup.

### VI. One Design System, Smallest Diff

Reuse the template's tokens (`src/styles.css`), components (`src/components/`) and
page shell. New dependencies are added only when a stated requirement cannot be met
with the platform (SVG charts before a charting library; `bun test` before a test
framework). Every change keeps `bun run typecheck` and `bun run build` green.

Rationale: this is an adaptation of a working template, not a rewrite; the visual
language is already good.

## Data & Compliance Constraints

- Public data sources are documented per adapter: provider, endpoint, required
  user-agent, cache TTL and failure behaviour. SEC requests MUST send a real
  contact user-agent supplied by configuration, never a placeholder.
- No secret, token, brokerage key or model key is committed. Keys arrive through
  the environment (Sites secrets or an untracked local file) and are read only in
  the Worker.
- Journal and account data stay local by default (versioned localStorage key).
  Server persistence, if added, MUST scope every row to the authenticated user.
- The app MUST state that prices may be delayed and that sample data is fictional.

## Development Workflow & Quality Gates

- Gates before any feature is called done: `bun run typecheck`, `bun run build`,
  and `bun test` for `src/shared/*.test.ts`.
- Risk and sizing logic changes require a unit test that fails before the change
  and passes after; money math is done in integer cents and rounded once.
- The demo path is validated with no network available; the live path is validated
  with the provider adapter stubbed.
- Each user story must be demoable on its own from the seeded fixtures.

## Governance

This constitution supersedes convenience. A change that violates a principle must
either be redesigned or recorded in `plan.md` under Complexity Tracking with the
rejected simpler alternative. Amendments require a version bump, a dated entry in
this file, and a note in the feature spec's Assumptions section.

**Version**: 1.0.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19
