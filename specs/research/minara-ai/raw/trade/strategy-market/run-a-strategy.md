> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market/run-a-strategy.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Subscribe to a strategy

Subscribe to a published strategy only after reviewing its description and intended behavior, performance window, live-forward record, drawdown, costs, and creator. The strategy executes through Autopilot using a wallet you select.

## Before you run

Complete the checks in [Evaluate a strategy](https://minara.ai/docs/trade/strategy-market/evaluate-a-strategy.md), then confirm these details for the live run:

1. The market or universe the strategy trades.
2. Whether it is time-series or cross-sectional.
3. The wallet and supported trading venue you plan to use.
4. The strategy interval and any allocation settings shown in the run flow.
5. The fees, liquidity, and drawdown risk your allocation can tolerate.

A Subscriber must allocate at least **$500** to run a published Strategy Market strategy. A creator may set a higher minimum for an individual strategy, so review the amount shown in the run flow before confirming.

{% hint style="warning" %}
A backtest is not a live guarantee. Execution, liquidity, fees, funding costs, market conditions, and your allocation can all change the result.
{% endhint %}

## Start the run

Select `Run` from a strategy card, the strategy header, or the `My live run` panel. Review the strategy, wallet, market, interval, and any allocation or venue settings shown in the confirmation flow.

Your wallet determines where the live strategy executes when more than one supported venue is available.

## Confirm deployment

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-c125a8c0f51cd02d57f1c266d8c1752f4937e397%2Fstrategy-market-run-success.png?alt=media" alt="Strategy deployed confirmation showing the selected wallet, symbol, interval, and link to the live trading view"><figcaption><p>Check the strategy and wallet on the confirmation screen before leaving the flow.</p></figcaption></figure>

The success screen confirms:

* The strategy that was deployed.
* The selected wallet.
* The traded symbol or universe.
* The strategy interval.

Select `View on Perps` to open the live trading view, or `Done` to return to Strategy Market.

## Monitor the live run

Open your profile and select `Autopilot` to monitor the strategy. Review Total PnL, 30D PnL, Unrealized PnL, runtime, open positions, orders, and trade history.

The public strategy record and your personal live run answer different questions. The public page describes the shared strategy publication; your Autopilot view reports what happened in your wallet after your own start time and allocation.

## Save without running

Select the star icon to add a strategy to `Starred`. This saves it for later review and does not allocate funds or start trading.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market/run-a-strategy.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
