> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/trading-fees.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Trading fees

Your total fee on each trade depends on the trading mode you use, the venue that fills the order (Lighter or Hyperliquid), and the asset class. Each table below shows the final fee you pay.

Each cell shows the fee as `maker / taker`. A maker order adds liquidity (usually a limit order that does not fill immediately). A taker order removes liquidity (a market order, or a limit order that matches a resting order on entry).

{% hint style="info" %}
Some TradFi assets on Hyperliquid, such as GOLD, carry higher fees than the rates shown below. For each asset's real-time trading fee, we recommend checking with Hyperliquid.
{% endhint %}

## Autopilot & Strategy Studio

| Venue       | Asset class                   | maker / taker   |
| ----------- | ----------------------------- | --------------- |
| Hyperliquid | Crypto                        | 0.030% / 0.060% |
| Hyperliquid | TradFi (commodities & stocks) | 0.018% / 0.024% |
| Lighter     | All assets                    | 0.020% / 0.020% |

Lighter charges one flat rate across every asset it supports. Commodities and stocks cover silver, crude oil, and tokenized US equities. Autopilot does not support prediction markets.

## Copilot & Manual

| Venue       | Asset class          | maker / taker   |
| ----------- | -------------------- | --------------- |
| Hyperliquid | Crypto               | 0.055% / 0.075% |
| Hyperliquid | Commodities & stocks | 0.043% / 0.039% |
| Hyperliquid | Prediction markets   | 0.080% / 0.086% |
| Lighter     | All assets           | 0.045% / 0.035% |

Lighter charges one flat rate across every asset it supports. Commodities and stocks cover silver, crude oil, gold, and tokenized US equities. Prediction markets cover binary outcome contracts on Hyperliquid's Outcome market, powered by Outcomexyz.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/trading-fees.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
