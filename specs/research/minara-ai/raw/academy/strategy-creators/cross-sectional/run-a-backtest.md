> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/cross-sectional/run-a-backtest.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Run a backtest

A cross-sectional backtest replays your ranking across history. On each rebalance date it scores every asset in the universe, ranks them, holds the top and shorts the bottom, then measures how that portfolio would have performed.

{% embed url="<https://www.youtube.com/watch?index=8&list=PLUp1UC8-DLnM&v=higXD-uKQcc>" %}

## How to run it

1. Set the universe, the factor mix, the long and short counts, and the rebalance.
2. Set the date range to test over.
3. Click Run Backtest.
4. Read the results in the metrics, with the equity curve and a performance summary.

## What shapes the numbers

A cross-sectional backtest depends on the whole universe having history over the test window. Names with gaps are handled on the rebalance dates, so results can shift if you change the universe or the rebalance schedule. Trading fees, slippage, and funding costs for perpetuals are included in the simulation. Live results can still differ because of available liquidity, order latency, rejected orders, and account settings.

{% hint style="warning" %}
A strong backtest does not guarantee live performance. Factor rankings decay, and a mix tuned on one period can fail on the next. Validate in paper trading before deploying real capital.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/cross-sectional/run-a-backtest.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
