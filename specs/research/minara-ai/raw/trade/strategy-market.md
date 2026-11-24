> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Strategy Marketplace

[Strategy Marketplace](https://minara.ai/app/marketplace) is where traders discover, compare, run, and publish automated trading strategies. It connects strategies built in [Strategy Studio](https://minara.ai/docs/trade/strategy-studio.md) with prospective Subscribers who want to use them through Autopilot.

{% embed url="<https://x.com/minara/status/2077780543673180304>" %}

You do not need to write code to run a published strategy. You can inspect its creator, description and intended behavior, historical backtest, post-publication record, risk measurements, and trading activity before deciding whether it fits your account.

{% hint style="warning" %}
Published results describe past performance, not future returns. Review drawdown, fees, trade count, measurement window, and live-forward performance before allocating funds.
{% endhint %}

## Two ways to find strategies

Strategy Market has two discovery views:

* **Marketplace** is the searchable catalog. Use it when you want a particular asset, strategy type, risk profile, style, or creator.
* **Top Strategies** is the comparison view. Use it to examine ranked performance, popular creators, and newly published strategies.

Both views lead to the same strategy detail pages. The difference is how you start your search.

## The strategy lifecycle

A strategy moves through the market in four stages:

1. A creator builds and backtests it in Strategy Studio.
2. The creator publishes it with a description, classification, backtest, and visibility settings.
3. Prospective Subscribers discover and evaluate the publication in Marketplace, Top Strategies, or a creator profile.
4. Eligible Subscribers subscribe and run it from their own wallet through Autopilot. The creator's code remains private unless the publication is marked `Open source`.

## Choose your path

### If you want to run a strategy

1. [Discover strategies](https://minara.ai/docs/trade/strategy-market/discover-strategies.md) in Marketplace.
2. [Compare Top Strategies](https://minara.ai/docs/trade/strategy-market/compare-top-strategies.md) to examine ranked performance and the measurement window shown for each strategy.
3. [Evaluate the strategy](https://minara.ai/docs/trade/strategy-market/evaluate-a-strategy.md), including its backtest and live-forward record.
4. [Check the creator](https://minara.ai/docs/trade/strategy-market/creators-and-profiles.md).
5. [Run the strategy](https://minara.ai/docs/trade/strategy-market/run-a-strategy.md) from a funded wallet.

### If you want to publish a strategy

Build and test the trading logic in Strategy Studio, then use [Publish and manage](https://minara.ai/docs/trade/strategy-market/publish-and-manage.md) to control its market listing, visibility, subscription terms, and creator presentation.

## Strategy Market and Strategy Studio

<table><thead><tr><th width="164.09375">Product</th><th>Main purpose</th><th>Typical actions</th></tr></thead><tbody><tr><td>Strategy Studio</td><td>Create and test trading logic</td><td>Describe, code, backtest, optimize, and deploy a strategy</td></tr><tr><td>Strategy Market</td><td>Discover and distribute published strategies</td><td>Compare, inspect, star, run, publish, and manage a listing</td></tr></tbody></table>

Editing a publication does not change the underlying trading rules. Return to Strategy Studio when the code, signals, asset universe, timeframe, or execution behavior needs to change.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
