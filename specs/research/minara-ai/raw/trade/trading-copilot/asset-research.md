> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/trading-copilot/asset-research.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Research an asset before you trade

Use this when you're on an asset page and want to understand what you're looking at, such as funding, open interest, mark price, or the chart, before preparing an order.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-442930260eef7602a2417ee1bd9641cf5218e52e%2Fharness-btc-copilot.png?alt=media" alt="BTC asset page with AI Copilot in the Minara desktop app"><figcaption></figcaption></figure>

## Ask Copilot about what you see

Open **AI Copilot** next to the chart and ask a focused question. For example:

> Explain the funding rate shown here, including the countdown. Don't recommend a trade.

Minara answers using the numbers on the page, tells you where they come from, and gives both sides when it makes sense.

For signals and full trade plans, see [AI trading copilot](https://minara.ai/docs/trade/trading-copilot.md).

## Check before you place an order

Before confirming, review:

* the asset, venue, and market type;
* the mark price and oracle price;
* volume, open interest, and funding;
* your size, margin, leverage, take-profit, stop-loss, and estimated liquidation price.

Minara can walk through all of this with you and prepare the order, then stops so you can confirm. See [Safety and approvals](https://minara.ai/docs/technology/safety-and-approvals.md).

## Keep in mind

Copilot's analysis is not a guaranteed prediction. Prices, fees, funding, and liquidation estimates can change between your review and the trade. Double-check any number before acting on it. To learn more, see [Order types](https://minara.ai/docs/reference/order-types.md), [Margin & leverage](https://minara.ai/docs/reference/margin-and-leverage.md), and [Liquidations](https://minara.ai/docs/reference/liquidations.md).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/trading-copilot/asset-research.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
