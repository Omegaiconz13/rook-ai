> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/liquidity/hyperliquid.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Hyperliquid

[Hyperliquid](https://app.hyperliquid.xyz/trade) is an on-chain perpetuals and spot exchange running on a purpose-built Layer 1. In Minara, orders placed against a Hyperliquid wallet route to Hyperliquid's on-chain order book.

## Trust model

Hyperliquid is a self-settled Layer 1 blockchain with native on-chain order matching. It uses a custom consensus algorithm called HyperBFT (inspired by HotStuff) with one-block finality. Orders, cancellations, trades, and liquidations execute on-chain rather than on a centralized matching backend. Funds in a Hyperliquid wallet are held on the Hyperliquid chain, not by Minara.

Hyperliquid also exposes HyperEVM, a general-purpose smart contract environment that can interact with its native trading primitives.

## Deposit

Hyperliquid wallets accept USDC deposits via Arbitrum (Hyperliquid's native bridge). Deposits from other networks or tokens are not credited to the wallet.

For step-by-step deposit instructions, see [Deposit](https://minara.ai/docs/get-started/deposit.md#deposit).

## Transfers

Outgoing transfers from a Hyperliquid wallet incur a $1 fee deducted by Hyperliquid. This applies to transfers to another Minara wallet (including a Lighter wallet) and to withdrawals to an external Arbitrum address.

For transfer instructions, see [Deposit](https://minara.ai/docs/get-started/deposit.md#transfer-between-lighter-and-hyperliquid).

## Trading

Hyperliquid wallets support the order types, margin modes, and risk controls described in the trading reference. The available asset list comes from Hyperliquid's listings and appears in the asset selector on the Perps trading page when a Hyperliquid wallet is active.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/liquidity/hyperliquid.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
