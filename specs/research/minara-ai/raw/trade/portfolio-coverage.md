> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/portfolio-coverage.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Portfolio coverage

Use this when you ask about your holdings, exposure, or strategies, and want to know exactly which accounts the answer includes.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-1468b28d75a1608401fc01def5732da04979196d%2Fharness-portfolio-coverage.png?alt=media" alt="Portfolio coverage view in the Minara desktop app"><figcaption></figcaption></figure>

## What you get

An exposure summary split into spot, perps, and strategies, and a clear note of which accounts or assets are not included.

## What to check

* How many wallets are connected, and which ones are selected.
* The **Overview**, **Spot**, **Perps**, and **Strategies** tabs.
* Any exchange accounts, outside wallets, or other assets that aren't included.

## Keep in mind

Your portfolio view only covers the Minara wallets and accounts connected to the app. It isn't a complete picture of everything you own unless you've connected it all. To give Minara context on wallets outside Minara, you can import them in [Personalization](https://minara.ai/docs/reference/personalization.md).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/portfolio-coverage.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
