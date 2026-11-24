# Sources

All accessed **2026-11-24**. Docs pages are vendored verbatim under [`raw/`](raw/); the list below
records what each contributed so a future reader can re-check a claim without re-reading 137 pages.

## Primary — docs (GitBook)

| Source | Contributed |
|---|---|
| `https://minara.ai/docs/llms.txt` | The index that made the harvest possible: a `.md` URL for every page. |
| `https://minara.ai/docs/readme.md`, `index.md` | Positioning, product overview. |
| `get-started/how-minara-works.md`, `activate-your-account.md`, `deposit.md`, `subscribe.md` | Onboarding, account model, funding flow. |
| `trade/trading-copilot.md`, `trade/trading-copilot/asset-research.md` | Copilot inputs (multi-timeframe candles, order book, funding, OI, EMA/RSI/MACD), risk filter, structured plan output, venues. |
| `trade/trading-autopilot.md` | Unattended execution model. |
| `trade/benchmark.md` | MINARA V2 (BTC perps, trend-following, Hyperliquid), MINARA V1 (SILVER perps), transparency intent. |
| `trade/strategy-studio.md`, `trade/strategy-studio/create-time-series-strategies.md`, `create-cross-sectional-strategies.md` | Pine Runtime (TypeScript DSL), two strategy classes. |
| `trade/strategy-market*.md` (6 pages) | Discover, compare, evaluate, run, publish, creators and profiles. |
| `trade/agent-api.md`, `agent-api/api-key.md`, `authentication.md`, `api-reference-api-key.md`, `api-reference-x402.md` | Base URL, Bearer auth, Pro gating, endpoints, `background`+`requestId` idempotency, status polling. |
| `trade/agent-api/x402.md` | 402 challenge flow, `x-payment-response`, USDC on Base/Solana/Polygon, `/x402/chat`, `/x402/chat/expert`. |
| `trade/minara-skills.md` | What the skill pack is, supported harnesses. |
| `trade/trade-assets.md`, `portfolio-coverage.md`, `institution-review.md`, `scan-markets.md`, `prediction-markets.md`, `prediction-market-copilot.md`, `trading-fees.md`, `glossary.md` | Asset coverage, research surfaces, prediction markets, fee model. |
| `trade/liquidity.md`, `liquidity/hyperliquid.md`, `liquidity/lighter.md` | Venue specifics. |
| `automation/overview.md` | Trigger / steps / delivery schema, desktop-only limitation, precise-vs-judgement split. |
| `automation/price-alerts.md`, `wallet-and-trader-monitoring.md`, `scheduled-briefs-and-reports.md`, `research-monitors.md` | The four automation families. |
| `automation/automated-trading-plans.md` | Recurring buy, ladder, mirror templates; Test; permission ladder. |
| `automation/legacy-workflow*.md` (5 pages) | The retired Workflow product — useful as a record of what they abandoned. |
| `technology/safety-and-approvals.md` | Research / preview / action; four things that are not approval. **Most reused page in this corpus.** |
| `technology/tools-integration.md` | 50+ data providers, three classes, "no web search for actionable insight". |
| `technology/dmind.md`, `dmind/sovereign-architecture.md`, `model-family.md`, `benchmark.md`, `training-methods.md` | Seven models, 270M→21B, edge/local/cloud split, KDD 2026 eval suite, HPS and C³-SFT. |
| `technology/wallet-security.md`, `data-security.md`, `security-audit.md`, `minara-bug-bounty-program.md` | The compliance surface behind custody. |
| `reference/credits.md` | Plan table, what consumes credits, what does not. |
| `reference/personalization.md` | Six toggleable context modules, perp wallet gap. |
| `reference/workspace.md` | Per-task sandbox, web vs desktop, "everything you can open and check". |
| `reference/liquidations.md`, `margin-and-leverage.md`, `order-types.md`, `multimodal-input.md` | Mechanics pages that prevent support load. |
| `academy/**` (31 pages) | Strategy Studio teaching track: time-series and cross-sectional creators, followers, metrics, deploy/share, creator earnings. Source of the four-part prompt contract. |
| `support/faq/**` (40 pages) | Real failure modes: autopilot and Sharpe Guard behaviour, strategy code, deploying, API issues, wallet basics, 2FA reset, security incidents. Best evidence of actual user pain. |

## Primary — code

| Source | Contributed |
|---|---|
| `https://github.com/Minara-AI/minara-skills.git` (depth 1) | Vendored at [`skill-pack/`](skill-pack/). `SKILL.md` routing gate, confirmation state machine, anti-loop rules, full command table; `setup.md` per-harness integration; 17 references; `scripts/version-check.sh` and 3 installers. |
| `Minara-AI/crypto-skill-benchmark` (linked, not cloned) | The 88/100 score claimed in their README. |

## Secondary

| Source | Contributed |
|---|---|
| `https://minara.ai/llms.txt` | Product naming and the six key-feature phrases. |
| `https://minara.ai/sitemap.xml` + child sitemaps | Confirmed the docs tree and the 20 child sitemaps incl. Academy and Handbook in 6 languages. |
| `https://minara.ai/docs/~gitbook/mcp` (documented, not called) | The docs-over-MCP pattern. |
| `https://copilot.minara.ai`, `https://strategy.minara.ai` | Product URLs referenced in docs. |
| `https://dmind.ai/` | DMind's own site, referenced by the docs. |

## Repo-internal

| Source | Contributed |
|---|---|
| [`../2026-11-24-minara-system-research.md`](../2026-11-24-minara-system-research.md) | Turn pipeline, routing scores, budget stages, six money-safety gates, four memory stores, observability. Read alongside `02-harness.md`. |
| [`../../004-ninth-harness/design.md`](../../004-ninth-harness/design.md) | What Ninth already implements, and the explicit decision to build it "the way the Minara harness is built" without copying their UI. |
| `README.md` (repo root) | Rook's own stated invariants: supervised, one trade at a time, paper only, offline demo, journaled refusals. |

## Claims deliberately not sourced

Stated as inference, not fact, in `02-harness.md`: the exact router scoring formula and threshold, whether
tool tiers are enforced in the harness or the tool, API rate limits beyond credit metering, and any
evaluation of the agent (as opposed to the models). Their docs do not publish these, and no amount of
reading the 137 pages will produce them.
