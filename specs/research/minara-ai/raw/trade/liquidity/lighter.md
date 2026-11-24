> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/liquidity/lighter.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Lighter

[Lighter](https://lighter.xyz/) is a zero-knowledge perpetuals exchange. In Minara, orders placed against a Lighter wallet route to Lighter's on-chain order book.

## Trust model

Lighter is a Layer-2 perpetuals DEX that runs its matching and settlement under a zero-knowledge proof system. Trades are executed on-chain with the same trust model as the underlying chain, not on a custodial exchange backend. Minara does not operate Lighter; it is the interface and execution layer on top.

## Deposit

Lighter wallets accept USDC deposits via Arbitrum. Deposits from other networks or tokens are not credited to the wallet and must be recovered by exporting the wallet's private key.

For step-by-step deposit instructions, see [Deposit](https://minara.ai/docs/get-started/deposit.md#deposit).

## Trading

Lighter wallets support the same order types, margin modes, and risk controls as Hyperliquid wallets. The available asset list comes from Lighter's listings and appears in the asset selector on the Perps trading page when a Lighter wallet is active.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/liquidity/lighter.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
