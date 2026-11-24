> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-creators/time-series/optimize-parameters.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Optimize parameters

## Introduction

The Optimize tab runs a parameter sweep. You pick the values to vary, such as a moving-average length or an RSI threshold, and the tool backtests across the range to show which settings performed best.

{% embed url="<https://www.youtube.com/watch?index=5&list=PLUp1UC8-DLnM&v=woSAt79N2Co>" %}

## How to use it well

Use it to refine a working strategy, not to manufacture one. A setting that looks best on one historical period often fails on the next, so treat the top result as a starting point and confirm it in Paper rather than deploying it directly.

{% hint style="warning" %}
Tuning a strategy until the backtest looks perfect is overfitting. The more settings you sweep, the more likely the best result is luck. Always confirm an optimized strategy in paper.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-creators/time-series/optimize-parameters.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
