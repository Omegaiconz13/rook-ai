> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/agent-api.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# API

The Minara Agent API gives developers, traders, and market analysts direct access to Minara's financial intelligence and trading execution through a standard HTTP interface.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-0ba052ac76c53bfba4e79c5b74d89712723ec75a%2Fminara-api.png?alt=media" alt=""><figcaption></figcaption></figure>

{% hint style="warning" %}
API Key access requires a **Pro** plan subscription. On Lite and Starter plans, the API tab in your profile shows an upgrade prompt instead of a key creation interface. Pay-As-You-Go via x402 has no plan requirement.
{% endhint %}

### What you can do with the API

Query live market data across crypto and stocks: wallet activity, DeFi metrics, on-chain flows, alpha signals. All responses are structured for agent consumption.

Send a market context query and get back a long or short recommendation with a preset order payload you can execute immediately. This shortens the loop from signal to trade.

Describe a trade in plain English; the API returns an executable on-chain transaction payload, compatible with OKX DEX by default.

Query AI-estimated probability distributions for event outcomes on prediction markets, backed by market data, news context, and uncertainty bands. Use it to identify mispriced odds and size positions with clearer risk boundaries.

### How it works

Two billing methods:

1. API Key, available on the Pro plan. You generate keys from your Minara profile and include them in the `Authorization` header.
2. Pay-As-You-Go via the [x402 protocol](https://www.x402.org/). Each request is paid with stablecoins like USDC; no plan subscription required.

### Get started

* [Authentication](https://minara.ai/docs/trade/agent-api/authentication.md): how requests are authenticated under each billing method.
* [API Key](https://minara.ai/docs/trade/agent-api/api-key.md): generate and manage keys on the Pro plan.
* [x402](https://minara.ai/docs/trade/agent-api/x402.md): pay per request with stablecoins.
* [API Reference (API Key)](https://minara.ai/docs/trade/agent-api/api-reference-api-key.md): full endpoint specs for the API Key flow.
* [API Reference (x402)](https://minara.ai/docs/trade/agent-api/api-reference-x402.md): full endpoint specs for the x402 flow.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/agent-api.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
