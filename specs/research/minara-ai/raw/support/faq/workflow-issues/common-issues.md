> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/workflow-issues/common-issues.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Workflow troubleshooting

**My workflow was deployed but didn't do anything.** Common causes: the trigger condition wasn't met, a required connector (Telegram, email, exchange) is missing or unauthorized, or the workflow uses a node type that isn't fully supported yet.

What to check:

* Confirm the workflow is based on a supported template (price alert, automated trade, scheduled analysis, copy trading).
* Verify all connectors are correctly linked and authorized in your settings.
* Review each node's logic to confirm inputs are valid.

Open a Discord ticket with your workflow ID if the issue persists.

**My price alert triggered once and then stopped.** This is expected. Price-triggered workflows are one-shot by design — each branch executes once when the condition is met, then ends. For continuous monitoring, set multiple price-triggered branches in one workflow, or use a scheduled workflow instead.

**I set up an email alert but never received anything.** Common causes:

* The workflow failed before reaching the email node (check workflow logs).
* The email connector is not verified or authorized.
* The email went to spam.
* Credits ran out before the email node executed.

Check your spam folder and verify your email connector settings. Open a Discord ticket with your workflow ID if needed.

**My workflow stopped running after some time.** Most likely cause: credits ran out. All active workflows pause automatically when subscription credits are fully consumed. Check your credit balance and top up or upgrade your plan if needed.

**Can I set multiple price targets in one workflow?** Yes. Add multiple price-triggered branches — each fires independently when its condition is met. For continuous monitoring of the same price level, use a scheduled workflow.

**What workflow types are stable and supported?** Currently stable:

* Price alert bot
* Automated trade with TP/SL
* Scheduled analysis report
* Copy trading bot

Custom workflows outside these templates may not be fully supported yet.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/workflow-issues/common-issues.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
