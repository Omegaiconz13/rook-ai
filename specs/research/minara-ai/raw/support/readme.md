> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/readme.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Support guide

How to get help with Minara: support channels, response times, and security.

## Before opening a ticket

Search this help center first. Most common questions about deposits, withdrawals, trading, and subscriptions are already answered in the FAQ sections. If you're looking for how-to guides and feature documentation, visit the [Minara documentation](https://minara.ai/docs).

If you've searched and can't find an answer, open a support ticket.

## How to get support

**Discord (fastest)**

Join the official Minara Discord: [discord.com/invite/minaraai](https://discord.com/invite/minaraai)

Navigate to the **open-ticket** channel and use the button to create a ticket. Support takes place inside ticket channels only, not in public channels or direct messages. Anyone who contacts you directly claiming to be Minara support is a scammer.

**In-app**

Type your issue in the Minara chat. For straightforward questions, Minara can help directly. For account or funds-related issues, the chat will direct you to Discord.

## Response times

Ticket responses typically take up to 24 hours. Expect longer wait times on weekends and during high-traffic periods. Include as much detail as possible when opening a ticket: account email, wallet address, transaction hashes, and screenshots. This avoids unnecessary back-and-forth.

## Security

**Minara will never ask for your private key, seed phrase, or authenticator codes.** Anyone asking for these is a scammer.

Before interacting with any Minara-branded page or link, verify the URL. The official Minara domains are:

* App: [minara.ai](https://minara.ai)
* Documentation: [minara.ai/docs](https://minara.ai/docs)
* Discord: [discord.com/invite/minaraai](https://discord.com/invite/minaraai)
* X: [x.com/minara](https://x.com/minara)

Scammers use domains that look similar (e.g., minara-ai.com, minara.app). When in doubt, access Minara only through links from the official X account or Discord.

If you believe your account has been compromised, go to [Security incidents](https://minara.ai/docs/support/faq/wallet-and-security/security-incidents.md) for immediate steps.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/readme.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
