> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/strategy-followers.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Strategy Subscribers

Subscribers use strategies published by other Minara users. You can compare performance in Top Strategies and Marketplace, inspect the strategy and its creator, save it for later, then subscribe and run it from your own wallet through Autopilot.

{% embed url="<https://youtu.be/UHkUdSjJ-Ug?si=QQd-Df9vy-VQcZpF>" %}

If you are new to Minara, use the existing [Create your account](https://minara.ai/docs/guide/getting-started/activate-your-account) and [Deposit](https://minara.ai/docs/guide/managing-funds-and-trading/deposit) guides before starting this path.

## The Subscriber path

1. [Explore the market](https://minara.ai/docs/academy/strategy-followers/explore-the-market.md) through Top Strategies, Marketplace, and creator profiles.
2. [Run your first strategy](https://minara.ai/docs/academy/strategy-followers/run-your-first-strategy.md) after reviewing its live record, drawdown, and trading setup.
3. [Monitor Autopilot](https://minara.ai/docs/academy/strategy-followers/autopilot-explained.md), including equity, open positions, orders, and trade history.

You can also star a strategy without running it. Starred strategies remain available from your profile when you want to return to them.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/strategy-followers.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
