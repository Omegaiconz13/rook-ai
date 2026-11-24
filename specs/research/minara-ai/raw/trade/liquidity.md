> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/liquidity.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Liquidity

Minara routes perpetual trades to two on-chain order books: Lighter and Hyperliquid. Each perps wallet you create is bound to one of the two exchanges. Switching wallets in the trading interface switches which venue your next order executes on.

## Lighter vs. Hyperliquid in Minara

<table><thead><tr><th></th><th width="249">Lighter</th><th>Hyperliquid</th></tr></thead><tbody><tr><td>Architecture</td><td>Zero-knowledge Layer 2</td><td>Self-settled Layer 1 (HyperBFT consensus)</td></tr><tr><td>Settlement</td><td>On-chain via zk-proofs</td><td>On-chain, one-block finality</td></tr><tr><td>Deposit asset</td><td>USDC via Arbitrum</td><td>USDC via Arbitrum</td></tr><tr><td>Asset categories in Minara</td><td>Perpetuals</td><td>Perpetuals</td></tr><tr><td>Cross-exchange transfer</td><td>Supported (USDC, USDH where available)</td><td>Supported (USDC, USDH where available)</td></tr><tr><td>Transfer within the exchange</td><td>$3 deducted by Lighter per transfer (from one Lighter wallet to another)</td><td>$1 deducted by Hyperliquid for new wallets (the first transfer initiated). No fee for subsequent transfers of the same wallet.</td></tr><tr><td>Withdrawal fee</td><td>$3 deducted by Lighter per outgoing transfer (withdrawal)</td><td>$1 deducted by Hyperliquid per outgoing transfer (withdrawal)</td></tr><tr><td>Wallet key model</td><td>StarkEx-derived account model</td><td>EVM-native account model</td></tr></tbody></table>

Order types, leverage, funding, and liquidations follow each exchange's own rules. See [Order types](https://minara.ai/docs/reference/order-types.md), [Margin & leverage](https://minara.ai/docs/reference/margin-and-leverage.md), and [Liquidations](https://minara.ai/docs/reference/liquidations.md).

## Picking a venue

Most users do not need to choose explicitly. By default your account has one wallet on each exchange, and the trading interface lets you swap between them in one click. If you have funds on one side and want to use the other, transfer between them. See [Deposit](https://minara.ai/docs/get-started/deposit.md#transfer-between-lighter-and-hyperliquid).

For details on each venue, see [Lighter](https://minara.ai/docs/trade/liquidity/lighter.md) and [Hyperliquid](https://minara.ai/docs/trade/liquidity/hyperliquid.md).

## Where each venue shows up in Minara

Copilot, Autopilot, and Strategy Studio all work with both Lighter and Hyperliquid wallets. The exchange used is determined by which wallet is selected when you start a session, run a backtest, or deploy a strategy.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/liquidity.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
