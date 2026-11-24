> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/strategy-studio/backtesting.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Backtesting

**Do Minara's backtest engines use OHLC candles or tick data?** Minara has two backtest engines. Both use OHLC candles rather than tick data, but their execution models differ.

| Engine                                                 | Execution model                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Strategy Studio (single-asset, time-series strategies) | The strategy runs candle by candle on the timeframe you choose. Market orders fill with slippage applied. For take-profit, stop-loss, trailing-stop, and limit orders, the engine checks lower-timeframe candles inside the strategy bar to determine when the trigger fired. This provides intrabar precision similar to TradingView's Bar Magnifier. |
| XStrategy (multi-asset, cross-sectional strategies)    | The strategy reads the full market cross-section on each candle and produces target portfolio weights. The engine runs one execution cycle at the close of each candle. This matches the live execution model, where the portfolio rebalances at the close.                                                                                            |

Both engines include trading fees, slippage, and funding costs for perpetuals in the simulation. Accounting tests match manual calculations within 0.0004%.

Minara uses candle data because both engines are designed for strategies that make decisions on candle timeframes, typically from hourly to daily. They are not designed for high-frequency or tick-level execution research.

**Why don't my backtest results match my live results?** Backtests include fees, slippage, and funding costs where applicable, but they cannot reproduce every live trading condition. Available liquidity, order latency, rejected orders, and differences in balance or leverage can still affect live results. Confirm that the timeframe, capital, leverage, and other settings match before comparing the two.

**How are position size and leverage calculated?** Each entry allocates a share of your equity as margin, and leverage multiplies that into market exposure. Higher leverage increases both gains and losses on the same price move. If your strategy does not set leverage explicitly, the backtest applies a default, so check the leverage if the position sizes look larger or smaller than you expect.

**Which assets can I backtest and trade?** Perpetuals available on Lighter and Hyperliquid. This includes BTC, ETH, and SOL, commodities such as gold (XAU) and silver, and stock perpetuals such as AAPL, TSLA, and NVDA.

**My backtest looks great. Does that mean the strategy will work live?** Not on its own. Overfitting and cold-start bias are common, and a strategy tuned to one period often fails on the next. Treat a strong backtest as a reason to test further, then run it in the Paper tab against live prices before you deploy real capital.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/strategy-studio/backtesting.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
