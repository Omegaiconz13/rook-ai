> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/strategy-studio/time-series.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Time-series strategies

**What is a time-series strategy, and when should I use it?** It trades one asset by reacting to signals on its own price, so it answers timing: when to go long or short. Use it when your idea is about a single chart, such as entering BTC on an EMA cross and exiting on an RSI level.

**What should I describe to generate one?** Be specific about four things: the asset, the timeframe, the entry condition, and the exit condition. For example, go long BTC on the 1-hour chart when the 9-EMA crosses above the 21-EMA, and exit when RSI exceeds 70 or price drops 3% from entry.

**How does a time-series backtest work?** It replays your entry and exit rules against one asset's price history over the date range you set, then reports the equity curve, the metrics, and every trade. Set the asset and range in the Code tab and click Run Backtest.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/strategy-studio/time-series.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
