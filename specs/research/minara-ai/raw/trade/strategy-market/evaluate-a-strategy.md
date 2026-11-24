> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market/evaluate-a-strategy.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Evaluate a strategy

Open a strategy from Marketplace, Top Strategies, a creator profile, or your Starred list to see its full record. Evaluate the strategy page before you start a live run.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-9c95175b35baca0a552c4ac79845aa4870647e70%2Fstrategy-market-strategy-details.png?alt=media" alt="Published strategy page with author information, strategy description, backtest summary, and Run controls"><figcaption><p>The detail page connects the creator's description with the evidence produced by the strategy.</p></figcaption></figure>

## Start with the context

The top of the page identifies the strategy, the market or universe it trades, and its creator. Read these sections first:

* **Strategy info** explains what the strategy is intended to do. Treat it as the creator's description, then check whether the data supports it.
* **Author info** shows who published the strategy and links to the creator's public profile.
* **My live run** shows whether you already run this strategy and provides the entry point for starting it.

## Separate backtest from live-forward performance

The performance chart distinguishes three parts of the record:

* **Backtest period (in-sample)** shows how the rules behaved on historical data.
* **Publish moment** marks when the strategy became public.
* **Live forward (out-of-sample)** shows performance recorded after publication.

Do not read these as one continuous live track record. A backtest helps you understand the rules across historical conditions. The live-forward segment tests how the published version behaved after it was exposed to new market data.

## Read return and risk together

<table><thead><tr><th width="169.78125">Measurement</th><th>What to ask</th></tr></thead><tbody><tr><td>Total Return</td><td>How much did the strategy gain or lose across the full displayed period?</td></tr><tr><td>Annualized Return</td><td>Is the measurement window long enough for an annualized rate to be meaningful?</td></tr><tr><td>Max Drawdown</td><td>What was the worst historical decline, and could your allocation tolerate a similar or larger loss?</td></tr><tr><td>Sharpe Ratio</td><td>Did the strategy earn its return with relatively stable or volatile results?</td></tr><tr><td>Calmar Ratio</td><td>How much annualized return was produced relative to maximum drawdown?</td></tr><tr><td>Alpha and Beta</td><td>What benchmark-adjusted excess return is reported, and how sensitive was the strategy to the benchmark?</td></tr><tr><td>Total Fills</td><td>Is there enough activity to evaluate, and could turnover make costs important?</td></tr></tbody></table>

No single measurement answers whether a strategy is suitable. A high return with severe drawdown, a high Sharpe over a short window, or a strong backtest with little live-forward data all require caution.

## Inspect the full report

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-f1d5d4203c5e0b64fd76b96bc59d51f658d7cafc%2Fstrategy-market-performance-report.png?alt=media" alt="Strategy report with drawdown chart, portfolio composition, returns, risk and benchmark measurements, and trade analysis"><figcaption><p>The lower report explains where the headline result came from.</p></figcaption></figure>

The lower report adds several checks:

* **Equity and drawdown charts** show the path of returns and the depth and duration of declines.
* **Composition** shows trading volume by symbol. A large block indicates that more of the measured trading volume came from that symbol.
* **Per-Symbol PnL** separates results by market so one outlier does not hide weak performance elsewhere.
* **Trades** lets you inspect the underlying trading activity.
* **Returns** includes gross profit, gross loss, profit factor, expected payoff, and commission paid.
* **Risk & benchmark** compares the strategy with a reference market and reports downside-sensitive measurements.
* **Trade analysis** shows the number of closed positions, win rate, win/loss ratio, and average results.

## A practical review order

1. Confirm what the strategy trades and how often it acts.
2. Check the measurement window and sample size.
3. Compare return with maximum drawdown.
4. Locate the publish marker and examine the live-forward segment.
5. Review fees or commission and the number of fills.
6. Check trading-volume concentration and per-symbol results for multi-asset strategies.
7. Read the creator profile and other public strategies.

Only then decide whether to save the strategy, run it with an appropriate allocation, or continue researching.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market/evaluate-a-strategy.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
