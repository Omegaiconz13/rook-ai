# Minara, read as a system

Research date: 2026-11-24. Scope: how the Minara product actually works — the harness,
the routing, the tool layer, the memory and learning stores, the safety stack, and the
shape of the published skill pack — so Ninth can be built on the same mechanics without
copying a pixel of their interface or a line of closed source.

Everything below is either **observed** (quoted or paraphrased from a public source, with
the URL) or **inferred** (marked, and treated as a hypothesis to test before we rely on it).
Nothing here is taken from Minara's private roadmap or from an unpublished repository.

## Sources

| What | Where | State |
| --- | --- | --- |
| Web app / harness product docs | <https://minara.ai/docs>, `/docs/agent`, `/docs/get-started/how-minara-works` | public |
| Agent docs, including system design internals | <https://agent.minara.ai/docs> | public |
| System design: loop, skills, memory, safety, workspace, observability | <https://agent.minara.ai/docs/system-design/*> | public |
| Tool reference (tool sets, tiers, counts) | <https://agent.minara.ai/docs/reference/tools> | public |
| Skill pack | <https://github.com/Minara-AI/minara-skills> (MIT) | public, cloned-read |
| CLI (the pack's runtime) | `minara@latest` on npm; `Minara-AI/minara-cli` | public docs, closed behaviour |
| Agent source tree | `github.com/Minara-AI/minara-agent` | **404** — the docs link to paths in it, but the repo is not public |
| Org repositories | <https://github.com/orgs/Minara-AI/repositories> | 11 repos, mostly skills, docs, CLI |

The single most useful finding: **`agent.minara.ai/docs` is not marketing.** It documents
module by module (`apps/agent/src/agent/runtime.ts`, `skills/router.ts`,
`tools/_security/tier-gate.ts`, `learning/review-engine.ts`, …), including numeric
thresholds. That is why this plan can copy mechanics rather than guess at them.

## What Minara is, mechanically

> "Our design starts with a separation of responsibilities: the model reasons and
> proposes; the harness manages context, access, and execution."
> — <https://minara.ai/docs/agent>

The product is four layers stacked on that sentence:

1. **A conversational surface** (`/app/chat`) that streams a turn, shows tool activity,
   and renders artifacts (charts, documents, dashboards). The same agent is reachable
   from a desktop app, a CLI/REPL, and an HTTP gateway — one runtime, several front doors.
2. **A capability layer**: a skill registry (routing + playbooks) and a tool registry
   (typed handlers with permission tiers). ~60 named tool sets in the reference,
   including `minara_core` (51 tools), `core` (33), and MCP-backed sets like `fmp` (267).
3. **A control layer**: permission tiers, a hook pipeline, a six-stage finance safety
   stack, spend caps, a kill switch, and an audit log that records blocked calls
   distinctly from successful ones.
4. **A continuity layer**: four memory stores plus a markdown workspace, and a learning
   loop that graduates rules only on statistical evidence.

The business surface (spot, perps on Hyperliquid/Lighter, DeFi, MoonPay on-ramp, x402
metered APIs, strategy marketplace) is real-money infrastructure we will not build. The
**mechanics** are what transfer.

## 1. The turn pipeline

Observed, <https://agent.minara.ai/docs/system-design/agent-loop>:

```
user message
   │
   ├─ pre-turn:  preference graduation · input scanner · prompt assembly
   ├─ compaction: persisted boundaries · media eviction · threshold/idle compaction
   │              with top-N reinjection
   ├─ streamText: stepCountIs(maxSteps); prepareStep trims the token budget per step;
   │              overflow-recovery guard trims and retries a step that blows the window
   ├─ dispatch:   tool call → intent/argument validation → tier gate → safety hooks → handler
   └─ end-of-turn: post_turn event → decision capture · chat-turn row · workspace state ·
                   dashboard cache invalidation · learning review
```

Two invariants they call load-bearing:

- **One `ToolCallContext` per turn.** Risk ceiling, signal context and the used-tools set
  travel on it (threaded with `AsyncLocalStorage`) so concurrent turns cannot see each
  other's bookkeeping and sub-agents inherit the parent's limits.
- **The cached prompt prefix is immutable mid-turn.** Activating a skill mid-turn appends
  a note instead of rebuilding the prompt, "because rebuilding the prefix would break the
  prompt cache."

Prompt assembly is declarative blocks, not string concatenation — identity and the skill
catalog are `cache: true`, active-skill text and signal context are not. Their note that
"a poorly ordered prompt can turn what looks like one Claude call into three cache misses"
is a warning we should take seriously even at our scale.

**Inferred:** `maxSteps` is per-turn configurable and defaults somewhere in the 10–25
range; the docs never print the default. We should pick our own number rather than guess
theirs.

## 2. Skills: the routing layer

Observed, <https://agent.minara.ai/docs/system-design/skills-system>. A skill is a
declarative unit:

```ts
{
  id: 'minara.core',
  kind: 'domain_skill',
  description: '≤ 80 chars — this is what the LLM chooses on',
  prompt: '≤ 800 tokens (~3 KB) of guidance',
  tool_names: [...],            // minimal: "a skill with 20 tools is usually two skills"
  activation: 'auto',
  priority: 50,
  routing: { lifecycle_stages, keywords, asset_classes },
  co_activate: [...],
  conditions: { requires_env, requires_tools, requires_toolsets,
                fallback_for_tools, platforms }
}
```

### The three layers

| Layer | Nature | Job |
| --- | --- | --- |
| L0 router (`buildRoutedCatalog()`) | **deterministic** | score every skill against the turn, drop the impossible ones, render a compact catalog |
| `activate_skills(ids)` | **non-deterministic** | the main model picks from the catalog and loads playbooks |
| tool-call gate (`tier-gate.ts`) | **deterministic** | tiers, confirmations, safety hooks at invocation |

Their stated reason for this split: "the two ends of the pipeline are testable without an
LLM." That is the design we want, and it is the reason the current deterministic
`answerNinth` can survive as the L0-only path instead of being thrown away.

### L0 scoring, exactly

| Signal | Score |
| --- | --- |
| keyword hit in the user message | +30 each, **capped +60** |
| lifecycle stage match | +20 |
| asset class match | +15 |
| `co_activate` from another hit | +10 |
| signal-source match (cron/webhook turns) | +25 |
| fallback (priority tiebreaker) | `100 − priority` |
| negative keyword hit | **−∞** (dropped, never shown to the model) |
| failed `conditions` | **−∞** (dropped) |

The output carries the *reasons* it scored (`['kw:buy', 'stage:decide']`), rendered inline
in the catalog so the model sees why a skill is on the list. Conditions are the graceful
degradation knob: a skill requiring `GLASSNODE_API_KEY` simply does not exist on a machine
without it.

### Budgets

- `SKILL_BODY_BUDGET_CHARS = 12000` (~3000 tokens) for the concatenated active bodies.
- When the budget is tight, **lowest-priority bodies are shed first**; their tools stay
  callable, their prose is dropped, and the catalog tags them `(active, body shed)` and
  inlines their `summary` so mid-detail guidance survives.
- "No skill is always-active." Identity, safety invariants, language policy and the
  markdown wire protocol live in a cached system-prompt skeleton instead.
- A baseline tool set is callable every turn (`activate_skills`, asset resolution, token
  search, `memory_*`, `todo`); on the main session any registered tool is reachable
  through `tool_invoke`.

### Stages

`discover` ("what's trending", "price of") → `evaluate` ("should I", "analyze", "risk") →
`decide` ("buy", "sell", "long") → `manage` ("close", "stop loss", "my positions").

### What they retired, and why it matters

The standalone **Scenario Registry was retired in May 2026**; routing now belongs to
skills, analytical substance to Institution playbooks, collaboration to the Roundtable
pipeline, long-form output to Deep Research's fixed six-step flow, and reusable rules to
the methodology store (<https://agent.minara.ai/docs/system-design/scenarios>).

That is a direct warning: a central intent catalog becomes a bottleneck. Build routing
next to the capability; keep the *playbook* separate from the *router*.

## 3. Tools: typed, tiered, grouped

Observed, <https://agent.minara.ai/docs/reference/tools> and `/system-design`:

```ts
interface ToolEntry {
  name: string; toolSet: string; schema: ToolSchema; handler: ToolHandler;
  permissionTier: PermissionTier; isAsync: boolean; description: string;
  checkFn?: () => boolean;      // runtime availability gate
}
```

| Tier | Name | Examples | Behaviour |
| --- | --- | --- | --- |
| 1 | `READ_ONLY` | price, balance, search, `read_file` | runs immediately |
| 2 | `CONFIRM_ONCE` | analysis, research, small swap | confirm on first use, then remembered for the session |
| 3 | `ALWAYS_CONFIRM` | `write_file`, `patch`, fund-moving, document generation | every call; autonomous calls need a stored grant |
| 4 | `MANUAL_ONLY` | withdraw to an external address, kill-switch flip | explicit approval; **autonomous calls rejected outright** |

Tool sets (`read`, `trade`, `perps`, `file`, `browser`, …) compose with `includes` and are
what the gateway and automation actually reason about: a cron/autopilot turn runs with
`allowedToolSets: ['read','memory','web']` and nothing else. Tiers are enforced by a
`BeforeToolCallHook`; a block throws `ToolCallBlockedError`, which the loop feeds back to
the model as an ordinary tool result — *the model sees a tool error, the audit log sees a
blocked call*.

Hook order (their list, in order): emergency stop → daily spend cap → per-transaction max
→ tier gating on autonomous turns → manual-only enforcement.

Registration is defensive: factories whose env vars are missing return `[]` and never
throw at boot.

## 4. Money safety: six stages, each cheaper than the mistake it catches

Observed, <https://agent.minara.ai/docs/system-design/finance-safety>. Their argument for
stacking six orthogonal checks rather than one LLM judge: "an error has to slip through all
of them to move real funds … one big LLM judge check would be higher cost and miss the
categorical errors that a 1-line typed guard catches."

```
trade intent
  → token-safety        canonical address, known-scam list, chain resolution   (hook priority 50, runs before tiers)
  → position-sizing     fixed_usd | fixed_fraction | half_kelly, always clipped by the per-tx cap
  → exposure-limits     maxPerTokenUsd 5000 · maxPerChainUsd 15000 · maxPerAssetClassFraction 0.40 · maxTotalExposureUsd 50000
  → slippage            <$1k → 2.0% · $1k–$10k → 1.0% · >$10k → 0.5%   (simulate → impact → reject)
  → risk-manager        per-tx $500 · daily $2000 (atomic check-and-debit, BEGIN IMMEDIATE) · kill switch
  → execution
  → stop-loss           decides only; the close still passes every gate above
```

Details worth stealing literally:

- The sizing decision carries a `clipped` boolean so audit queries can ask "how often did
  the cap bind?" — a cap you cannot measure is a cap you cannot tune.
- The daily cap is debited **atomically** so two concurrent trades cannot both pass.
- The leverage cap is a hard `maxLeverage: 10`, no aggregation across positions yet — they
  say so plainly instead of implying completeness.
- Stop-loss has no bypass path during an exchange outage.

## 5. Memory and learning: four stores, one markdown ground truth

Observed, <https://agent.minara.ai/docs/system-design/memory> and `/workspace`:

| Store | Scope | Written by | Trust |
| --- | --- | --- | --- |
| Memory System | per-user observations, preferences, trade/strategy notes | LLM via `memory_write` | fresh, **unvetted** |
| Personalization | profile: financial tags, custom prompt, persona files | user (CLI/REST) + inferrer cron | authoritative but sparse |
| Role Memory | per-role decision cases + failure modes | analysis skills; reflector async | hard gates: only `logic_error`/`missing_data` resurface |
| Learning System | tool sequences, guidance notes, methodologies | `skill_learn`, backtest runner, scenario bootstrapper | **Wilson lower bound ≥ 0.55, ≥ 10 uses** |

The workspace is plain markdown and it **wins** over anything inferred: `SOUL.md`,
`AGENTS.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md` (`## Facts` / `## Preferences` /
`## Decisions`), `BOOTSTRAP.md`, `TOOLS.md`, `HEARTBEAT.md`, `memory/YYYY-MM-DD-<session>.md`.
Prompt order is identity → memory snapshot → bootstrap → catalog/playbooks/personalization
→ derived layers. `HEARTBEAT.md` is deliberately excluded from the prompt: "a previous
query or open loop cannot become an instruction in a new chat." Dreaming (overnight
consolidation of journals into `MEMORY.md`) is **off by default**, tail-truncates each log
to 64 KB, holds a `.dreaming.lock` against double promotion, and quarantines source logs
when its output trips the PII filter.

Learning, quoted plainly: "not fine-tuning or weight updates. The model stays the same.
What changes is what the agent retrieves from SQLite before each turn."

- Review engine: a cheap-model pass per turn, skipped below `MIN_CALLS=3`, writes only at
  `SCORE_THRESHOLD=7`/10, records `{score, summary, suggested_trigger, suggested_tool_sequence}`.
- Recall: TF-IDF over the message + router context, top `K=3`, injected as a `<learnings>`
  block.
- Methodologies: phase trees with success criteria, deduplicated through a judge forced
  into a finite vocabulary, graduated on Wilson LB.
- Budgets are categorized (`learning`, `agent`, `workflow`, `experiment`) so offline
  experiments can never eat production spend.

## 6. Observability

Observed, <https://agent.minara.ai/docs/system-design/observability>: three streams sharing
a `trace_id`, because "behavior → audit, permissions → tier_events, infra → structured logs".

```sql
CREATE TABLE audit (
  id TEXT PRIMARY KEY, session_id TEXT, trace_id TEXT, tool_name TEXT, tool_set TEXT,
  args_json TEXT,          -- redacted
  result_json TEXT, blocked INTEGER, block_reason TEXT, permission_tier INTEGER,
  source TEXT,             -- user | cron | autopilot | delegation
  duration_ms INTEGER, created_at INTEGER
);
```

Plus an FTS index. Their example queries are the ones we want on day one: *why was this
rejected*, *how often did sizing bind*, *which symbols hit exposure limits*.

## 7. The published skill pack (what the MIT repo actually contains)

Observed from the GitHub tree and `skills/minara/SKILL.md` (v3.0.4, 22,956 bytes):

```
skills/minara/
  SKILL.md                    frontmatter (name, version, description, install spec) + routing table
  setup.md                    install/auth bootstrap
  scripts/version-check.sh    session-level update check against the CLI
  references/                 16 modular docs, loaded on demand
    auth-recovery, swap, transfer, balance, deposit, withdraw,
    perps-order, perps-manage, perps-wallet, perps-autopilot,
    limit-order, chat, discover, auth, premium, interactive-commands, …
scripts/                      Claude Code / OpenClaw / Hermes installers
```

The pattern is **progressive disclosure done in markdown**: the `SKILL.md` is a router
("Triggers | CLI Command | Reference") that costs ~1 file, and each row points at one
reference doc loaded only when that intent wins. Release notes for v3.0.0 describe the
change explicitly: "split into 16 modular reference docs with intent routing table for
on-demand loading, reducing context usage."

Behavioural rules the pack enforces, all of which transfer to a paper desk:

- **Routing gate:** finance/trading action **and** at least one crypto/chain/Minara signal;
  pure blockchain education must not activate it.
- **Analysis → trade boundary:** "NEVER execute any fund-moving command in the same turn as
  analysis output." Analysis completes; a suggestion may be appended; the user must reply.
- **Confirmation is two messages:** balance check first, then autopilot guard, then chain
  resolution, then a summary table — and the response ends there. Execution happens only
  after a real user reply. "Prior messages expressing intent do NOT count as
  confirmation." Changing any parameter voids the previous confirmation.
- **Banned:** adding `-y`, skipping the choice step, or **fabricating a user confirmation**
  ("instant safety failure").
- **Anti-loop:** prefer non-interactive flags, max one retry, declare a hang after 15 s of
  no output, never run bare interactive commands.
- **Token safety:** USDC vs USDC.e, WBTC vs BTC, WETH vs ETH; canonical address checks;
  address-format validation per chain; honeypot and airdrop-claim warnings.

**Inferred:** the pack's real work happens in the closed `minara` CLI, including the
confirmation UI ("CLI confirm → Touch ID → execute"). We cannot and should not reproduce
that; the *sequencing* is what we adopt.

## 8. What is not copyable, and what we should not copy

- **Source.** `Minara-AI/minara-agent` is 404. The docs reference file paths inside it, so
  the internals are described but not licensed to us.
- **Money movement.** Wallets, Hyperliquid/Lighter perps, MoonPay on-ramp, x402 payments,
  strategy marketplace subscriptions. Out of scope by our own constitution (paper only,
  no live orders, no keys).
- **Desktop computer-use, coding agents, browser automation.** Large surface, no bearing on
  a paper desk.
- **Their UI.** Explicitly excluded by the brief: we take the machine, not the skin.
- **MCP as the core tool protocol.** Their own note: finance tools need per-call tiers,
  typed schemas and confirmation gates that MCP's spec does not cover — so they kept an
  in-house registry and used MCP only at the edges. We have the same need and should reach
  the same conclusion.

## 9. Numbers worth pinning (the whole table in one place)

| Constant | Value | Source |
| --- | --- | --- |
| skill description | ≤ 80 chars | skills-system |
| skill prompt body | ≤ 800 tokens (~3 KB) | skills-system |
| active-body budget | 12,000 chars (~3,000 tokens) | skills-system |
| keyword score | +30, cap +60 | skills-system |
| stage / asset / co-activate / signal | +20 / +15 / +10 / +25 | skills-system |
| learnings: min calls, score, top-K | 3 / 7 of 10 / 3 | learning-system |
| methodology graduation | Wilson LB ≥ 0.55, ≥ 10 uses | memory |
| per-tx / daily cap | $500 / $2,000 | finance-safety |
| exposure | $5k token / $15k chain / 40% class / $50k total | finance-safety |
| slippage tiers | 2.0% / 1.0% / 0.5% | finance-safety |
| leverage cap | 10× | finance-safety |
| dreaming input | 64 KB tail per file, 256 KB total, off by default | workspace |
| audit | `trace_id`, `blocked`, `block_reason`, `permission_tier`, `source` | observability |

## 10. Open questions this research could not settle

1. Default `maxSteps` and the per-turn token budget (never printed).
2. How the web app's chat renders tool activity beyond the docs' prose — screenshots are in
   the docs, but the component behaviour is not documented.
3. Whether `minara` CLI's confirmation is enforced locally or only by the skill prose. The
   pack says "CLI confirm → Touch ID"; the binary is closed.
4. Whether their L0 router ships negative-keyword lists per skill or derives them; only the
   mechanism (`−∞`) is documented.

None of these block our design; each is a place to choose our own number and write it down.
