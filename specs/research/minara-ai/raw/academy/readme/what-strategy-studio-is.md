> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/readme/what-strategy-studio-is.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# What Strategy Studio is

[Strategy Studio](https://minara.ai/app/strategy-studio) covers the full path from idea to live trading: describe a strategy, test it against historical data, watch it trade in a paper account, then deploy it with real capital. A strategy stays editable as a draft until you deploy, so nothing trades until you decide it should.

{% embed url="<https://youtu.be/UHkUdSjJ-Ug?si=QQd-Df9vy-VQcZpF>" %}

<figure><img src="https://1883420886-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fs9Vk1qEmVro82gX4lWvL%2Fuploads%2Fgit-blob-7336402698d404d88f6e0280b8ce970d1cafb8e4%2Fimage.png?alt=media" alt="Strategy Studio workspace in Minara"><figcaption></figcaption></figure>

Every strategy follows the same four stages:

1. Describe. Set up the idea in plain language or by selecting its components.
2. AI coding. Minara generates readable code for the strategy.
3. Backtest. Test it against historical data and read the results.
4. Go live. Paper trade it, then deploy it to trade automatically.

## What you can do

| Capability                  | What it means                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Generate from language      | Describe a strategy in plain language and Minara builds it. Minara calls this Vibe Trading. |
| Refine in chat              | Read what Minara generated and adjust it through more chat, without writing code by hand.   |
| Backtest on historical data | Run your strategy against past market data and read a full performance report.              |
| Validate in paper           | Run live against current prices with no real capital before committing funds.               |
| Optimize                    | Ask Minara to tune the settings and report which performed best.                            |
| Deploy and monitor          | Put a strategy live in Autopilot and track its APY, positions, and trades.                  |

## Two modes

Strategy Studio builds two kinds of strategies. Use the toggle above the prompt box to choose the one that matches your idea.

[Time-series](https://minara.ai/app/strategy-studio) trades one asset by watching its own price over time. It reacts to signals on that asset's chart, such as RSI crossing a level, an EMA crossover, or a breakout, and decides when to go long, go short, or stay flat. Use it when your idea is about the timing of a single market, such as "short RKLB when RSI is above 70".

[Cross-sectional](https://minara.ai/app/xstrategy) trades a basket of assets at once. It scores every asset in a universe by one or more factors, ranks them, then holds the top-ranked and shorts the bottom-ranked, rebalancing on a schedule. Use it when your idea is about which assets to hold rather than when, such as "hold the 10 cheapest, highest-quality names in the TradFi 30 and short the 10 worst".

|                | Time-series                        | Cross-sectional                      |
| -------------- | ---------------------------------- | ------------------------------------ |
| Trades         | One asset                          | A universe of assets                 |
| Decides        | When to enter and exit             | Which assets to hold, long and short |
| Built from     | Price signals (RSI, EMA, breakout) | Factors ranked across the universe   |
| Typical output | Entries and exits on one chart     | A ranked long/short portfolio        |

If you are new, start with a time-series strategy, since a signal for one asset is easier to reason about. Move to cross-sectional once you want to rank and trade a basket.

## Two paths through Academy

Academy separates the product into two tracks:

* The Strategy Subscribers section covers account setup, the Marketplace, Top Strategies, subscribing to a published strategy, and monitoring it in Autopilot.
* Strategy creators covers the existing time-series and cross-sectional tracks from first draft through backtesting, optimization, deployment, and publishing.

## Who it's for

* New to algorithmic trading: describe an idea in plain language and get a working strategy without writing any code.
* Active traders: turn a setup you already trade by hand into a strategy that runs around the clock.
* Quantitative traders: combine factors across a universe and tune the mix.
* Subscribers: compare published strategies, subscribe, and run one without building its rules yourself.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/readme/what-strategy-studio-is.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
