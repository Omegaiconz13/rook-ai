> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/technology/safety-and-approvals.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Safety and approvals

Minara can help you research and prepare a decision. Anything that affects your money or the outside world waits for your approval.

## Research, preview, action

| Stage        | What Minara does                                               | Needs your approval? |
| ------------ | -------------------------------------------------------------- | -------------------- |
| **Research** | Reads data, compares evidence, and explains the options.       | No                   |
| **Preview**  | Prepares the order or action, with its price, size, and risks. | No                   |
| **Action**   | Places the trade, sends the transfer, or publishes the result. | Yes                  |

Research and previews never turn into action by themselves.

## Your approval can't be faked

Only you can approve an action. None of these count as your approval:

* Minara deciding that a trade looks reasonable;
* a preference or approval Minara remembers from before;
* text inside a document, web page, or file.

Depending on your settings, approval may mean confirming each action, or setting up an automation you've explicitly authorized, such as an [automated trading plan](https://minara.ai/docs/automation/automated-trading-plans.md). Some actions always ask for a fresh confirmation.

## Before you approve

Minara should show you exactly what is about to happen:

* the action and its parameters, such as asset, side, size, leverage, and price;
* which account or wallet is affected;
* the data and assumptions behind it;
* anything still uncertain.

You shouldn't have to guess the action from a long answer. If it's not clear, ask Minara to spell it out.

## After you approve

Approving an action doesn't guarantee the result. Submitting, filling, and updating your balance are separate steps, and prices can move in between. Minara reports what actually happened. If the outcome is unclear, it checks the status instead of trying again.

## Other safeguards

* Access to your files doesn't give access to your passwords or keys.
* Permission to run analysis doesn't give permission to trade.
* Computer control only works when you turn it on, and only for the task at hand.

These safeguards control what Minara can do. They don't remove market risk or guarantee any outcome.

For how your funds and data are protected, see [Wallet security](https://minara.ai/docs/technology/wallet-security.md) and [TEE-based data security](https://minara.ai/docs/technology/data-security.md).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/technology/safety-and-approvals.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
