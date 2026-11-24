# Ninth — the harness

Ninth is the agent inside the desk. It is not a chat wrapper around a model: the
routing, the loop, the tool gate and the budgets are ours, in plain TypeScript, and
each is a pure function with tests. The model is one optional step in the middle.

## One turn

```
route → compose prompt → model (optional) → dispatch tools → tool gate → repeat
```

| Step | Where | Bound |
|---|---|---|
| Route | `ninth/router.ts` | deterministic scoring, no clock, no randomness |
| Compose | `ninth/prompt.ts` | 2,000 characters in, 6 observations + 3 learnings |
| Model | `POST /api/ninth/turn` | 24,000 output tokens, SSE |
| Dispatch | `ninth/tools/*` | 17 tools, 4 sets, tiers 1–3 |
| Gate | `ninth/gate.ts` | 3 writes per turn, 10-minute pending TTL |
| Stop | `ninth/loop.ts` | 6 steps max |

## Routing

A skill is a routed unit of context with keywords, stages and the tools it may use.
The router scores each skill and keeps the top six:

| Signal | Weight |
|---|---|
| Keyword hit | 30, at most 2 hits counted |
| Stage matches the inferred stage | 20 |
| Asset word in the question | 15 |
| Co-activated with a skill already chosen | 10 |
| A stored watch fired | 25 |
| Floor, so nothing scores zero | 10 |
| Negative keyword | disqualifies the skill |

Stages are `discover`, `evaluate`, `decide`, `manage`. `/route-why` (or "why did you
answer that") returns the scores verbatim — the routing is inspectable, not vibes.

## The twelve skills

| Skill | Stages | Covers |
|---|---|---|
| `desk.core` | discover, evaluate, decide | the desk, the session, what Rook is |
| `desk.gate` | evaluate, decide | the rules, a refusal, what would change it |
| `desk.risk` | evaluate, decide | limits, sizing, exposure, daily loss |
| `desk.setups` | discover, evaluate | the four setup families and their status |
| `desk.levels` | discover, evaluate | support, resistance, the 20-day average |
| `desk.journal` | manage, discover | rows, win rate, R, what the record shows |
| `desk.ticket` | decide, manage | proposed, confirmed, filled, flat-by |
| `desk.sim` | evaluate | the seeded simulation and its assumptions |
| `desk.news` | discover | headlines on a symbol, and what they are not |
| `desk.limits` | manage | editing the reader's rules |
| `desk.memory` | manage | the reader's workspace notes |
| `desk.learn` | manage | observations Ninth is allowed to keep |

## The seventeen tools

Nothing outside this table can be called. Tools in the `decide` set are pure: they
run the same functions the pages run.

| Tool | Set | Tier | Does |
|---|---|---|---|
| `get_quote` | read | 1 | last price and session state for a symbol |
| `list_setups` | read | 1 | the setups for the session |
| `scan_desk` | read | 1 | every family, ranked |
| `list_levels` | read | 1 | levels around a price |
| `read_journal` | read | 1 | rows, filtered |
| `read_news` | read | 1 | headlines for symbols |
| `read_account` | read | 1 | equity, day P&L, trades today, risk used |
| `read_memory` | read | 1 | the reader's workspace |
| `route_why` | meta | 1 | the router's scores for the last question |
| `tool_search` | meta | 1 | what else could be called, and why not |
| `gate_check` | decide | 2 | `checkPlan()` — the verdict |
| `size_plan` | decide | 2 | shares, and which limit decided it |
| `simulate_plan` | decide | 2 | seeded Monte Carlo |
| `r_multiple` | decide | 2 | R for a price |
| `memory_write` | write | 2 | add a line to the reader's workspace |
| `journal_append` | write | 3 | write a row |
| `learn_save` | write | 3 | keep an observation |

Seven calls are always available regardless of routing: `activate_skills`,
`tool_search`, `ask_user`, `route_why`, `get_quote`, `read_account`, `read_memory`.

## Tiers and confirmation

| Tier | Confirmation | Shipped tools |
|---|---|---|
| 1 | none | all reads and meta |
| 2 | once per session | the four decide tools, `memory_write` |
| 3 | every single time | `journal_append`, `learn_save` |
| 4 | never — the desk does it by hand | none |

A tier-2/3 call mints a `PendingCall { token, tool, args, tier }` that only a UI
click can spend. It is single-use and expires in ten minutes. The model can request
one; it cannot spend one. That distinction is the whole safety model, and it is
tested.

## Stop reasons

A turn ends with exactly one:

| Reason | Meaning |
|---|---|
| `done` | a final answer, with refs |
| `steps` | hit the 6-step cap |
| `tokens` | hit 24,000 output tokens |
| `pending` | a human must confirm; no further calls this turn |
| `blocked-twice` | two refusals in one turn — stop rather than loop |

## Slash commands, no model required

| Command | Does |
|---|---|
| `/memory [add|remove] text` | read or edit the reader's workspace |
| `/trace` | the last turn's audit rows: route, tools, refusals |
| `/review [SYMBOL]` | four fixed roles over a setup the rules produced |
| `/draft [SYMBOL]` | a plan skeleton from the desk, not from a model |
| `/watch …` | list, add or remove a stored price watch |

These run with a key, without a key, and in a test. They never call the model.

## Offline behaviour

With no `MODEL_API_KEY` the Worker answers `503` on `/api/ninth/turn` and
`configured: false` on `/api/ninth/model`. The panel then answers from the desk:
setups, verdicts and slash commands all still work. The demo is the default, not a
degraded mode.

## Memory, learning, audit

- **Memory** is the reader's workspace: lines they wrote. Ninth never edits it.
- **Learnings** are Ninth's own observations, capped at 3, each requiring a proof
  (a Wilson lower bound, not an anecdote) before it is kept.
- **Audit** is a 500-row ring of what happened: the route, the tools, the refusals.
  `/trace` reads it; nothing writes to it but the loop.
