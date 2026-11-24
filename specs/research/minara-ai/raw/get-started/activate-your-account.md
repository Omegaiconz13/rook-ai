> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/get-started/activate-your-account.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Create your account

Sign up for Minara with Google or email.

There are two ways to get to the sign-up screen. Use either one.

## 1. Open the app

**From the homepage:** If you land on [minara.ai/home](https://minara.ai/home), click `Try Minara` in the top-right corner to enter the app.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-823b3cb39f2846238cb9f2516778f00909454743%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

**Or, from the chat page directly.** If you land on [minara.ai](https://minara.ai) without an account, click `Log in / Register` in the top-right corner.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-c0cc511a3b86b7aa9c9beeca1b67623ff6d388e0%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

## 2. Sign up with Google or email

In the sign-up dialog you have two options. Click `Continue with Google` to sign in with your Google account in one click. Or click `Continue with email`, enter your address, and type the verification code you receive to finish creating the account.

Once your account is created you land in the chat interface. Your spot wallet and perps wallets are created automatically; you do not need to set them up manually.

## Next steps

* [Deposit](https://minara.ai/docs/get-started/deposit.md) funds, transfer between wallets, and manage Lighter and Hyperliquid wallets.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/get-started/activate-your-account.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
