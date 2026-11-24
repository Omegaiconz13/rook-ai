> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/readme/the-interface.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# The interface

## Mode toggle

Above the prompt box is a toggle between Time-series and Cross-sectional. It sets which kind of strategy you are building, and it changes what the workspace shows: Time-series works from a single asset's chart, while Cross-sectional adds a universe picker and a factor library. Set it before you start.

{% embed url="<https://www.youtube.com/watch?index=1&list=PLUp1UC8-DLnM&v=aVq7ZEBihB4>" %}

## Left sidebar

The sidebar has two sections. Deployed lists strategies running live, each showing its current APY and the asset it trades. Drafts lists strategies you are still editing. A change to a draft never touches a deployed strategy.

## Editor tabs

Click any entry to open it. The workspace has three tabs:

<table><thead><tr><th width="140.57183837890625">Tab</th><th>What it shows</th></tr></thead><tbody><tr><td>Code</td><td>The code Minara generated for your strategy, for reading</td></tr><tr><td>Backtest</td><td>The asset and date settings, the performance summary (Metrics), and the trade log (Trades)</td></tr><tr><td>Paper</td><td>Live paper trading with no real capital</td></tr></tbody></table>

Run Backtest, Optimize, and Deploy are buttons in the workspace, not tabs.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/readme/the-interface.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
