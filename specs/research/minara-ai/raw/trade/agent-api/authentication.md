> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/agent-api/authentication.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Authentication

Minara provides two methods for authenticating API requests.

### API Key (Subscription)

The standard method for **Pro** and **Partner** plan users. Include your API key in the `Authorization` header of every request.

**Format:**

```
Authorization: Bearer <YOUR_API_KEY>
```

**Example:**

```bash
curl -H "Authorization: Bearer sk-minara-xxxxxxxx" https://api.minara.ai/v1/developer/chat
```

> **Security:** Treat your API keys like passwords. Never expose them in client-side code or public repositories.

👉 **Learn more:** [Broken mention](broken://pages/PWjrBKiSd4zKX9Kk3gNs)

### Pay-As-You-Go (x402)

For usage-based access without a subscription, we support the [**x402 protocol**](https://www.x402.org/). Pay for API calls directly using stablecoins like $USDC (no subscription required).

**x402 API URL**:[https://x402.minara.ai](https://x402.minara.ai/)

**Explore our x402 endpoints:** [Minara on x402scan](https://www.x402scan.com/server/66307a3c-aeb9-4508-9531-71eed69bc9b5)

👉 **Learn more:** [Broken mention](broken://pages/N30vuC6vXVYQnNTfAfq1)


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/agent-api/authentication.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
