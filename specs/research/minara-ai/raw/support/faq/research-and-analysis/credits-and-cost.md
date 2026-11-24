> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/research-and-analysis/credits-and-cost.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Credits and cost

**How many credits does a query use?** Credit usage depends on the model you select.

**Why did this query use more credits than expected?** Besides the selected model, credit usage scales with: LLM processing, data fan-out (how many sources are queried), Deep Research depth, and Data Visualization chart rendering.

To keep costs predictable:

* Turn off Deep Research and Data Visualization when not needed.
* Avoid stacking multiple heavy modes in one query.
* In Data Visualization mode, avoid selecting extra "preferred charts."

For an unusually large charge, share the chat link on Discord — the team can audit and potentially credit your account.

**What pauses when I run out of credits?** When subscription credits are fully consumed:

* Chatting with Minara
* Deep Research
* Creating new workflows
* Running workflows with Minara Call nodes

Credits refresh at the start of each billing cycle. You can also purchase a top-up pack (requires an active paid subscription).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/research-and-analysis/credits-and-cost.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
