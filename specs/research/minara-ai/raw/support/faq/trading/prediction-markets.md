> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/trading/prediction-markets.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Prediction markets

**Why do all three prediction markets show NO — or all show YES?** This is expected behavior, not a bug.

Each of the three bet types is a separate prediction market. Minara's AI evaluates each one independently, comparing its own probability estimate for the event against how the market has priced that probability. The goal is to find edges — cases where the AI's estimate differs meaningfully from the implied odds.

Whether the AI recommends YES or NO depends on two factors working together:

* **Win rate**: how likely the AI thinks the event is to occur
* **Odds**: how much the market pays out if it does

A high-probability outcome isn't automatically a YES if the odds are too low to justify the bet. The AI recommends YES only when its probability estimate is higher than what the market's price implies.

**How the AI calculates probabilities for a Range market**

For a Range market with three outcomes — Below, In-range, and Above — the AI calls a single model that outputs P(BTC > X), the probability that BTC exceeds a given price at settlement. It runs this calculation for each boundary price.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/trading/prediction-markets.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
