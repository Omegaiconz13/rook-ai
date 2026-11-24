> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/get-started/how-minara-works.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# How Minara works

What happens between your request and Minara's answer, and where you stay in control of your money.

A smart model can reason about a market. To be useful for real financial work, it also needs the right information, the right tools, and clear limits on what it is allowed to do. The system around the model that provides these is called the Minara Harness. It is what lets Minara go from a question to research, analysis, and, once you approve, action.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-9cbb7d39378a998ad798de32cc61d0e8c02d4d68%2Fharness-desktop-office.png?alt=media" alt="Minara desktop app home screen"><figcaption></figcaption></figure>

## What it means for you

* **Answers grounded in data.** Minara pulls live market data, your portfolio, and relevant history into each task, and tells you where its numbers come from.
* **You stay in control.** Minara can research and prepare a trade, but anything that moves your money waits for your approval.
* **It remembers what helps.** Useful preferences and lessons carry over, so you don't have to start from scratch every time.

The model reads your request, weighs the evidence, and proposes next steps. The harness decides what the model can see, which tools it can use, and when it has to stop and ask you. For example:

* Reading BTC funding data is quick and needs no approval.
* Preparing an order shows you the price, size, leverage, and risk before anything happens.
* Placing the order requires your confirmation.
* Remembering that you prefer low leverage helps Minara tailor its answers, but it never counts as permission to trade.

## Web and desktop

Minara works the same in the web app and the desktop app: one interface, one agent. On the web, each user's work runs in a private cloud sandbox of their own, and your chats can sync between devices. A few features that need your own computer, such as Automation and computer control, are desktop-only. See [Workspace](https://minara.ai/docs/reference/workspace.md).

## From request to answer

### 1. You describe the goal

The clearer the request, the better the result. Instead of "what should I buy?", try something like:

> Compare the current BTC setup using funding, open interest, recent price action, and my portfolio exposure. Give me the bullish case, the bearish case, the levels that would prove each wrong, and what I'd need to approve before placing an order.

A good request names the asset or question, your time horizon, and the format you want back.

### 2. Minara gathers what it needs

Minara brings in only what's relevant to your request, such as:

* your request and the conversation so far;
* live market data, news, and on-chain information;
* your portfolio and strategy information;
* files you've shared and memories you've chosen to keep.

Specialized tools are brought in only when the task needs them, which keeps answers focused.

### 3. Minara does the work

Minara can read market pages, run analysis, check your portfolio, write and run scripts, and, if you've turned it on, use your computer for a specific task. See [Workspace](https://minara.ai/docs/reference/workspace.md).

Throughout, Minara keeps a clear line between what it was *asked* to do and what *actually happened*. Previewing an order is not the same as placing it, and a backtest is not the same as live performance.

### 4. Minara stops when your approval is needed

Trades, transfers, publishing anything, and other actions with real consequences always wait for you. Minara can't approve these on its own. See [Safety and approvals](https://minara.ai/docs/technology/safety-and-approvals.md).

### 5. You get a clear handoff

A good answer tells you:

* what was checked and which sources were used;
* what is still uncertain;
* what you'd need to approve before taking action;
* where any files or follow-ups are saved.

## About market data

Minara draws on many data providers. See [Tool Stack](https://minara.ai/docs/technology/tools-integration.md) for the full list. A few things to keep in mind:

* **Sources can differ.** Different venues and providers may show slightly different numbers for the same asset. Minara tells you which source it used.
* **Prices mean different things.** A reference price, a mark price, and the price you can actually trade at are not the same. Research prices are not guaranteed execution prices.
* **Missing data is not "zero".** If a source is unavailable, Minara says so instead of guessing.
* **Old results don't update.** An earlier answer shows the data as it was then. Ask again for current numbers.

## When something goes wrong

If a data source is down, a connection is missing, or a step fails, Minara tells you what actually happened. If an order or transfer may have gone through despite an error, Minara checks its status first instead of trying again, so nothing is placed twice.

## What you can do next

| I want to...                                   | Guide                                                                                                |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Get a quick read on the market                 | [Scan the markets](https://minara.ai/docs/trade/scan-markets.md)                                     |
| Research an asset before trading               | [Research an asset before you trade](https://minara.ai/docs/trade/trading-copilot/asset-research.md) |
| Get several expert views on one question       | [Institution review](https://minara.ai/docs/trade/institution-review.md)                             |
| Compare and shortlist strategies               | [Compare Top Strategies](https://minara.ai/docs/trade/strategy-market/compare-top-strategies.md)     |
| Build a strategy from a form or plain language | [Strategy Studio](https://minara.ai/docs/trade/strategy-studio.md)                                   |
| Get a market brief on a schedule               | [Scheduled briefs and reports](https://minara.ai/docs/automation/scheduled-briefs-and-reports.md)    |
| Track an investment thesis                     | [Research monitors](https://minara.ai/docs/automation/research-monitors.md)                          |


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/get-started/how-minara-works.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
