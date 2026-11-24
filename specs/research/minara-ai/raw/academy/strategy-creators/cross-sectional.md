> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/cross-sectional.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Cross-sectional strategies

A cross-sectional strategy trades a basket of assets by ranking them with factors. It solves selection: which assets to hold long or short. This track walks through building one end to end.

{% embed url="<https://www.youtube.com/watch?index=7&list=PLUp1UC8-DLnM&v=H9ARc7gY_OI>" %}

1. Your first cross-sectional strategy, from a universe and factors to deploy.
2. Run a backtest across the universe.
3. Reading the metrics, including IC, quantiles, and turnover.
4. Optimize the factor mix.
5. Deploy and share it, so other traders can find it on Top Strategies.

Paper trading, covered under Going live, applies to both tracks and is worth running before you deploy.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/cross-sectional.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
