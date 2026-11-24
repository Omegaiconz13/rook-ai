> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/scan-markets.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Scan the markets

Use this when you want a quick first look across stock indices, sectors, crypto majors, top gainers, and volume leaders before digging into a specific asset.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-e9d02f39fc757182f4ba2a626cfc3f10555f1876%2Fharness-crypto-markets.png?alt=media" alt="Crypto markets overview in the Minara desktop app"><figcaption></figcaption></figure>

## What you get

A market overview that separates index moves, sector rotation, crypto leaders, trading volume, and sentiment, plus a short list of assets worth a closer look.

## Tips

* Let the market cards and lists finish loading before you ask.
* Compare broad indices, sector heatmaps, top gainers and losers, and the most active names.
* For crypto, top gainers, volume leaders, and largest market caps tell you different things. Look at all three.
* Open the individual asset before acting on anything you see in a list.

## Keep in mind

A market overview is a snapshot. A big move on a leaderboard is a reason to look closer, not a reason to trade. Prices shown are not the price you'll get when you trade.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/scan-markets.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
