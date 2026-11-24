# 07 — Build plan: Rook, in Minara's shape

Four phases. Each is independently shippable, each ends with a test that proves it, and no phase
requires custody, keys, or a real broker. Order is by *value per unit of risk*, not by ambition.

Guiding rule taken from Minara: **distribution before depth**. Their docs and skill pack are why they
are legible to agents; their product is why they are legible to humans. Rook has product but no
distribution, so distribution goes first.

---

## Phase 1 — Be legible to agents (1–2 days)

The cheapest, highest-leverage work in this plan. Minara gets found because any agent can read its
docs. Rook currently has a README and 176 KB of specs the outside world cannot parse.

### 1.1 Machine-readable docs

**New files (static, served by the Worker):**

| Path | Content |
|---|---|
| `public/llms.txt` | Curated index: what Rook is, the desk's rules, where the docs live, one line per page. Model it on `minara.ai/llms.txt`. |
| `public/docs/index.md` | What a desk session is, the gate, the journal, paper-only invariant. |
| `public/docs/rules.md` | The written rules the gate enforces, in the same order `checkPlan` checks them. |
| `public/docs/journal.md` | Schema 2, verdict types, what a refusal means. |
| `public/docs/ninth.md` | What Ninth can and cannot do, and that the gate is code. |
| `public/docs/skill.md` | How to install the Rook skill. |

**Worker routes** (`src/worker/index.ts`): serve `/llms.txt` and `/docs/*.md` with
`text/markdown; charset=utf-8`, and add `Link: </llms.txt>; rel="llms"`. Static assets already
flow through `c.env.ASSETS`, so this may be configuration rather than code.

**Acceptance:** `curl -s localhost:5333/llms.txt` returns markdown with a working link per page;
`curl -sI localhost:5333/docs/rules.md` shows the markdown content-type.

### 1.2 The Rook skill

**New directory:** `skills/rook-desk/` following `specs/research/minara-ai/skill-pack/` exactly:

```
skills/rook-desk/
├── SKILL.md            # frontmatter + routing gate + command table + refusal contract
├── setup.md            # per-harness integration blocks (Claude Code, Codex, OpenClaw, Hermes)
├── references/
│   ├── session.md      # how a session is opened, what a setup is
│   ├── gate.md         # every rule, in order, with the refusal string for each
│   ├── journal.md      # reading and writing rows
│   └── setups.md       # the setup vocabulary (opening range, flag, reclaim, oversold)
└── scripts/version-check.sh   # copy the pattern: pure detector, snooze file, 24h cache
```

`SKILL.md` must contain, in this order:

1. Frontmatter with a **numbered trigger list**, `requires.bins`, and `primaryEnv` if any.
2. **Negative routing** — do not activate for general market questions, price predictions, or
   "should I buy X" without a setup. Rook answers about *process*, not direction.
3. **The refusal contract** — the skill must never rephrase a `BLOCKED` verdict into advice. This is
   Rook's equivalent of Minara's "analysis → trade boundary", and it is the single most important rule
   in the file.
4. Command table mapping intent → desk action → reference file.
5. **Lazy auth** equivalent: never ask for setup before a command needs it.

**Acceptance:** installing the skill into a fresh Claude Code config and asking "check this setup"
produces a desk action, not a lecture. Include a `benchmark.md` stating what was measured and how.

### 1.3 Docs MCP (optional, 2 hours)

A single-tool MCP server over `public/docs/*.md` (`search_docs`). Minara runs
`https://minara.ai/docs/~gitbook/mcp`; copying the idea is trivial and puts Rook inside the same
tooling.

---

## Phase 2 — Paper automations (3–5 days)

The feature that turns a demo into a habit, and the one where Rook can beat Minara's ergonomics because
there is no custody risk to gate.

### 2.1 Schema first

**New file:** `src/shared/automations.ts`

```ts
export type Trigger =
  | { kind: 'schedule'; every: number; unit: 'min'|'hour'|'day'|'week' }
  | { kind: 'calendar'; days: number[]; at: string }      // 'HH:MM' local
  | { kind: 'once'; at: number }                           // epoch ms
  | { kind: 'manual' }
  | { kind: 'price-cross'; symbol: string; level: number; dir: 'above'|'below' }
  | { kind: 'price-hold';  symbol: string; level: number; dir: 'above'|'below'; forMs: number };

export type Step =
  | { kind: 'fetch-bars'; symbol: string; timeframe: string }
  | { kind: 'check-condition'; rule: string }              // deterministic, no model
  | { kind: 'summarise'; prompt: string }                  // model, optional
  | { kind: 'draft-plan'; setup: string }                  // produces a plan, never fills

export type Delivery = { channel: 'in-app'|'email'|'webhook'; target?: string };

export type Plan = { trigger: Trigger; steps: Step[]; delivery?: Delivery;
                     permission: 'test'|'confirm-each'|'confirm-plan' };
```

Three deliberate constraints, all copied from Minara and all stricter for Rook:

- **No `hands-off` level.** Rook is paper-only, but a paper desk that fills without a human is
  teaching the wrong reflex. Levels stop at `confirm-plan`.
- **`check-condition` is never a model call.** Minara's "precise comparisons run as calculations" rule,
  enforced by the type system.
- **`draft-plan` cannot fill.** It emits a plan for the gate; the gate still decides.

### 2.2 Engine

**New file:** `src/shared/automations/run.ts`
- Pure `runPlan(plan, ctx)` → `{ ranAt, steps: StepResult[], verdict?" }`.
- Reuses `simulate.ts`, `setups.ts`, `checkPlan`, `journal.ts`. No new decision logic.
- Every run appends a journal row with `source: 'gate'` and the plan id.

**New files:** `src/shared/automations/{schedule.ts, triggers.ts}` — cron/interval evaluation in local
time, with an injectable clock (`time.ts` already exists, use it; do not call `Date.now()` directly).

**Tests** (`*.test.ts` alongside): schedule boundary (23:59 → 00:00), price-cross firing once not
twice, `test` permission never producing a fill, a blocked plan still journaling.

### 2.3 UI

**New page:** `src/pages/app/Automations.tsx` — list, editor, a **Test** button that shows what would
happen and writes nothing, and a run log linking to journal rows. Show the permission ladder
explicitly, with the current level highlighted.

**Acceptance:** create "every weekday at 09:00, fetch bars, check opening-range setup, draft plan,
notify in-app"; hit Test; see a described future run and **no** journal row; hit Run once; see exactly
one new row.

---

## Phase 3 — Public proof (2–3 days)

### 3.1 Benchmark page

**New page:** `src/pages/Benchmark.tsx` — Rook's own paper strategy, every decision, every refusal,
P&L, drawdown. Labelled "paper only, not advice" at the top and in every export.

Source of truth: journal rows, not a new store. A `src/shared/benchmark.ts` projector over
`journal.ts` keeps it honest — you cannot fake a benchmark that is a pure function of the audit log.

**Acceptance:** the numbers on the page reconcile exactly with the journal export. Write that test.

### 3.2 Read-only API

**Worker routes** (`src/worker/index.ts`):

| Route | Returns |
|---|---|
| `GET /v1/rules` | the rule list with ids and human text |
| `POST /v1/check-plan` | `GateVerdict` for a posted plan (same JSON the UI sends) |
| `GET /v1/journal?limit=` | recent journal rows, no notes |
| `GET /v1/benchmark` | the phase 3.1 projection |

Constraints: no auth, CORS open, 60 req/min per IP, no model calls on any of them (so no cost and no
abuse surface). `/v1/check-plan` is a pure function call — this is Rook's version of Minara's
structured-output API, and it is free.

**Acceptance:** `curl -X POST /v1/check-plan` with a plan that breaks a rule returns `BLOCKED` with the
same reason string the UI shows. Add that as a Worker test against `src/shared/risk.ts`.

---

## Phase 4 — History and real backtests (1–2 weeks)

The largest item, and the one that makes any Strategy-Studio-style claim honest.

1. **Dataset expansion** (`src/shared/dataset.ts`): loader for multiple labelled sessions, explicit
   `source`, `asOf`, `delayedByMinutes` per session. Provenance on every number, no exceptions.
2. **Backtest runner** (`src/shared/backtest.ts`): replay a session through `setups` → `simulate` →
   `stats`, returning metrics + equity curve + trade list. Reuse `stats.ts` rather than writing a
   second metric implementation.
3. **Metrics page** — the same vocabulary Minara's Academy teaches: total return, max drawdown, win
   rate, average R, exposure, number of trades. Define each in the docs page, not in a tooltip.
4. **Optimiser** (optional): parameter sweep over a setup's numeric inputs, with an explicit
   overfitting warning and a train/test split. If the split is not there, do not ship the optimiser.

**Acceptance:** running the same session twice produces byte-identical output (determinism test); a
sweep over 20 parameter values returns a table, not a best-number headline.

---

## Definition of done, per phase

- `bun run typecheck` clean, `bun test` green, `bun run build` succeeds.
- New behaviour has a test that fails if the behaviour is removed (mutation-check at least the gate and
  the scheduler).
- Docs updated in `public/docs/` **and** the corresponding `specs/` design note, because the public docs
  are now a contract.
- No new runtime dependency without a written reason in the PR body.
- Anything user-visible says "paper only" where a reasonable person could think otherwise.

## Sequencing note

Phases 1 and 3.1 are cheap and make everything after them look credible. Phase 2 is the one users
will actually feel. Phase 4 is the one that takes real time and should not start until 1–3 are shipped,
because historical data invites claims Rook cannot yet support.

## Explicitly not in this plan

Custody, wallets, on-ramps, live execution, a strategy DSL, a marketplace, creator payouts, an
LLM-generated strategy compiler, and any subscription meter. See `08-risks-and-non-goals.md`.
