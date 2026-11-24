> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/strategy-studio/strategy-code.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Strategy code

**Can I create a strategy without coding?** Yes. Describe the strategy in plain language and Minara writes the code for you. You read it and refine it through more chat, without writing code by hand.

**Why did I see “Provider returned error” while Minara was generating my strategy?** This is usually a temporary model-provider overload caused by many users generating strategies at the same time. It does not necessarily mean there is a problem with your strategy logic.

Wait a few minutes, refresh the page, and try generating the strategy again. The issue normally resolves on its own. If the same error continues after several attempts, contact Minara Support and include the error screenshot, timestamp, and the action you were taking.

**The generated code has an error. What do I do?** Ask Minara to fix it in the same chat. Paste the error message if there is one, and Minara corrects the code so you do not have to debug it yourself.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/strategy-studio/strategy-code.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
