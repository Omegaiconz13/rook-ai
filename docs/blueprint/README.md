# Rook — the blueprint

One document set that says what this product is at the end, how it is built, and what has to happen to
get there. Written after reading every tracked file in the repository and running its checks — not from
the specs' claims about themselves.

- **Verified state:** `tsc --noEmit` clean · **445 tests pass** · build 7.7 s · 14,842 lines of source,
  4,291 of them tests.
- **Drawn version:** [`blueprint.html`](blueprint.html) — six diagrams, self-contained, opens offline.
- **Collected 2026-11-24.** If the code and this document disagree, the code wins and this document is
  wrong; fix it in the same PR.

## Read it in this order

| # | Chapter | Answers |
|---|---|---|
| 01 | [Inventory](01-inventory.md) | What is actually in the repo, verified. Which five things are wrong. |
| 02 | [Architecture](02-architecture.md) | The layer rule, the target tree, the boundary check. |
| 03 | [Routing](03-routing.md) | Three routers: URLs, HTTP, and the agent's intent scoring. |
| 04 | [Workflow](04-workflow.md) | Six state machines and every failure path. |
| 05 | [Frameworks](05-frameworks.md) | Ten decisions, with what each one costs. |
| 06 | [Surfaces](06-surfaces.md) | Every screen: job, states, copy rules, accessibility. |
| 07 | [Roadmap](07-roadmap.md) | Five phases, exit criteria, risk register, definition of finished. |

Diagrams: [#d1 layers](blueprint.html#d1) · [#d2 topology](blueprint.html#d2) ·
[#d3 the desk loop](blueprint.html#d3) · [#d4 the turn pipeline](blueprint.html#d4) ·
[#d5 routing map](blueprint.html#d5) · [#d6 plan and ticket](blueprint.html#d6)

## The product in one paragraph

A paper trading desk for one trade at a time. The chart, the written rules and the journal are read by an
assistant called Ninth; **plain TypeScript decides whether a trade is allowed**; every decision, including
every refusal, is journaled and exportable. Offline, no account, no keys, no orders. It exists to teach a
process, so its most important output is a `BLOCKED` verdict with a number attached.

## Non-negotiables (inherited from `.specify/memory/constitution.md`, restated because everything else depends on them)

1. **Paper only.** No code path places a live order. Ever.
2. **Code decides, agents advise.** Every rule that can cost money is a pure function in
   `src/shared/risk.ts`. No model and no UI control can raise a limit or clear a block.
3. **Every number has a source.** `seed` / `live` / `fallback` / `user`, shown next to the number.
4. **A refusal is content.** Blocked verdicts are journaled, visible, and never styled as errors.
5. **The demo works with the network off**, and the model is optional in every surface it appears.

## The twelve decisions this blueprint makes

| # | Decision | Where | Cost |
|---|---|---|---|
| D1 | Dependencies point inward; `shared/` never knows about React, the DOM or `fetch` | 02 | one script, CI step |
| D2 | Delete the HeroUI chain — 708 kB for one styleguide drawer | 05 ADR-4 | half a day, rebuild one demo |
| D3 | One route table in `src/lib/routes.ts`, read by app, nav, footer and tests | 03 | 2 hours |
| D4 | `ApiResult<T>` in `shared/contracts.ts`; one status vocabulary | 03 | 2 hours |
| D5 | `/api/subscribe` and `/api/contact` must stop returning `ok` while discarding data | 07 P2.1 | 1 hour |
| D6 | Demo auth stays, but is labelled as demo everywhere | 07 P2.2 | 1 hour |
| D7 | Automations are paper-only, capped at `confirm-plan`, with an **injected clock** | 04, 07 P3 | 4–6 days |
| D8 | No second intent router: all language goes through `ninth/router.ts` | 03 | — |
| D9 | Remove `motion` (0 imports); verify `pinets` as a Vela peer | 05 | 15 min |
| D10 | `artifacts/` (36 MB, 202 PNGs) leaves git; six curated images replace it | 01 F3 | 1 hour |
| D11 | Distribution before depth: `llms.txt` + `/docs/*.md` + a read-only gate API | 07 P4 | 3–4 days |
| D12 | Backtests come **last**, behind a train/test split | 07 P5 | 1–2 weeks |

## What this blueprint deliberately does not do

- It does not redesign the gate, the journal, the harness or the chart stack. They are the strongest parts
  of the repo and they have tests.
- It does not chase Minara's custody, marketplace, DSL or subscriptions — see
  [`../specs/research/minara-ai/08-risks-and-non-goals.md`] for the eight non-goals and why.
- It does not add a state library, a router library, a component library, an AI SDK or a second storage
  layer.

## Relationship to the other documents

| Document | Status after this blueprint |
|---|---|
| `.specify/memory/constitution.md` | **authoritative**; this blueprint implements it |
| `specs/001-ai-trading-desk/` | authoritative for the desk's requirements |
| `specs/002-vela-charts/`, `003-pine-script/` | authoritative for charts |
| `specs/004-ninth-harness/design.md` | authoritative except where it describes `skills/packs/*` and `/api/ninth/review`, which do not exist (F5) |
| `specs/research/minara-ai/07-build-plan.md` | **superseded** by `07-roadmap.md` here |
| `specs/research/minara-ai/06-gap-analysis.md` | still the map of what Minara has that Rook does not |
| `README.md` (root) | needs a pointer to this directory (Phase 1) |

## How to check that this document is still true

```sh
bun run typecheck && bun test          # 445 tests, 4.4 s
bun run build                          # budgets in 05-frameworks.md
node scripts/check-layers.mjs          # after Phase 1.6
```

If a number in chapter 01 no longer matches, the blueprint is stale. That is the point of putting the
measurements next to the claims.
