> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/trading/unknown-errors.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Unknown errors

An "Unknown error" appears when Minara cannot complete your request due to a temporary network issue or an unexpected response from the server. This is not specific to any single feature — it can occur in Copilot, Autopilot, Strategy Studio, or anywhere else in the app.

## What causes this

* A brief drop in your network connection during a request
* The server returning an incomplete or malformed response
* A timeout caused by high traffic or temporary backend unavailability

## What to do

**Wait and retry.** Wait around 10 minutes, then try the same action again. Most unknown errors resolve on their own as network conditions stabilize.

**Log out and log back in.** Go to your account menu, log out, and sign in again. A fresh session clears stale state that can trigger repeated errors.

{% hint style="info" %}
If the error appeared while placing a trade, check your open positions and order history before retrying to avoid placing a duplicate order.
{% endhint %}

## Still not working?

If the error persists after waiting and logging back in, open a support ticket in our Discord server.

1. Join [Minara Discord](https://discord.com/invite/minaraai)
2. Find the **#open-a-ticket** channel
3. Describe the error, including what you were trying to do, when it appeared, and a screenshot if possible


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/trading/unknown-errors.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
