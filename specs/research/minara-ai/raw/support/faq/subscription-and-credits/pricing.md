> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/subscription-and-credits/pricing.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# How is the plan priced?

Minara uses a **usage-based pricing model** built around **Credits** ([How credits work](https://minara.ai/docs/support/faq/subscription-and-credits/how-credits-work.md)), our unit for AI computation.

\
Each plan includes a fixed number of Credits plus **Bonus Sparks** ([What are Sparks?](https://minara.ai/docs/support/faq/subscription-and-credits/sparks.md)) as monthly rewards.

***

#### 1. Pricing Overview

* **Credits** are used when you run AI queries, research, or workflows.
* **Bonus Sparks** are reward points for community perks and future exchanges.
* Plans scale by Credit volume, workflow capacity, and feature priority.
* You can upgrade, downgrade, or top-up Credits anytime.

***

#### 2. Individual Plans

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-031865d617ce5cb54867f156a31dab610131e0c3%2FScreen%20Shot%202025-10-29%20at%209.54.36%20PM.png?alt=media" alt=""><figcaption></figcaption></figure>

***

#### 3. Business Plans

<figure><img src="https://1511576976-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FV376SHLr8lDpX7dIqyDR%2Fuploads%2Fgit-blob-2b00b5664a10159b7f0ba2fb2236121217392870%2FScreen%20Shot%202025-10-29%20at%209.54.41%20PM.png?alt=media" alt=""><figcaption></figcaption></figure>

***

#### 4. Management

* Credits **reset monthly** and **renew automatically**.
* You can top up or change plans anytime; unused Bonus Sparks remain available.
* **Annual billing** options offer extra savings.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/subscription-and-credits/pricing.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
