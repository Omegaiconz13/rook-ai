> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market/discover-strategies.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Discover strategies

Marketplace is the full catalog of published strategies. Search by name or UID, then combine filters to narrow the results before opening a strategy page.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-e6dc90f86a798b9629228cf9ecb248cc1c4e5f1f%2Fstrategy-market-marketplace.png?alt=media" alt="Marketplace with search and filter controls above a grid of published strategy cards"><figcaption><p>Marketplace groups strategy discovery, comparison, and the first step of the run flow.</p></figcaption></figure>

## Search and filters

Start with the filter that matters most to you, then add constraints until the list is manageable.

<table><thead><tr><th width="125.0718994140625">Filter</th><th>What it narrows</th><th>How to use it</th></tr></thead><tbody><tr><td>Search</td><td>Strategy name or UID</td><td>Find a known publication directly.</td></tr><tr><td>Category</td><td>Time-Series or Cross-Sectional</td><td>Choose between strategies that time one market and strategies that rank a basket.</td></tr><tr><td>Asset</td><td>A universe or individual market</td><td>Limit the catalog to markets you are willing to trade.</td></tr><tr><td>Sort by</td><td>Featured, APY, Sharpe, Calmar, or Max DD</td><td>Order results by the measurement you want to compare.</td></tr><tr><td>Style</td><td>Trend following, swing, mean reversion, breakout, arbitrage, market making, or other</td><td>Match the strategy to the behavior you understand.</td></tr><tr><td>Risk</td><td>Conservative, balanced, or aggressive</td><td>Narrow by the publication's risk classification.</td></tr><tr><td>Availability</td><td>Subscribable or open source</td><td>Separate strategies you can run from those whose source can be viewed or forked.</td></tr><tr><td>Creator</td><td>All or verified</td><td>Limit the catalog by profile verification status when needed.</td></tr><tr><td>Direction</td><td>Available exposure choices</td><td>Filter by the market direction or exposure the strategy uses.</td></tr></tbody></table>

Filters are discovery tools, not an assessment of quality. For example, `Conservative` is a classification attached to the publication; it does not guarantee a small future drawdown.

## Read a strategy card

A card summarizes the publication so you can decide whether to inspect it further:

* **Name and market** identify what the strategy trades.
* **Creator and verification badge** identify who published it.
* **Annualized Return or Window Return** shows the return measure selected for that card.
* **Max Drawdown** shows the largest historical peak-to-trough decline in the displayed record.
* **Sharpe Ratio** relates return to volatility over the measured period.
* **Window** shows how much data is included.
* **Share** shows the configured creator profit-share rate for a subscribable strategy.
* **Subscribers** appears when the publication reports its current subscriber count and limit.

The sparkline is useful for seeing the path behind the headline return. A smooth line, a late surge, and a long flat period can produce similar final numbers but imply different behavior.

## Save or open

Select the star icon to save a strategy to the `Starred` tab on your profile. Select the card to open the full detail page.

Use `Run` only after reading the detail page. The card is a summary and does not show the complete backtest, drawdown history, trading costs, or live-forward record.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market/discover-strategies.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
