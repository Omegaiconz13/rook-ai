# 06 — Rook as it stands, against Minara

Honest comparison. Left column is what is actually in `src/` today (verified by reading the tree, not
the specs); right column is what Minara ships. "Specced" means a design doc exists but no code.

## Rook today, measured

- **Stack**: Vite + TypeScript, bun for install/test, Cloudflare Worker (`src/worker/index.ts`, 240
  lines) serving `index.html` plus one model proxy at `/api/ninth/model`, `wrangler.jsonc` +
  `deploy.json`, 36 MB of `artifacts/`.
- **Desk modules** (`src/shared/`, 68 files): `chartfeed`, `dataset`, `market`, `news`, `setups`,
  `simulate`, `sizing`, `stats`, `ticket`, `risk`, `journal`, `time`, `validate`, `rng` — all with
  `.test.ts` siblings.
- **Ninth harness** (`src/shared/ninth/`): `router`, `gate`, `verdict`, `prompt`, `provider`,
  `answer`, `review`, `draft`, `watch`, `loop`, `remote-turn`, `args`, `audit`, `memory`, `learning`,
  `result`, `types`, plus `tools/` (`read`, `write`, `decide`, `meta` — 4 tools) and `skills/` (1).
- **Pages**: `Home`, `About`, `Pricing`, `Login`, `Signup`, `Styleguide`, `NotFound`, and app surfaces
  `Desk`, `Charts`, `Journal`, `Ninth`, `RiskGate`, `Session`, `Setup`.
- **Data**: one pinned, labelled session of delayed Yahoo Finance bars. Offline. No keys, no signup.
- **Money**: none. Paper only, by design and by policy.

So Rook already has, in code: a chart feed, a simulated fill engine, a deterministic risk gate
(`checkPlan({plan, limits, account, session, history}) → GateVerdict`), a bounded journal (schema 2,
2000 rows, 280-char notes), four memory stores, an audit log, a router, and an optional model turn.

## Feature-by-feature

| Capability | Rook | Minara | Delta that matters |
|---|---|---|---|
| Conversational research | Ninth, one skill, optional model | full chat + research + institution review | Rook's is deliberately narrow; keep it |
| Charting | own feed + Vela skills (9 vendored) | proprietary, plus chart images in chat | Rook is *ahead* on chart extensibility |
| Deterministic risk gate | **yes, in code, before any action** | six-stage, partly inferred | Rook's is the cleaner, more auditable version |
| Journal / audit | **yes, every decision incl. refusals** | per-turn audit, private | Rook's public refusals are a genuine differentiator |
| Money movement | none (paper) | custodial wallet, 19 chains, MoonPay | huge; not a goal |
| Perps execution | simulated only | Hyperliquid + Lighter, live | not a goal |
| Limit orders | no | spot + perps | possible in paper form |
| Automations | no | desktop, 4 triggers, 3 deliveries | **the most valuable next feature** |
| Backtesting | simulated single session | full historical, parameter/factor optimisation | Rook has the engine, no history |
| Strategy authoring | Pine Script spec (003), Vela indicators | Pine Runtime, generated from prose | Rook should not build a DSL |
| Marketplace | no | discover/compare/run/publish/earnings | out of scope |
| API | Worker proxies the model only | Pro-key API + x402 | a read-only public API is cheap and differentiating |
| Skill pack / agent distribution | 9 Vela skills vendored | MIT skill, 88/100 benchmark, 4 harnesses | **cheap, high leverage** |
| Payments | no | x402, agent pays for data | no wallet, skip |
| Docs as agent surface | none | `llms.txt`, `.md`, MCP, `ask=` | **cheapest credibility win available** |
| Pricing | page exists | 4 tiers, credits + Sparks | Rook has no metering |
| Personalization | 4 memory stores | 6 toggleable modules | Rook is comparable in kind |
| Transparency artefact | journal | public Benchmark tab | Rook should publish a "Benchmark" page |
| Data provenance | labelled fixture | 50+ named providers | Rook must state its source per number |

## Where Rook is genuinely better, and should lean in

1. **The gate is plain code.** Minara's safety is described as stages; Rook's is a pure function with
   tests. That is a stronger claim and it is demonstrable. Every marketing sentence should be backed
   by a test name.
2. **Refusals are journaled and public.** Minara journals but does not show you the trades it declined.
   A desk whose *refusals* are first-class is a different product: it teaches instead of entertaining.
3. **It works offline with no account.** Minara requires signup, wallet, and credits before it does
   anything. Rook's demo has zero onboarding cost, which is the right top of a funnel for a paper desk.
4. **Charting is open.** Vendored Vela skills mean users can add indicators. Minara's charting is a
   black box.

## Where the gap is real and worth closing

Ordered by value per unit of work:

1. **Docs as an agent surface** (`llms.txt`, `.md` pages, a docs MCP). Hours of work, changes how every
   agent and every search engine sees Rook. Minara's docs are the reason this corpus exists.
2. **A distributable skill** for Rook ("ask the desk", "check this setup against the rules"), MIT,
   with a benchmark number. This is exactly the Minara pattern and Rook has the only ingredient that
   matters — a deterministic tool the skill can call.
3. **Automations in paper form** — trigger → steps → delivery, with the four-level permission ladder.
   Rook can implement all of it client-side with no custody risk. This is the feature that turns a demo
   into a habit.
4. **A public Benchmark page** — Rook's own paper strategy, every decision, every refusal, P&L. Costs
   nothing, cannot be accused of hiding losses.
5. **Historical data + real backtests.** The engine exists (`simulate.ts`, `stats.ts`); it needs more
   than one session. This is the largest engineering item and the one that makes Strategy Studio-style
   claims honest.
6. **A read-only API** — `POST /v1/check-plan` returning a `GateVerdict`, plus `GET /v1/journal`. No
   auth beyond a rate limit. Minara gates its API behind $199; Rook giving away the gate is on-brand.

## Where Rook should deliberately stay behind

- Custody, wallets, withdrawals, on-ramps. Rook's entire value proposition is that it cannot lose your money.
- Strategy marketplace and creator earnings. Needs scale Rook does not have and invites securities questions.
- Model-generated trading code (Pine Runtime). Generated strategies plus live capital is the exact
  combination Rook's design rejects.
- Live perps execution. No.

## The one-sentence version

Minara is a brokerage with an agent inside it; Rook is a referee with a chart. Copy their
**distribution** (skills, docs, transparency, automation ergonomics) and their **safety vocabulary**;
do not copy their **custody, their DSL, or their marketplace**.
