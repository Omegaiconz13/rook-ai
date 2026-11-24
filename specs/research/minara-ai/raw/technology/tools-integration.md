> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/technology/tools-integration.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Tool Stack

Minara integrates the following external tools, including various data sources from the financial and crypto sectors, as well as Minara team's private data and knowledge base.

## Data sources

Minara does not rely on web search for actionable insights, **because they're often unreliable and outdated.** Instead, Minara opted to integrate various industry data sources, covering the following categories:

* **Finance Data**: transactions, stocks, crypto, DeFi, NFTs, liquidation, Web3 project/VC information, etc
* **Audience Data**: entities, holders, smart money, social identities, P\&L, relationships, etc
* **Sentiment Data**: news, X posts and trends, Greed/Fear index, macro signals, policy headlines, etc

These data are sourced from **50+** leading industry data and sentiment providers, including:

<table><thead><tr><th width="238.9375">Data Source</th><th>Data Usage</th><th>Latency</th></tr></thead><tbody><tr><td>Minara's private database</td><td>On/off chain identity, wallet tags, industry experience and know-how, private metrics and trading strategies.</td><td>Real-time</td></tr><tr><td>Arkham</td><td>Analyzing transactions, capital inflow&#x26;outflow and identifying entities.</td><td>Real-time</td></tr><tr><td>Blockchain RPC providers</td><td>Full data access to multiple blockchains.</td><td>Real-time</td></tr><tr><td>Listing/Delisting Announcement</td><td>Capture the latest token listing and delisting events.</td><td>1 - 3s</td></tr><tr><td>CoinMarketCap/CoinGecko</td><td>Comprehensive token information, price data and advanced metrics.</td><td>Real-time</td></tr><tr><td>CoinGlass</td><td>Advanced cryptocurrency and ETF data &#x26; signals.</td><td>Real-time</td></tr><tr><td>DeFiLlama</td><td>Comprehensive DeFi data.</td><td>Real-time</td></tr><tr><td>Glassnode</td><td>Advanced blockchain and market intelligence.</td><td>Real-time</td></tr><tr><td>NFTGo</td><td>Comprehensive NFT data and market insights.</td><td>Real-time</td></tr><tr><td>Token launchpads like Virtuals.io/Pump.Fun/Bonk.fun</td><td>The latest token launch and trading data.</td><td>Real-time</td></tr><tr><td>RootData</td><td>Comprehensive and reliable information on Web3 projects, teams, funding, and news.</td><td>1min</td></tr><tr><td>Social media</td><td>Social media and sentiment data.</td><td>Real-time</td></tr><tr><td>Global news</td><td>Capture macro trends and detect sentiment. Applicable to most scenarios.</td><td>5-10s</td></tr><tr><td>Polymarket</td><td>Event prediction and probability</td><td>Real-time</td></tr><tr><td>Goplus</td><td>Token and smart contract security, and risk analysis.</td><td>Real-time</td></tr><tr><td>xStocks</td><td>Tokenized representations of real-world stocks and ETFs.</td><td>Real-time</td></tr><tr><td>OpenAI/Grok Websearch</td><td>Web page search and scraper.</td><td>Real-time</td></tr><tr><td>FMP</td><td>Accurate financial data for over 70,000+ publicly traded stocks.</td><td>Real-time</td></tr></tbody></table>

## Blockchain interaction

| Tool             | Usage                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Wallet operation | Send transactions using the user's smart wallet: trade crypto assets, stake, interact with contracts, and create tokens. |
| N8N workflow     | Create any kinds of crypto workflow by prompting.                                                                        |


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/technology/tools-integration.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
