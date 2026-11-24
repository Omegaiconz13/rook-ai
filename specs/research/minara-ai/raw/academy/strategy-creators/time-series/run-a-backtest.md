> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/time-series/run-a-backtest.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Run a backtest

## Introduction

A backtest runs your strategy against historical market data and reports how it would have performed. It is the first check on whether an idea holds up before any capital is at risk.

{% embed url="<https://www.youtube.com/watch?index=3&list=PLUp1UC8-DLnM&v=nR5dXHPPX1g>" %}

## How to run it

1. Open the Code tab.
2. Set the date range and the asset.
3. Click Run Backtest.
4. Read the results in the Metrics tab, with an equity curve and a performance summary.

Backtests cover perpetuals available on Lighter and Hyperliquid, including BTC, ETH, SOL, gold (XAU), silver, and stock perpetuals such as AAPL, TSLA, and NVDA.

## What shapes the numbers

The simulation includes trading fees, slippage, and funding costs for perpetuals, and it sizes positions using the leverage defined by the strategy. Live results can still differ because of available liquidity, order latency, rejected orders, and differences in balance or leverage. Match the timeframe, capital, leverage, and other settings before comparing a live run with its backtest.

{% hint style="warning" %}
A strong backtest does not guarantee live performance. Cold-start bias and overfitting are common, especially over short periods. Validate in the Paper tab before deploying real capital.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/time-series/run-a-backtest.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
