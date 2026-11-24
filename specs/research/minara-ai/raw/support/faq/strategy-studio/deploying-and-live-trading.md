> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/strategy-studio/deploying-and-live-trading.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Deploying and live trading

**Do I need to connect my own exchange?** No. Minara runs the full deployment for you. Backtesting and paper trading happen on Minara, and when you deploy, Minara executes the trades through its own venues on Lighter and Hyperliquid. You do not connect or fund an outside exchange account.

**Can I edit a strategy after I deploy it?** Yes, but the edit does not take effect until you deploy again. A deployed strategy runs the code it had when you deployed, and changes to the draft stay in the draft. Deploy a second time to push an update.

**What happens if I stop a deployed strategy?** Stopping it closes every position it holds. There is no way to pause a deployed strategy while keeping its positions open, so stop it only when you want to exit the market.

**Why did my deployed strategy's APY reset?** APY is based on realized profit since deployment. If you stop a strategy and redeploy it, the counter starts over from the new deployment.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/strategy-studio/deploying-and-live-trading.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
