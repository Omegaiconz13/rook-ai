> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/benchmark.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Benchmark

Benchmark shows the live performance of MINARA's own trading strategies. It is not a feature you configure. It is a transparency dashboard that lets you track how the strategies built and operated by Minara itself are performing in real markets.

Access it at `/app/trade` → **Benchmark** tab.

## What you're looking at

MINARA runs two active strategies:

| Strategy  | Asset  |
| --------- | ------ |
| MINARA V2 | BTC    |
| MINARA V1 | SILVER |

Each strategy has been deployed to live markets and trades using the same Autopilot execution infrastructure available to users.

MINARA V2 trades Bitcoin (BTC) perpetuals on Hyperliquid using a trend-following approach. MINARA V1 trades silver (SILVER) perpetuals. Both strategies trade under real market conditions with real capital.

## Reading the dashboard

**Total account value**: the current equity of the MINARA strategy portfolio, shown in USD and as a percentage change.

**Chart view**: toggle between `$` (absolute P\&L) and `%` (percentage return). Filter by `72h` for recent performance or `All` for the full history.

**Completed trades**: the full trade log, with every position opened and closed, entry price, exit price, and P\&L for each trade.

**AI reasoning**: for each trade, the rationale Minara's AI used to enter or exit the position. This is the same reasoning layer that drives Autopilot for user accounts.

**Positions**: current open positions held by the strategy.

**Readme**: a description of the strategy logic for each version (V1, V2).

## Why it exists

Benchmark serves as proof of work. Before asking users to run Autopilot on their own capital, Minara runs the same strategies with real funds. The results, including losses and drawdowns, are shown unfiltered.

{% hint style="info" %}
MINARA's performance on Benchmark does not predict your Autopilot results. Your strategies, risk settings, leverage, and allocated capital will differ.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/benchmark.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
