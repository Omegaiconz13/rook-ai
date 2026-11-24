> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/readme.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Getting started

This section gets you oriented before you build or run a strategy. It explains what Strategy Studio is, how the interface is organized, and the terms used throughout Academy.

{% embed url="<https://youtu.be/UHkUdSjJ-Ug?si=QQd-Df9vy-VQcZpF>" %}

* [What Strategy Studio is](https://minara.ai/docs/academy/readme/what-strategy-studio-is.md)
* [The interface](https://minara.ai/docs/academy/readme/the-interface.md)
* [Glossary](https://minara.ai/docs/academy/readme/glossary.md)

When you are ready to continue, open the Strategy Subscribers section to run an existing strategy or Strategy creators to build your own.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/readme.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
