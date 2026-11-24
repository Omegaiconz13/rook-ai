# 01 — What Minara is, and every surface it ships

## The one-line version

Minara calls itself an **AI-native financial OS** and, in its own marketing, a **personal AI CFO
for digital finance**. You talk to it in plain language and it will research, plan, and execute
across crypto, US and Korean equities, futures, indices, commodities, forex, RWA, DeFi and
prediction markets — from a custodial wallet it holds for you.

That last part is the whole business. Everything else is in service of "the model can move money".

## The three claims that define the product

1. **It executes, not advises.** There is a real wallet, real order routing to real venues
   (Hyperliquid and Lighter for perps), real deposits and withdrawals. The assistant is allowed
   to spend.
2. **It does not rely on web search.** Their Tool Stack page states this explicitly: general web
   search is "often unreliable and outdated", so they integrate 50+ industry data providers
   instead. Market claims are grounded in structured, licensed data.
3. **Not all of it is in the cloud.** A domain-native model family (DMind) runs the finance
   reasoning, deliberately split across on-device, local and cloud tiers so wallet data need not
   leave the machine. See `04-api-data-models.md`.

## Surfaces

| Surface | URL / location | What it does |
|---|---|---|
| **AI Chat** | `minara.ai/app` | The general agent. Asks, researches, writes code in a workspace, can trade. |
| **Agent** | `minara.ai/docs/agent` | The agent product proper: goals, plans, tool use, long-running tasks. |
| **Trading Copilot** | `copilot.minara.ai` | Perps signal generator. Structured long/short/neutral plans with entry, TP, SL. |
| **Autopilot** | inside `/app/trade` | Hands-off execution of Copilot/strategy signals, with a **Sharpe guard**. |
| **Strategy Studio** | `/app/trade/strategy-studio` | Write, backtest, optimise and deploy strategies in **Pine Runtime** (a TypeScript DSL). |
| **Strategy Market** | `/app/trade` → market | Discover, compare, evaluate, run and publish strategies; creators earn. |
| **Benchmark** | `/app/trade` → Benchmark | Minara's own two live strategies, public trade log and AI reasoning. Proof of work. |
| **Automations** | desktop app only | Scheduled/market-triggered jobs: briefs, alerts, wallet monitors, trading plans. |
| **Workspace** | web + desktop | Private per-task cloud sandbox (web) or local folder (desktop) for files, code, results. |
| **Minara Skills** | GitHub, MIT | Puts all of the above inside Claude Code, Codex, OpenClaw, Hermes as a skill. |
| **Agent API** | `api-developer.minara.ai` | HTTP access to chat, swap intents, perps suggestions, prediction-market analysis. |
| **x402** | `x402.minara.ai` | Pay-per-call access to the API in USDC, no subscription. |

The product ladder is deliberate: **Chat → Copilot → Autopilot → Strategy Studio → API**. Manual
conversation is the on-ramp; the money is in letting it run unattended.

## Every feature, grouped

**Research and analysis**
- Ask / research (short take vs deep report), asset research per ticker
- Market scanning and discovery (`scan-markets`, trending tokens/stocks, fear & greed, BTC metrics)
- Institution review — a deeper diligence pass on an asset or thesis
- Portfolio coverage — what you hold, what it implies
- Prediction-market analysis and a dedicated Prediction Market Copilot
- Multimodal input: screenshots, PDFs, spreadsheets into the workspace

**Trading**
- Spot buy/sell/swap/convert across 19 networks (EVM chains, Solana, Hyperliquid, Polymarket, XLayer, Monad, Berachain…)
- Perpetual futures on Hyperliquid and Lighter: market and limit orders, leverage, multi-wallet
- Limit orders for both spot and perps
- Prediction markets (Polymarket)
- Order types, liquidations and margin references are documented properly, which tells you how
  much of their support load is "why did my position close"

**Money movement**
- Custodial wallet, deposit addresses, spot↔perps funding, withdrawals, transfers
- Credit-card on-ramp via MoonPay
- x402 payments — the wallet can pay an HTTP 402 challenge directly, so the agent can buy API access

**Programmability**
- Strategy Studio: time-series and cross-sectional strategies, backtests, parameter and factor
  optimisation, deploy, share, sell
- Automations: trigger → steps → delivery, in plain language
- Agent API and x402 for outside code

**Trust and safety (their framing)**
- Six-stage money safety, on-device final go/no-go
- Security audits published, bug bounty program, wallet-security and data-security pages
- "Benchmark" as radical transparency: their own strategy losses shown unfiltered

## Pricing and metering

Two separate meters, which is the right design and worth copying:

| Plan | Price | Credits/mo | Active workflows | Agent tier |
|---|---|---|---|---|
| Free | $0 | 300 | — | — |
| Lite | $19 | 1,400 | 5 | Smarter |
| Starter | $49 | 4,000 | 20 | Smarter |
| Pro | $199 | 20,000 | 50 | Smartest, **API access** |

- **Credits** meter *AI work*: chat, research, scheduled runs, API calls, "Minara Call" workflow
  nodes.
- **Trading fees** meter *money movement*, separately. Wallet ops (deposit, withdraw, balance) are free.
- **Sparks** are a third, non-monetary reward currency for ecosystem perks.
- Subscriptions lapsing resets you to the Free tier's 300 credits — a hard downgrade, not a grace period.

The lesson for Rook: do not bundle "model thinking" and "trade execution" into one meter. They have
different cost drivers and different risk profiles, and users accept paying for trades far more
readily than paying per question.

## Positioning, in their words

From `llms.txt`, the four phrases they want indexed: **AI Chat, AI Workflows, Custodial Agent
Wallet, Market Discovery, Vibe Trading, Deep Research**. "Vibe trading" is the tell — the target
user is not a quant, it is someone who wants to describe an intention and have it happen.

Their competitive moat is not the model. It is (a) the custodial wallet + venue integrations, (b)
the licensed data stack, (c) the safety theatre that makes execution palatable, and (d) the skill
pack that puts them inside other people's agents.

## What is genuinely unusual

- **Benchmark.** Running your own strategies with real capital and publishing every trade,
  including losses, is rare and expensive. It buys the right to say "autopilot works".
- **Sovereign model split.** Deciding *where* inference happens by risk class, with the final
  transaction decision pinned to the device.
- **Strategy marketplace with creator earnings.** Turns users into supply.
- **x402 as first-class payment.** The agent paying for its own data is a real architectural bet.

## What it is not

- Not a broker-dealer you can audit; custody is theirs and the docs are honest that you are trusting them.
- Not open source except the skill pack. The harness internals are inference, not documentation.
- Not a backtesting-first tool. Strategy Studio is real, but the funnel starts at chat.
