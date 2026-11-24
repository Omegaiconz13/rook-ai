> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/time-series/your-first-strategy.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Your first time-series strategy

A time-series strategy trades one asset by reacting to signals on its own price. Here is the full path from an idea to a deployed strategy.

→ <https://minara.ai/app/strategy-studio>

{% embed url="<https://www.youtube.com/watch?index=2&list=PLUp1UC8-DLnM&v=uuf1esO-smw>" %}

## Describe the idea

Click New Strategy, keep the toggle on Time-series, and describe your idea in the prompt box. Minara writes the code from your description, so be specific about four things: the asset, the timeframe, the entry condition, and the exit condition.

> Go long BTC on the 1-hour chart when the 9-EMA crosses above the 21-EMA. Exit when RSI exceeds 70 or price drops 3% from entry.

A few more to start from:

> Short ETH on the 15-minute chart when MACD crosses below signal and price is below the 200-EMA.

> Long NVDA perpetual on the 4-hour chart when price breaks above the 20-day high on above-average volume.

## Check what Minara generated

Open the Code tab and read the strategy Minara wrote, to confirm the entry and exit conditions are the ones you meant. If something is off, ask for the change in chat and Minara updates the code. You refine through chat rather than editing code by hand.

## Backtest it

Set the asset and the date range, then click Run Backtest. Minara runs the strategy against your price history and fills in the metrics, with an equity curve and a performance summary. Open Metrics to read the results and Trades to see each entry and exit.

## Paper trade, then deploy

Run it in the Paper tab to watch it trade against live prices with no real capital. When the results hold up, click Deploy to put it live.

{% hint style="info" %}
Generated code is a starting point. Read it before backtesting, and validate in paper trading before you deploy real capital.
{% endhint %}

The rest of this track explains each step in more detail: running a backtest, reading the metrics, and optimizing the parameters.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/time-series/your-first-strategy.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
