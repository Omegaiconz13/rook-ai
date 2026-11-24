> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/cross-sectional/optimize-factors.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Optimize the factor mix

Optimize asks Minara to tune a cross-sectional strategy for you. It tests variations of the factor mix and the ranking settings, then reports which performed best.

{% embed url="<https://www.youtube.com/watch?index=11&list=PLUp1UC8-DLnM&v=iZpSz-WaZR0>" %}

## What it varies

| Lever                 | What Minara tries                        |
| --------------------- | ---------------------------------------- |
| Factor weights        | Shifting how much each factor counts     |
| Factor set            | Adding or dropping factors from the mix  |
| Long and short counts | Holding more or fewer names on each side |
| Rebalance             | Testing different rebalance frequencies  |

## How to use it

1. Open a cross-sectional strategy with a backtest already run.
2. Click Optimize.
3. Minara runs several rounds, each testing a variation, and ranks them by the target metric.
4. Review the results. If a variation beats your current mix, apply it; if none do, the original settings are kept.

{% hint style="warning" %}
Optimizing on one period can fit the past rather than find a real edge. Prefer a mix that holds up across the full window and in paper trading over one that only wins the optimization.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/cross-sectional/optimize-factors.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
