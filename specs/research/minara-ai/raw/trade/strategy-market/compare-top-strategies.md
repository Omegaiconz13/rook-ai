> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market/compare-top-strategies.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Compare Top Strategies

Top Strategies compares published strategies on a common ranking screen. Use it to build a shortlist, then open each strategy page before making a decision.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-bafc8f105dd432448e15a03057278f1ef85b92db%2Fstrategy-market-top-strategies.png?alt=media" alt="Top Strategies page with a rolling cumulative return chart, ranked table, popular creators, and new submissions"><figcaption><p>Top Strategies combines a visual comparison with the measurements behind the ranking.</p></figcaption></figure>

## Choose a ranking view

The page has two views:

* `Consistent` emphasizes strategies with steadier performance.
* `Aggressive` surfaces strategies that accept more risk in pursuit of higher returns.

Neither view is a recommendation. It changes the comparison lens, not the uncertainty of live trading.

## Read the chart and table together

The cumulative return chart compares strategies over the selected rolling window. Use the chart to see when returns developed, whether strategies moved together, and whether one result depends on a short burst.

The table provides the measurements behind each line:

<table><thead><tr><th width="180.15625">Column</th><th>What it tells you</th></tr></thead><tbody><tr><td>Annualized Return</td><td>The measured return converted to a yearly rate. Short windows can make this number look unusually large.</td></tr><tr><td>Window Return</td><td>The total return over the displayed measurement window.</td></tr><tr><td>Sharpe</td><td>Return relative to volatility. Compare it with drawdown rather than using it alone.</td></tr><tr><td>Max DD</td><td>The largest peak-to-trough decline in the measured period.</td></tr><tr><td>Trades</td><td>The number of fills or trades supporting the result. A small sample is easier to overinterpret.</td></tr><tr><td>Window</td><td>The start and end of the record displayed for that strategy.</td></tr></tbody></table>

The chart can use a rolling comparison window and refresh as new performance data arrives. Rankings may therefore change even when the underlying strategy has not been edited.

## Popular creators and new submissions

`Popular Creators` links to public creator profiles. It is useful when you want to review several publications from the same person.

`New Submissions` surfaces recently published strategies before they have a long public history.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-cc1b10a3ca54c0afd41f7bf214f3a3ba40f43eb8%2Fstrategy-market-new-submissions.png?alt=media" alt="New Submissions list showing recently published strategies, creators, and annualized return"><figcaption><p>New submissions may have less post-publication evidence than established strategies.</p></figcaption></figure>

Treat a new submission as a starting point for research. Check its backtest window, live-forward segment, drawdown, and creator before relying on the displayed annualized return.

{% hint style="warning" %}
High rank, verification, or popularity does not guarantee future performance. A strategy can fall in rank as the market regime changes or new live data arrives.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market/compare-top-strategies.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
