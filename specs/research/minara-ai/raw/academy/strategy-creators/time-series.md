> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/time-series.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Time-series strategies

A time-series strategy trades one asset by reacting to signals on its own price. It solves timing: when to go long or short. This track walks through building one end to end.

{% embed url="<https://www.youtube.com/watch?index=2&list=PLUp1UC8-DLnM&v=uuf1esO-smw>" %}

1. Your first time-series strategy, from idea to deploy, including generating it from a description.
2. Run a backtest against historical data.
3. Reading the backtest metrics.
4. Optimize parameters to tune the settings.
5. Deploy and share it, so other traders can find it on Top Strategies.

Paper trading, covered under Going live, applies to both tracks and is worth running before you deploy.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/time-series.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
