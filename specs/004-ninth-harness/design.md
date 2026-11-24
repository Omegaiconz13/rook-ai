# Ninth Harness — architecture, routing, tools and workflow

Status: proposed, nothing implemented. Grounded in `specs/research/2026-11-24-minara-system-research.md`.
Supersedes nothing; B1 (`0f22925`) already made Ninth the desk's only assistant.

## 1. The goal in one paragraph

Ninth should be to the Rook desk what the Minara harness is to a trading account: one
assistant that reads the chart, the written rules, the gate and the journal, can act on
all of them, remembers what it learned, shows its work, and never invents a number. We
take their **machine** — deterministic routing, typed and tiered tools, budgeted
playbooks, four memory stores, a learning loop with a statistical gate, an audit log —
and run it paper-only, offline-first, on our own stack.

## 2. Non-goals (permanent, not phased)

- No live orders, no wallets, no deposits, no perps, no on-ramp, no metered payments.
- No copied UI, copy, iconography or layout from minara.ai. The panel stays Rook's.
- No MCP as the core tool protocol; our tools need tiers and confirmations MCP does not model.
- No computer-use, browser automation, coding agent, document generation.
- No cloud database in this phase: desk state stays in the browser.

## 3. What we adopt, and what we deliberately change

| Minara mechanic | We adopt | We change |
| --- | --- | --- |
| model proposes / harness decides | yes, verbatim as a principle | the "decides" half is our gate, which is already pure code |
| L0 deterministic router + LLM activation | yes, same scoring shape | skills are TypeScript modules, not markdown frontmatter — typed, testable, no YAML parser |
| ≤800-token bodies, 12k-char active budget, shed | yes, same numbers | budget in **characters**, measured, with a test that fails on overflow |
| 4 permission tiers | yes | tier 4 exists but contains only *destructive local* actions (reset the desk), never a trade |
| 6-stage finance stack | yes, re-pointed | slippage becomes **simulation honesty** (assumptions printed), not price impact |
| 4 memory stores + markdown ground truth | yes, adapted | workspace files are read-only constants shipped in the bundle; user-owned facts live in one store |
| learning: review → score → graduate | yes | review runs **on demand** (a command), never as a background LLM call |
| audit log with `trace_id` | yes | one localStorage ring buffer, 500 rows, queryable from the UI |
| Institution Mode roundtable | yes, as "Review" | fixed four roles, read-only, no user-built pipelines |
| Strategy Studio | yes, as "Draft" | natural language → Pine draft → existing `simulate`; no deploy |
| Autopilot | **no** | replaced by "watch": a rule that tells you when a setup triggers, never trades |

## 4. Framework and topology

No new runtime dependencies. The stack stays React 19 + Vite + Hono on the Cloudflare
Worker, `bun test`, pure TypeScript shared modules.

```
┌────────────────────────── browser ──────────────────────────┐
│  NinthPanel (docked)  /app/chat (full page)                 │
│        │                                                    │
│        ▼                                                    │
│  NinthRuntime  ── loop.ts ── router.ts ── registry.ts       │
│        │             │           │            │             │
│        │             ▼           ▼            ▼             │
│        │         prompt.ts    skills/*     tools/*          │
│        │             │                        │             │
│        │             └──── memory · learning · audit ◄──────┘
│        │                        (localStorage, desk:v1:ninth:*)
│        ▼                                                    │
│  ModelClient (fetch, SSE)  ───────────────┐                 │
└───────────────────────────────────────────┼─────────────────┘
                                            ▼
┌────────────────────────── Worker ───────────────────────────┐
│  POST /api/ninth/turn   → provider adapter (server-side key)│
│  POST /api/ninth/review → cheap tier, structured output     │
│  every existing route unchanged                             │
└─────────────────────────────────────────────────────────────┘
```

Three rules that make the design honest:

1. **The model never runs in the browser.** `ModelClient` posts to the Worker; the key is a
   Worker secret. With no key configured the panel runs the current deterministic
   `answerNinth` path and says "no model connected" — the offline demo stays the default.
2. **The loop is ours, not a vendor SDK.** Minara chose the Vercel AI SDK because their loop
   is "short and bounded". Ours is shorter: `build → call → dispatch → repeat`. A 30-line
   loop we own is testable with a fake model and adds no dependency; the provider adapter
   speaks the OpenAI-compatible chat-completions shape over plain `fetch` so any provider
   (or a local Ollama) drops in.
3. **Every deterministic module is model-free.** Routing, tiers, budgets, tool handlers,
   memory recall, learning maths and the gate all run in `bun test` with no network. Only
   `loop.ts` knows a model exists, and it accepts a fake.

### Module map

| File | Owns | Depends on |
| --- | --- | --- |
| `src/shared/ninth/types.ts` | `TurnContext`, `ToolEntry`, `SkillDef`, `RoutedSkill`, `AuditRow`, `TurnEvent` | nothing |
| `src/shared/ninth/registry.ts` | tool registry, `TOOL_SETS`, `dispatch()`, per-turn context | types |
| `src/shared/ninth/tools/read.ts` | quote, levels, setups, scan, journal, news, session | existing shared modules |
| `src/shared/ninth/tools/decide.ts` | `gate_check`, `size_plan`, `simulate_plan`, `r_multiple` | `risk.ts`, `sizing.ts`, `simulate.ts` |
| `src/shared/ninth/tools/write.ts` | `journal_append`, `ticket_propose`, `ticket_confirm`, `limits_update`, `memory_write`, `learn_save` | `lib/desk.ts` via injected port |
| `src/shared/ninth/tools/meta.ts` | `activate_skills`, `tool_search`, `ask_user`, `clear` | registry |
| `src/shared/ninth/router.ts` | `route()`: scoring, stages, conditions, negatives | skills catalog |
| `src/shared/ninth/skills/*.ts` | 12 declarative skills | types |
| `src/shared/ninth/skills/packs/*.ts` | long-form playbooks (budgeted, loaded on demand) | skill ids |
| `src/shared/ninth/prompt.ts` | block assembly, cache prefix, shed, learnings injection | router, memory, workspace |
| `src/shared/ninth/gate.ts` | tier gate, kill switch, caps, confirmation state machine | `risk.ts` |
| `src/shared/ninth/loop.ts` | turn pipeline, step/token caps, overflow trim, events | everything above |
| `src/shared/ninth/memory.ts` | 4 stores, recall, freeze, thresholds | storage port |
| `src/shared/ninth/learning.ts` | review scoring, TF-IDF recall, Wilson gate | memory |
| `src/shared/ninth/audit.ts` | append, query, ring buffer, `trace_id` | storage port |
| `src/shared/ninth/answer.ts` | today's deterministic answers, kept as the no-model path | existing `ninth.ts` |
| `src/lib/ninth-runtime.tsx` | React binding: state, streaming, ports for storage/drawings | all of the above |

`src/shared/ninth.ts` stays as the public name surface (`NINTH_NAME`, `NinthContext`) and
re-exports, so `NinthPanel`, `Ninth.tsx` and their test keep compiling while the internals
move.

Storage is injected, not imported: `declareStore()` / `declareDrawings()` ports mean the
whole harness is testable in a plain object and the bundle keeps one storage implementation
(`lib/storage.ts`, keys under `desk:v1:ninth:`).

## 5. The turn workflow

Seven phases, each with a number. All caps are constants in `types.ts` and asserted by tests.

| # | Phase | What happens | Budget / cap |
| --- | --- | --- | --- |
| 1 | **Normalise** | trim, detect symbol/timeframe overrides, read desk state, build `TurnContext` | 2,000 chars in |
| 2 | **Route** | L0 scores every skill; drop `−∞`; sort; take top 6 | deterministic |
| 3 | **Compose** | identity + catalog (cached prefix) + active bodies under budget (shed lowest priority) + memory snapshot + top-3 learnings + pending-confirmation note | 12,000 chars bodies, 3 learnings |
| 4 | **Call** | `ModelClient.stream()` with the tools the active skills allow ∩ turn's tool sets; `maxSteps` | 6 steps, 24k output tokens |
| 5 | **Dispatch** | validate args against schema → `checkFn` → tier gate → safety hooks → handler → truncate result | 4,000 chars per result |
| 6 | **Confirm** | if the gate demanded confirmation: emit `tool_pending`, stop the loop, resume on the next user message with a one-time token | token TTL 10 min, single use |
| 7 | **Persist** | audit rows, turn row, memory thresholds, optional learning candidate | 500 audit rows |

Stop conditions, in order: `end_turn` → step cap → token cap → user confirmation pending →
blocked-by-gate twice in one turn (a loop signal, not a retry signal).

The panel renders the same `TurnEvent` stream in both surfaces, so `/app/chat` and the
docked panel cannot drift:

```ts
type TurnEvent =
  | { t: 'route'; skills: RoutedSkill[] }
  | { t: 'text'; delta: string }
  | { t: 'tool'; name: string; tier: Tier; status: 'run' | 'ok' | 'blocked'; ms?: number; why?: string }
  | { t: 'pending'; proposal: Proposal; token: string }
  | { t: 'refs'; refs: string[] }
  | { t: 'done'; usage: { steps: number; tokensIn: number; tokensOut: number } }
```

## 6. Tool catalog

Four sets. `tier` is 1 read / 2 confirm-once / 3 always-confirm / 4 manual-only. `source`
names the existing function that produces the number — no tool recomputes what the desk
already computed.

### `read` — 7 tools, tier 1

| Tool | Args | Returns | Source |
| --- | --- | --- | --- |
| `get_quote` | `{symbol, timeframe?}` | last bar OHLC, change vs prior bar | `chartHistory` |
| `list_levels` | `{symbol}` | the rule's range/entry/stop/target lines | `setupLevelsFor` |
| `list_setups` | `{symbol?}` | setups with family, status, prices, R | `setupsFor` / `deskSetups` |
| `scan_desk` | `{}` | every symbol's best setup, triggered first | `deskSetups` |
| `read_journal` | `{symbol?, date?, verdict?}` | rows, counts, last row | `useJournal` snapshot |
| `read_news` | `{symbols[]}` | headlines for the symbols | `headlinesFor` |
| `read_account` | `{}` | equity, day P&L, trades today, risk used, kill switch | `accountFor` |

### `decide` — 4 tools, tier 2 (confirm-once per session, because they cost compute)

| Tool | Args | Returns | Source |
| --- | --- | --- | --- |
| `gate_check` | `{setupId}` or `{plan}` | full `GateVerdict` incl. rule id and reason | `checkPlan` |
| `size_plan` | `{entryCents, stopCents}` | size, deciding limit, loss at stop, caps | `sizeFor` |
| `simulate_plan` | `{plan, runs?, seed?}` | target-first %, avg R, bootstrap, assumptions | `simulate` |
| `r_multiple` | `{entry, stop, target}` | R, rounded like the desk rounds it | `rewardRisk` |

### `write` — 6 tools, tier 3 unless noted

| Tool | Args | Effect | Gate |
| --- | --- | --- | --- |
| `journal_append` | row fields | appends one row, stamps `editedAt` null | confirm once per row |
| `ticket_propose` | `{setupId, size}` | creates a *proposed* ticket only | never confirms |
| `ticket_confirm` | `{ticketId, verdict}` | re-runs `ticketProblem` first; refuses on mismatch | tier 4 — manual only |
| `limits_update` | partial `RiskLimits` | writes limits, echoes what changed | confirm, show diff |
| `memory_write` | `{section, text}` | appends to the user store, dedupes identical lines | tier 2 |
| `learn_save` | `{trigger, sequence, guidance}` | inserts a learning at `success_count: 1` | confirm |

`ticket_confirm` is tier 4 on purpose: the desk's one irreversible-ish act (it writes a
paper ticket and starts the replay) must be initiated by a *person typing in the UI*, not by
a model choosing a tool. Ninth may propose; only the confirm dialog may confirm.

### `meta` — 4 tools, tier 1, always callable

`activate_skills(ids)`, `tool_search(query)` (describes a tool's schema on demand),
`ask_user(question, options)` (renders chips in the panel), `route_why()` (explains its own
routing — see §7).

## 7. Routing

### The catalog (12 skills)

| id | description (≤80 chars) | stage | tools | co-activate |
| --- | --- | --- | --- | --- |
| `desk.core` | The desk: quote, levels, setups, account, journal reads | discover, evaluate | 7 read | everything |
| `desk.gate` | Why a plan was blocked or approved, and by which rule | evaluate, decide | `gate_check`, `size_plan` | `desk.core`, `desk.risk` |
| `desk.risk` | Sizing from your written limits, R, loss at stop | evaluate, decide | `size_plan`, `r_multiple`, `gate_check` | `desk.gate` |
| `desk.setups` | The four written rules and what is triggering today | discover, evaluate | `list_setups`, `scan_desk` | `desk.levels` |
| `desk.levels` | Where the rule puts range, entry, stop and target | discover, evaluate | `list_levels` | `desk.setups` |
| `desk.journal` | What you logged, verdicts, notes, day P&L | manage | `read_journal`, `journal_append` | `desk.core` |
| `desk.ticket` | Propose and confirm a paper ticket; never auto-confirm | decide, manage | `ticket_propose`, `ticket_confirm` | `desk.gate` |
| `desk.sim` | Replay a plan 10,000 times; say what it does not model | evaluate | `simulate_plan` | `desk.risk` |
| `desk.news` | Headlines for the symbols on the desk | discover | `read_news` | `desk.core` |
| `desk.limits` | Change the written limits, with the diff shown | manage | `limits_update` | `desk.risk` |
| `desk.memory` | What Ninth remembers about how you trade | any | `memory_write`, memory reads | — |
| `desk.learn` | Turn a successful turn into a reusable sequence | manage | `learn_save` | `desk.memory` |

Each skill is a `SkillDef` with `priority` (10–90), `routing.keywords` (lowercase),
`routing.negativeKeywords`, `routing.stages`, `conditions`, `summary`, `prompt` (≤800
tokens) and an optional `pack` id.

### The score

```ts
score = 0
      + 30 * min(keywordHits, 2)      // capped +60
      + (stageMatch ? 20 : 0)
      + (assetMatch ? 15 : 0)         // long / cash / index / earnings-day
      + (coActivated ? 10 : 0)
      + (signalMatch ? 25 : 0)        // cron/alert turns; nothing schedules today
      + (100 - priority) / 100        // tiebreak, fractional so it never outranks a hit
score = (negativeKeywordHit || failedConditions) ? -Infinity : score
```

Negative keywords do the work that keeps this from being a keyword soup: `desk.ticket` is
`−∞` on "why", "explain", "what is"; `desk.sim` is `−∞` when the message says "today's
bars" (a replay is not a quote); `desk.journal` is `−∞` on "should I".

`route_why()` returns the winning scores with their reasons (`['kw:blocked', 'stage:evaluate',
'co:desk.core']`), which the panel can show behind a "why this" disclosure. That is our
answer to their inline catalog hints, and it makes routing debuggable without a model.

### Activation and budget

The model sees the routed catalog (id, description, one-line summary, reasons) and calls
`activate_skills(ids)`. Activation is **not** an authorization step — the tier gate runs at
invocation — and the latest call replaces the set. Bodies are concatenated while they fit
`SKILL_BODY_BUDGET_CHARS = 12000`; overflow sheds lowest-priority bodies first and inlines
their `summary`, and the catalog tags them `(body shed)`.

The always-callable baseline is `activate_skills`, `tool_search`, `ask_user`, `route_why`,
`get_quote` and the memory reads — the equivalent of their `DEFAULT_ALWAYS_INCLUDE_TOOLS`.

### Packs

Long guidance lives in `skills/packs/<id>.ts` as a string constant, loaded only when its
skill is active: `gate-rules.md` (all 15 R-rules in plain language), `families.md` (the four
setup families and their stop logic), `sizing.md` (the three caps), `sim.md` (the five
assumptions and why a bar spanning stop and target scores stop-first), `journal.md` (what a
good note contains). This is the progressive-disclosure trick from the Minara skills pack
(routing table → reference doc on demand) without shipping markdown at runtime.

## 8. Safety

### Tiers and hook order

```
BeforeToolCallHook (order matters, each may throw ToolCallBlockedError):
  1. kill switch        → any tier ≥ 2 blocked, and no write of any kind
  2. per-turn write cap → max 3 write-tier calls per turn
  3. tier gate          → 1 run · 2 confirm-once/session · 3 confirm-each · 4 reject from any model-dispatched call
  4. args validation    → schema + numeric sanity (finite, cents, stop < entry)
  5. gate re-check      → any tool that mentions size or a ticket must carry a fresh GateVerdict
```

A block returns to the model as a tool-shaped error (`{ok:false, blocked:'R-09', why}`), so
the model can explain it; the audit row records `blocked: 1` and the reason. Tier 4 called
by the model is rejected *and* logged, the way they reject `MANUAL_ONLY` on autonomous turns.

### The six stages, re-pointed to paper

| Stage | Their job | Ours |
| --- | --- | --- |
| 1 instrument safety | canonical token address, scam list | symbol must be in `INSTRUMENTS`; `bareTicker` normalisation; unknown symbol is a refusal, not a lookup |
| 2 sizing | fixed/Kelly, clipped | `sizeFor` (risk / position cap / cash), `clipped` equivalent = `decidingLimit` |
| 3 exposure | per token/chain/class | per symbol (one ticket), per day (max trades), per session (risk used) — all already R-13/R-14/R-03 |
| 4 "slippage" | price impact | **simulation honesty**: every `simulate_plan` answer carries `SIM_ASSUMPTIONS`; a result without them is a bug |
| 5 risk manager | per-tx, daily, kill switch | `checkPlan` R-01…R-15, plus the shared kill switch that also cancels live tickets |
| 6 stop management | decide, then re-gate | the ticket replay already scores stop-first; Ninth may describe an exit, never move one |

### The one invariant

> A model-supplied claim of confirmation is not a confirmation.

`ticket_confirm` is not in `allowedToolSets` for any model-dispatched turn. The token in a
`pending` event is minted by the *runtime* when the user clicks, and consumed by the
runtime, never by the model. If a future feature needs a model-initiated write, it goes
through the same pending → click → token path.

## 9. Memory and learning

Four stores, one namespace, independent lifecycles, all in localStorage:

| Key | Shape | Lifecycle |
| --- | --- | --- |
| `desk:v1:ninth:workspace` | `{facts[], preferences[], decisions[]}` | user-owned, never auto-rewritten; exported with the journal bundle |
| `desk:v1:ninth:memory` | `{id, section, text, createdAt, session}[]` | append on threshold (≥3 new observations in a turn), frozen per session |
| `desk:v1:ninth:learnings` | `{id, trigger, sequence, guidance, success, failure, lastUsed}` | written only by `learn_save` or an accepted review |
| `desk:v1:ninth:audit` | ring buffer, 500 rows | append-only, `trace_id` per turn |

Prompt precedence is theirs and it is right: **workspace beats inferred**. A `MEMORY` line
saying "no shorts before 10:00" outranks anything a model inferred from a chat. The
workspace subset ships read-only in the bundle (`SOUL` = Ninth's voice and refusals,
`AGENTS` = safety defaults, `USER` = the desk's focus), and only the user's additions live
in storage.

**Learning, without a background model call.** Their review engine spends a cheap-model
call per turn. We cannot: no key by default, and a silent spend is against the desk's
grain. So:

- `reviewTurn(turn)` is deterministic (tool count, whether the gate was consulted, whether
  refs were emitted, whether the user re-asked the same question) and produces `score 0–10`.
- A turn **candidate** is stored only at `score ≥ 7` with `≥ 3` tool calls — their numbers.
- Recall is TF-IDF over the message + routing reasons, top 3, injected as `<learnings>`.
- Graduation uses the **Wilson lower bound ≥ 0.55 with ≥ 10 uses** before a learning is
  offered as a suggestion; below that it is shown with its sample size and marked unproven.
  A learning never changes the gate, never changes limits, never becomes permission.

## 10. Features and surfaces

Nothing new in the nav. Everything is Ninth, in the two places it already is.

| Feature | Where | What it is | Mirrors |
| --- | --- | --- | --- |
| **Ask** | panel + `/app/chat` | the routed turn, streamed, with refs under every answer | chat + Copilot |
| **Analyze** | panel over a chart | today's behaviour, now driven through the loop and `tool` events | chart copilot (their 26-tool set) |
| **Explain** | any blocked verdict | `gate_check` on the active setup, rule id and the exact sentence | — |
| **Review** | `/app/chat` command `/review` | four fixed read-only roles (setup, risk, counter-case, journal) over the same context; produces a written record, never an order | Institution Mode |
| **Watch** | `/app/chat` command `/watch SYMBOL 9.50` | a stored condition checked on load; when it fires Ninth says so. No scheduling, no trades | automations, minus autonomy |
| **Draft** | `/app/chat` command `/draft` | plain English → Pine draft → existing `simulate` → shown with assumptions | Strategy Studio |
| **Remember** | `/app/chat` command `/memory` | list, add, delete facts; shows what is frozen per session | memory + personalization |
| **Trace** | `/app/chat` command `/trace` | last turn's routing reasons, tool calls, tiers, blocks, tokens | observability |

`/review` and `/draft` are commands, not new routes: they need the same conversation and
the same context, and a route would duplicate the shell for no gain.

Feature order is deliberate. **Ask + Explain + Trace** make the harness visible and are the
only ones that need no model. **Analyze** already exists. **Review**, **Watch**, **Draft**
build on the same context and each is one skill plus one pack.

## 11. Testing

The reason the three-layer split matters: two thirds of this is testable without a model.

- `router.test.ts` — score table, caps, −∞ cases, stage inference, conditions, tiebreak.
- `gate.test.ts` — every tier boundary, kill switch, write cap, tier-4 rejection from the
  model path, pending-token single use and expiry.
- `registry.test.ts` — schema validation, truncation, `checkFn`, unknown tool.
- `learning.test.ts` — Wilson bound against hand-computed cases, TF-IDF ordering, thresholds.
- `prompt.test.ts` — cached prefix byte-identical across turns, shed order, budget assertion.
- `loop.test.ts` — a `FakeModel` that emits scripted tool calls: step cap, overflow trim,
  block-twice stop, pending resume, event order.
- `harness.test.ts` — golden turns: "why was it blocked", "size it", "what did I journal",
  "draw the levels" — asserting refs and numbers against the desk's own values.

No test asserts model prose. Assertions are on tool calls, verdicts, event shapes and refs.

## 12. Phases

Each phase ships a diff that stands alone and keeps `typecheck`, `test` and `build` green.

**B2 — the machine, no model.** `types`, `registry`, `router`, `skills`, `prompt`, `gate`,
`audit`, the 17 tools, `route_why`, `answer.ts` wired as the only model client.
*Acceptance:* a turn runs end-to-end with `FakeModel` and with the deterministic client;
routing and tiers fully covered; the panel renders `tool` events; nothing regressed in the
179 existing tests.

**B3 — memory and learning.** The four stores, workspace precedence, TF-IDF recall, the
review scorer and the Wilson gate, `/memory` and `/trace`.
*Acceptance:* a fact added in one session changes the next turn's prompt; a learning below
10 uses is labelled unproven; audit rows carry `trace_id` and `blocked`.

**B4 — model turns.** `ModelClient` over `fetch`, `POST /api/ninth/turn` streaming SSE, the
provider adapter and model tiers (main / cheap), overflow recovery, the offline fallback.
*Acceptance:* with a key, a real turn streams tokens and executes tools; without one, the
same question still answers from the desk and says no model is connected.

**B5 — Review and Draft.** `/review` over four fixed roles; `/draft` to Pine and `simulate`.
*Acceptance:* both are read-only, both cite the desk's numbers, both refuse when the rule
did not fire.

**B6 — Watch.** Stored conditions checked on load, surfaced by Ninth.
*Acceptance:* a condition that fires produces one message, cannot trade, and is removable.

## 13. Decisions we are making now (and the alternative we rejected)

1. **TypeScript skill defs, not markdown + frontmatter.** Rejected markdown-at-runtime: we
   have no parser, no frontmatter dependency, and `bun test` cannot typecheck prose. The
   *shape* (id, description, ≤800-token body, keywords, tools, conditions) is theirs.
2. **Our own loop, not the AI SDK.** Rejected a dependency for a six-step loop we must unit
   test.
3. **Injected ports, not direct storage imports.** Rejected importing `lib/desk` inside
   shared modules: it would make the harness untestable and couple the Worker to the browser.
4. **Deterministic review, not a cheap-model review on every turn.** Rejected per-turn
   spend; their threshold numbers are reused, their trigger is not.
5. **Tier 4 for ticket confirmation.** Rejected putting confirm under the model's reach just
   because it is "only paper" — the invariant is the product.
6. **No D1, no accounts.** Rejected a database in this phase: the desk is a browser demo, and
   a sync surface would need auth we do not have.

## 14. Open questions for the owner

1. **Provider.** Which model provider and key? It must arrive as a Worker secret; nothing
   else works in this deployment. Until then B2 and B3 are fully buildable and B4 is blocked.
2. **Approval posture.** Confirm *every* write (default in this plan), or confirm-once per
   session for journal appends and memory writes? The plan takes the stricter option.
3. **How far to go on Review.** Four fixed roles (proposed) or a configurable pipeline
   (their Roundtable)? The fixed version is a day; the configurable one is a product.
