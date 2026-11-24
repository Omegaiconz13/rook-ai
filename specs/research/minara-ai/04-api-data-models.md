# 04 — API, payments, data stack, and the models underneath

## Agent API

Base: `https://api.minara.ai` (docs list `api-developer.minara.ai` for the reference; the auth page's
working example uses `api.minara.ai`). Versioned path: `/v1/developer/…`.

**Access gate:** API keys require the **Pro** plan ($199/mo). Lite and Starter show an upgrade
prompt where the key UI would be. Pay-as-you-go via x402 has no plan requirement.

**Auth:** `Authorization: Bearer sk-minara-…` on every request.

### Endpoints

| Capability | Shape |
|---|---|
| **Developer Chat** | `POST /v1/developer/chat` — the general agent turn. Supports `stream: true` and `background: true`. |
| **Chat request status** | `GET /v1/developer/chat/requests/{id}` — accepts the server `id` (`bg_abc123`) or your own `requestId`; must use the same key that created the job. |
| **Intent-to-swap transaction** | Returns a ready-to-execute swap payload rather than prose. |
| **Perpetual trading suggestion** | Structured long/short/neutral plan with entry, TP, SL. |
| **Prediction market analysis** | Analysis over Polymarket-style markets. |

Three design choices worth copying:

1. **Structured output over prose.** The trade endpoints return orders, not paragraphs. The
   recommendation and the executable payload are the same object.
2. **`background: true` + `requestId`.** Long research runs are accepted `202` and polled; the client
   supplies an idempotency key. `background` with `stream` is a `400`, which is the honest answer.
3. **Status polling by client id or server id.** Removes the "did my request land?" class of bug.

## x402 — the agent pays for its own data

- Well-known descriptor: `https://x402.minara.ai/.well-known/x402`; server `https://x402.minara.ai`.
- Live endpoints: `POST /x402/chat` and `POST /x402/chat/expert`, Base chain, USDC.
- Descriptor is plain OpenAPI 3.0, so an agent can discover and call it without a human reading docs.

Flow:

1. Call without payment → `402 Payment Required` with `paymentInstructions`
   (`amount`, `currency`, `recipient`, `chain`).
2. Pay on-chain (USDC on Base, Solana or Polygon).
3. Retry with `x-payment-response: <proof>` header.
4. Server verifies, settles, returns the response.

Body is `{ "userQuery": "…" }`, response is `{ "content": "…" }`. The specialised tier is
`/x402/chat/expert`.

Why this matters more than it looks: it means a third-party agent with **no Minara account** can buy
one answer, and the Minara *wallet* can pay for other people's x402 APIs. That closes the loop — the
agent can fund its own tool use. Rook cannot do this (no wallet, paper only), but the pattern for
Rook is a per-call budget on the model proxy, not a subscription.

## Docs as an agent surface (three ways in)

1. `<page>.md` — raw markdown for any docs page.
2. `llms.txt` at both site root and `/docs` — curated index, which is how this corpus was built.
3. **MCP server**: `https://minara.ai/docs/~gitbook/mcp` — search and read the docs over MCP.
   Plus `GET <page>.md?ask=<q>&goal=<g>` for a synthesised answer with excerpts.

Any serious developer product in 2026 needs all three. The `ask`+`goal` pair is a nice touch: the goal
lets the retrieval step pick a different answer for "what is an API token" depending on whether you are
debugging CI or onboarding.

## The data stack — why there is no web search

`technology/tools-integration.md` is blunt: Minara does not use web search for actionable insight
because it is "often unreliable and outdated". They integrate **50+** providers in three classes:

| Class | Content |
|---|---|
| **Finance** | transactions, stocks, crypto, DeFi, NFTs, liquidations, Web3 project/VC data |
| **Audience** | entities, holders, smart money, social identities, P&L, relationship graphs |
| **Sentiment** | news, X posts and trends, Fear & Greed, macro signals, policy headlines |

Plus their own private database: on/off-chain identity, wallet tags, internal knowledge base.

The architectural consequence: **market claims are always backed by a named provider with a known
latency**, never by a search result. For Rook this is the hardest gap to close cheaply — Rook uses
delayed Yahoo bars from a pinned fixture. That is fine for a paper desk, but it means Rook must be
explicit about data provenance on every surface, which it already does partially via `dataset.ts`
and the fixture labelling.

## DMind — the model layer

Open-source research org (`dmind.ai`). Seven models across three generations, 270M → 21B.

| Model | Size | Role | Where it runs |
|---|---|---|---|
| DMind-3-Nano | 270M | Transaction-time safety check | On device, no network |
| DMind-3-Mini | 4B | Strategy analysis, private research over holdings | Local |
| DMind-3-Oracle | 21B, 256k ctx | Market-wide research, cross-chain, long reports | Cloud |

Plus: a Web3 evaluation suite (1,917 expert-reviewed questions, 9 sub-domains, accepted to KDD 2026),
a TypeScript SDK, and published weights/training data. Training methods documented as HPS and C³-SFT.

The **sovereign architecture** rule: the final go/no-go on a transaction happens on the user's device,
never in the cloud. General models (Claude, GPT) handle non-finance work.

Copy the principle, not the models: *risk-class determines tier*. Cheap deterministic check on-device →
small local model for anything touching private holdings → big cloud model only for public aggregation.
Rook already does the first (plain-code gate) and the third is skippable entirely.

## Venues and assets

- Perps: **Hyperliquid** and **Lighter** (separate liquidity docs, separate quirks).
- Prediction markets: Polymarket.
- Spot: 19 networks — Ethereum, Base, Arbitrum, Optimism, Polygon, Avalanche, Solana, BSC,
  Berachain, Blast, Manta, Mode, Sonic, Conflux, Merlin, Monad, Polymarket, XLayer, Hyperliquid.
- Equities: US and Korean stocks, via tokenised/tradfi rails; commodities, forex, indices for analysis.

## Fees and metering (the two-meter design)

- **Credits** = AI work: chat, research, scheduled runs, API calls, "Minara Call" workflow nodes.
- **Trading fees** = execution, charged per trade, documented separately in `trade/trading-fees.md`.
- Wallet operations are free.
- Subscription lapse → balance drops to the Free tier's 300 credits.

Documented reference pages that most products skip and shouldn't: **liquidations**, **margin and
leverage**, **order types**, **portfolio coverage**. Those pages exist because execution products
generate support load from people who did not understand the mechanics. Rook should ship the paper
equivalents — its journal/refusal surface is already half of one.

## What their API does not publish

- Rate limits beyond credit metering.
- Webhook/streaming push for fills (polling only as documented).
- Any sandbox or test-mode for the developer API. Pro-only keys means you pay before you can test.
