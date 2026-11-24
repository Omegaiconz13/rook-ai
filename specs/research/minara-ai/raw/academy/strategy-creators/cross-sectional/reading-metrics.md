> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/cross-sectional/reading-metrics.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Reading the metrics

A cross-sectional backtest reports the same portfolio metrics as a time-series one, such as return, drawdown, and Sharpe, plus a few that are specific to ranking strategies. Read them together rather than one at a time.

{% embed url="<https://www.youtube.com/watch?index=9&list=PLUp1UC8-DLnM&v=drhaS1Yhfvk>" %}

## Return, drawdown, and Sharpe

These describe the long/short portfolio as a whole, the same way they do for a time-series strategy. Total return and max drawdown show the size of the gains and the worst loss along the way. Sharpe puts the return against its volatility.

## IC

The information coefficient measures how well the factor ranking lined up with the returns that followed, across the whole universe. A higher, steadier IC means the ranking carried real information rather than noise. A high average IC that swings between positive and negative is less reliable than a lower, steadier one.

## Quantile returns

Quantile returns split the universe into ranked groups and show the return of each. In a ranking that works, the top group outperforms the bottom group and the groups line up in order. If the middle groups beat the top, the factor is not ranking cleanly.

## Turnover

Turnover measures how much the portfolio changes at each rebalance. High turnover means the ranking reshuffles often, which raises trading costs in live trading. A strategy that looks good before costs can weaken once turnover is paid for.

## Reading them together

A healthy cross-sectional backtest usually shows a steady IC, quantile returns that line up in rank order, a positive Sharpe, and turnover low enough that costs do not erase the edge. If the IC is high but quantiles are jumbled, or returns are strong but turnover is very high, treat the result with caution.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/cross-sectional/reading-metrics.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
