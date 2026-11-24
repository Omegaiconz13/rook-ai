> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/account-and-access/login-and-access.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Login and account access

**I can't log in to Minara.** Minara uses Google OAuth. Make sure you're using the Google account that was used to create your Minara account. Clear browser cache or try incognito mode. If using a VPN, try disabling it — Minara is not available in Mainland China, North Korea, and certain restricted regions.

If you still can't log in, join our [Discord](https://discord.com/invite/minaraai) and open a support ticket.

**My session keeps getting logged out.** This can happen after a period of inactivity or on a new device. Log in again via the Google button. If you're losing a session immediately after logging in, clear cookies and try a different browser.

**I forgot which Google account I used.** There is no way to look up your account by email without a support ticket. Contact us on Discord with any details you remember (username, wallet address, approximate signup date).

**How do I reset my authenticator app?** If you've lost access to your authenticator app (e.g., lost phone), contact support on Discord with account verification details. We cannot bypass 2FA without identity verification.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/account-and-access/login-and-access.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
