> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/technical-issues/app-issues.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# App issues

**Does Minara have a mobile app?** Yes. Minara is available on iOS and Android. Download it from [minara.ai/download-app](https://minara.ai/download-app).

**What languages does Minara support?** The web app currently supports 16 major languages. More languages may be added in the future.

**The app won't load.**

* Check that you're not in a restricted region (Mainland China, North Korea, and certain other regions are not supported).
* Confirm your internet connection is working.
* Clear browser cache and cookies, try incognito mode, or switch browsers.
* On mobile, try switching between Wi-Fi and mobile data.

If the issue persists, contact us on [Discord](https://discord.com/invite/minaraai).

**Chat appears frozen after I submit a question.** Some requests trigger long-running background jobs (multi-source data fetches, large on-chain scans, chart rendering). The UI may appear inactive for 1–2 minutes while results process.

1. Wait for the completion window to close.
2. If still stuck after 2 minutes, refresh the page and resume the chat.
3. If the chat is unresponsive after refreshing, share the chat link and open a Discord ticket.

**Minara gave no output at all.**

1. Check your credit balance — queries don't run without credits.
2. Check subscription status.
3. Refresh the page or start a new chat, then retry.
4. The selected model may have stopped mid-response. Switch to a different model and retry (for example, if Claude stopped, try GPT).
5. Contact Discord if the issue persists, and tell us which model you selected so the team can investigate.

**My data isn't syncing between mobile and desktop.** Make sure you're logged into the same account on both devices. Refresh or re-login on both.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/technical-issues/app-issues.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
