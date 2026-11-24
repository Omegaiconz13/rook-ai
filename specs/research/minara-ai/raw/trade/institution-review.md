> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/institution-review.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Institution review

Use this when you want one investment question looked at from several expert angles before you form a view.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-d340c2c41b3e5a28c609619623b8869c6faa0519%2Fharness-institution.png?alt=media" alt="Institution review start screen in the Minara desktop app"><figcaption></figcaption></figure>

## What you get

A structured review with competing views, the assumptions worth challenging, what would change the conclusion, and the main risks.

## What to include in your request

* The asset, tickers, or question.
* Your time horizon and the decision you're facing.
* Any assumptions you want challenged.
* The format you want back.

## What to check in the result

* The data cited and when it's from.
* The conditions that would change the conclusion.

## Keep in mind

Institution review is a research tool. It doesn't place trades or make decisions for you.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/institution-review.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
