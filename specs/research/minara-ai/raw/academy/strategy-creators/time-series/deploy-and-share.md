> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/time-series/deploy-and-share.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Deploy and share

## Introduction

When the backtest and paper results hold up, click Deploy. Deploying finalizes the strategy and opens two independent choices: run it live with your own capital, publish it to the marketplace, or both. You can also skip and do either later.

{% embed url="<https://www.youtube.com/watch?index=6&list=PLUp1UC8-DLnM&v=UZMPIHhjp18>" %}

## Run live or publish

The Strategy deployed dialog offers two actions that do not depend on each other:

* Run live. Start real trading. You pick a wallet and confirm the asset, interval, and leverage. Running live and monitoring are covered in Going live.
* Publish to marketplace. Make the strategy public on Top Strategies, where it is eligible for the leaderboard.

Publishing puts no capital at risk. A published strategy is a backtest that others can see, not a live position.

## Publish it

Choose Publish to marketplace and set how it appears:

* Strategy name and Description. What the strategy does, in plain language.
* Style. Tag it as Mean-Reversion, Trend-Following, Swing, Breakout, Arbitrage, Market Making, or Other.
* Open source. Off by default. When on, anyone can view the code and fork it. Existing forks are not affected if you change this later.
* Backtest baseline. Pick which of your backtests to show as the public track record, with its asset, interval, leverage, period, and PnL.

Click Publish. The strategy's visibility switches to Public, while its source stays private unless you turned on open source.

## After you publish

* It appears on Top Strategies, ranked against other strategies by CAGR, return, Sharpe, max drawdown, and trades over its window.
* It shows in the Rising Creators and New Submissions feeds, and on your creator profile, which tracks how many strategies you have published and how many are currently on Top Strategies.
* Other traders can Star it, and Fork it if you made it open source. A fork copies the strategy into their own workspace to build on. Anyone can open the public strategy page to read its full backtest report.

{% hint style="info" %}
Publishing and running live are separate. You can publish a strategy without ever trading it live, and you can run one live while keeping it private. The backtest baseline you pick is what the public sees, so choose the run that represents the strategy honestly.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/time-series/deploy-and-share.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
