> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/research-and-analysis/data-accuracy.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Data accuracy

**Minara analyzed the wrong token.** Verify the contract address and chain shown in the response. Click the "Cooking completed" reasoning panel to see which data sources were used. Ask again with the contract address and chain specified explicitly.

If Minara consistently returns wrong data for a specific token, share the chat link and open a ticket in Discord for a credit refund.

**Minara's answer has factual errors.** Ask Minara to re-fetch and analyze again. For investment-critical data, cross-check key values across at least two independent sources. Minara labels key data with specific sources — you can ask "Where is this data from?" for a breakdown.

**Minara agreed with my wrong assumption.** Avoid framing questions as statements with an answer embedded (e.g., "I think BTC is bearish, right?"). Minara may agree rather than contradict. Instead, ask for multi-angle analysis: "Analyze BTC and show how each signal supports or contradicts a bullish or bearish view."

**What data sources does Minara use?** Over 50 professional data providers including Arkham, CoinMarketCap, CoinGlass, DeFiLlama, Glassnode, NFTGo, Polymarket, Goplus, and xStocks. Coverage spans on-chain transactions, price data, DeFi, social sentiment, macro signals, and tokenized stocks.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/research-and-analysis/data-accuracy.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
