> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/deposit-and-withdrawal/card-deposits.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Card deposit issues

Minara does not operate card payment services directly. We aggregate third-party OTC providers (MoonPay, Banxa Pay). For card payment issues, contact the provider directly.

**I paid with my card but haven't received crypto.** In most cases, if a transaction fails, funds are automatically refunded to your payment method. If you haven't received crypto or a refund after 24 hours, contact the OTC provider with your payment proof and order ID:

* MoonPay: [support.moonpay.com](https://support.moonpay.com)
* Banxa Pay: [support.banxa.com](https://support.banxa.com/en/support/home)

**I can't pass KYC.** KYC requirements vary by provider and region. Try a different bank card, select an alternative payment channel, or contact the OTC provider's support directly. Minara cannot intervene in the KYC process.

**I received less crypto than expected.** This is usually due to platform fees, exchange rate slippage, or gas fees. If the shortfall is unusually large, contact the OTC provider with your transaction details and receipt.

**My card payment failed.** Try a different card or payment channel. You can also skip card payment entirely and deposit on-chain directly to your Minara wallet address.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/deposit-and-withdrawal/card-deposits.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
