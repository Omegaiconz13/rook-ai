# 02 — The harness, as far as it can be observed

This page is the *what*; [`../2026-11-24-minara-system-research.md`](../2026-11-24-minara-system-research.md)
is the deeper *how* (turn pipeline, L0 routing scores, budget stages, the six money-safety gates).
Read that first if you are implementing. This page adds what the full corpus settles that the
earlier note could not, and is honest about what is still inference.

## The published contract: research → preview → action

Minara documents its own permission model in `technology/safety-and-approvals.md`, and it is
unusually precise. Three stages:

| Stage | What happens | Approval needed |
|---|---|---|
| **Research** | Reads data, compares evidence, explains options | No |
| **Preview** | Prepares the order/action with price, size, risks | No |
| **Action** | Places the trade, sends the transfer, publishes | **Yes** |

And four things that explicitly **do not** count as approval:

1. The model deciding a trade looks reasonable.
2. A remembered preference or past approval.
3. Text inside a document, web page or file. (Prompt-injection is named as a threat, not hand-waved.)
4. A prior turn's intent. Changing any parameter voids the confirmation.

That is the spec Rook's gate should satisfy, and it is stricter than most agent frameworks: the
approval is bound to *this exact action payload*, and the payload is what gets re-verified, not the
conversation.

## Turn shape

Every Minara turn is: **route → plan → typed tool calls → verify → answer → journal**. The
consequential bits:

- **Routing happens before generation.** A deterministic scorer picks which skill/playbook applies,
  so the model is not asked "what can you do?" every turn. This is the single biggest latency and
  reliability win, and it is the part most clones miss.
- **Tools are typed and tiered.** Read-only tools run freely; fund-moving tools are gated. The model
  cannot promote a tool's tier by asking nicely.
- **Budgets are per playbook.** A quick quote gets a small budget; deep research gets a large one. No
  unbounded loops.
- **Every turn is journaled** with the route, the tool calls, the refusal reason if any.

## Memory: four stores, one markdown ground truth

1. **Structured profile** — holdings, chains, risk settings, stated preferences.
2. **Episodic** — what was asked and decided, per conversation.
3. **Semantic/factual** — durable facts the user asserted ("I only trade majors").
4. **Ring buffer** — the audit log, bounded, append-only.

The markdown files are the ground truth and the database is an index over them. That choice is why
their personalization is inspectable and editable by the user, and why `Export private key` /
`reset 2FA` / session pages can be written as plain procedures.

## Personalization, concretely

`reference/personalization.md` enumerates the modules, all on by default, each individually
disableable: **Trading summary** (Minara spot-wallet holdings, exposure concentration, risk
distribution, unrealized PnL), **External portfolio** (linked wallets/venues), **Custom Prompt**,
**Tags**, **Memories**. Perp wallet context is explicitly *not* integrated yet — a rare admission
of a gap and a useful reminder that they ship partial features.

Copy the shape: personalization is a set of *named, toggleable context injectors*, not one opaque
system prompt. It makes "why did it say that?" answerable.

## Workspace: the sandbox boundary

`reference/workspace.md`: every task gets its own workspace. On web it is a private cloud sandbox
per user; on desktop it is a local folder. It holds uploaded files, scripts Minara writes, and
results. The stated invariant is worth stealing verbatim:

> Everything Minara refers to in its answer should be something you can open and check.

Two features are desktop-only because they need the user's machine: **computer control** and
**Automations**. That split (cloud for thinking, local for touching) is a deliberate architecture,
not a shipping accident.

## Model routing: what runs where

`technology/dmind.md` and `sovereign-architecture.md`:

| Tier | Model | Job | Why there |
|---|---|---|---|
| Edge | DMind-3-Nano, 270M | Transaction-time safety check | No network round-trip; works offline |
| Local | DMind-3-Mini, 4B | Strategy analysis, private research over your holdings | Data never leaves the device |
| Cloud | DMind-3-Oracle, 21B, 256k ctx | Market-wide research, cross-chain, long reports | Needs global aggregation |

General models (Claude, GPT) handle non-finance work. The safety anchor: **the final go/no-go on a
transaction happens on the user's device, never in the cloud.** Whether or not the on-device model
is as good as claimed, the *architecture* is the argument, and it is a good one.

Rook's translation: Ninth is browser-side (`src/shared/ninth/`), the desk's gate is plain code, and
the model is optional via a Worker proxy. That already matches the shape — Edge = the gate and the
rules, Local = the browser, Cloud = the optional model turn.

## Observability

- Per-turn audit records: route, playbook, tools, params, verdict, refusal reason.
- A public **Benchmark** tab: their own strategies, real capital, every completed trade, entry/exit,
  PnL, and the AI reasoning behind each. MINARA V2 = BTC trend-following perps on Hyperliquid;
  MINARA V1 = SILVER perps.
- Published security audits, a bug bounty, and dedicated security-incident and data-security pages.

The Benchmark page is the cheapest trust artefact in the entire product and the one Rook can most
credibly copy, because Rook is paper-only: publishing every simulated decision, including refusals,
costs nothing and cannot be accused of hiding losses.

## What remains inference

Not documented anywhere in the corpus, and stated as open questions rather than facts:

- The exact router scoring formula and threshold (the earlier note's "L0" numbers are reconstruction).
- Whether tool tiers are enforced in the harness or in the tool implementation.
- Concurrency and rate limits on the Agent API beyond the published credit metering.
- Their evaluation harness for the assistant itself (they publish a *model* benchmark, not an agent one).

Do not present any of those as known in our own docs.
