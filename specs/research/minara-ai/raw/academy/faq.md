> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/faq.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# FAQ

Answers to the questions that come up most often, grouped by topic.

**Account and access**

### What do I need to use Strategy Studio?

A Minara subscription. Generating strategies and running backtests use credits, and a subscription is what lets you deploy a strategy to trade live.

### Do I need to connect my own exchange?

No. Minara runs the full deployment for you. Backtesting and paper trading happen on Minara, and when you deploy, Minara executes the trades through its own venues on Lighter and Hyperliquid. You do not connect or fund an outside exchange account.

**Backtesting**

### Does Minara's backtest engine use OHLC candles or tick data?

Minara has two backtest engines. Both use OHLC candles rather than tick data, but their execution models are different.

* **Strategy Studio (single-asset, time-series strategies):** The strategy runs candle by candle on the selected timeframe. Market orders fill with slippage applied. For take profit, stop loss, trailing stop, and limit orders, the engine examines smaller candles inside the main bar to determine where the trigger fired. This is similar to TradingView's bar magnifier and gives exits intra-bar precision instead of checking only the candle close.
* **XStrategy (multi-asset, cross-sectional strategies):** The strategy reads the whole market cross-section on each candle and outputs target portfolio weights. All fills occur at the candle close, with one fill per asset per candle. This matches the live rebalancing model for these strategies.

Both engines charge fees, slippage, and funding costs for perpetuals inside the simulation, so the reported results already include trading costs. Minara's accounting has been verified against hand calculations to within 0.0004%.

Tick data is not used because these strategies make decisions on candle timeframes, generally from hourly to daily. Tick-level execution would add processing cost without materially changing this type of result. Minara is not designed for high-frequency trading strategies that require true tick-level simulation.

### Why don't my backtest results match my live results?

Backtests include fees, slippage, and funding costs for perpetuals, but they cannot reproduce every live trading condition. Available liquidity, order latency, rejected orders, and differences in balance or leverage can still affect live results. Confirm that the timeframe, capital, leverage, and other settings match before comparing the two.

### How are position size and leverage calculated?

Each entry allocates a share of your equity as margin, and leverage multiplies that into market exposure. Higher leverage increases both gains and losses on the same price move. If your strategy does not set leverage explicitly, the backtest applies a default, so check the leverage if the position sizes look larger or smaller than you expect.

### Which assets can I backtest and trade?

Perpetuals available on Lighter and Hyperliquid. This includes BTC, ETH, and SOL, commodities such as gold (XAU) and silver, and stock perpetuals such as AAPL, TSLA, and NVDA.

### My backtest looks great. Does that mean the strategy will work live?

Not on its own. Overfitting and cold-start bias are common, and a strategy tuned to one period often fails on the next. Treat a strong backtest as a reason to test further, then run it in the Paper tab against live prices before you deploy real capital.

**Strategy code**

### Can I create a strategy without coding?

Yes. Describe the strategy in plain language and Minara writes the code for you. You read it and refine it through more chat, without writing code by hand.

### The generated code has an error. What do I do?

Ask Minara to fix it in the same chat. Paste the error message if there is one, and Minara corrects the code so you do not have to debug it yourself.

**Deploying and live trading**

### Can I edit a strategy after I deploy it?

Yes, but the edit does not take effect until you deploy again. A deployed strategy runs the code it had when you deployed, and changes to the draft stay in the draft. Deploy a second time to push an update.

### What happens if I stop a deployed strategy?

Stopping it closes every position it holds. There is no way to pause a deployed strategy while keeping its positions open, so stop it only when you want to exit the market.

### Why did my deployed strategy's APY reset?

APY is based on realized profit since deployment. If you stop a strategy and redeploy it, the counter starts over from the new deployment.

**Getting help**

### Where do I report a problem or ask a question?

Use the Support tab in the docs for common issues, or reach the team on Discord at discord.com/invite/minaraai.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/faq.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
