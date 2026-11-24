> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/wallet-and-security/security-incidents.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Security incidents

**My account was hacked. What should I do?**

Act immediately:

1. **Secure your login account** — recover the email, Google, or Apple account you use to sign in to Minara, change its password, and strengthen its security with TOTP (an authenticator app) or similar protection.
2. **Log in to Minara** — set up TOTP for your Minara account. Check Asset → Activity for suspicious transactions. Pause any active automated strategies. Transfer remaining assets to a secure wallet.
3. **Preserve evidence** — take screenshots of suspicious transactions and note transaction hashes. You will need these for an investigation.
4. **Contact support** on [Discord](https://discord.com/invite/minaraai) with your account details and evidence.

**I think I've been scammed.** Do not send additional funds. Contact Minara support on Discord immediately. Save all communications and transaction records. Minara cannot reverse completed on-chain transactions, but can help investigate and, where possible, escalate to relevant parties.

**I received a message claiming to be from Minara support asking for my private key.** This is a scam. Minara will never ask for your private key, seed phrase, or authenticator codes. Report the message and contact the real Minara support on our official Discord: [discord.com/invite/minaraai](https://discord.com/invite/minaraai).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/wallet-and-security/security-incidents.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
