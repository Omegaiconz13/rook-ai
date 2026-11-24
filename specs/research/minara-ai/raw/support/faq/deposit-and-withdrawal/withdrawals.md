> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/deposit-and-withdrawal/withdrawals.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Withdrawal issues

**My on-chain withdrawal was rejected.** Common reasons:

* Insufficient balance — leave enough to cover gas fees.
* Invalid withdrawal address format.
* Network mismatch between selected token and destination address.

If the issue persists after checking these, contact us on Discord.

**Why can I trade on Solana but not withdraw when my wallet has no SOL?**

Withdrawals on Solana require a small SOL balance in your Minara Solana wallet to cover network transaction fees (gas) and any applicable account balance requirements. If your wallet has no SOL, especially if it has never been funded with SOL, your withdrawal may fail even if you have enough USDC or other tokens.

Deposit at least 0.003 SOL into the same Minara Solana wallet you are withdrawing from. Once the deposit arrives, try the withdrawal again.

Trading on Solana is not affected: Minara pays the SOL transaction fees on your behalf and recovers the cost from your balance. This fee-advance mechanism does not apply to withdrawals.

The SOL deposit is not a fee charged by Minara. Any remaining available SOL can be withdrawn later, subject to network fees and account requirements. Network transaction fees are non-refundable.

**My withdrawal hasn't arrived in my external wallet.** Most withdrawals complete within a few minutes. Check the transaction status on a blockchain explorer using your transaction hash. If the transaction is confirmed on-chain but hasn't appeared in your wallet, the issue is with the receiving wallet — contact that wallet's support.

**I accidentally withdrew to the wrong address.** On-chain transactions are irreversible. Minara cannot reverse a completed withdrawal. If the address belongs to a known exchange, contact that exchange's support with your transaction hash.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/deposit-and-withdrawal/withdrawals.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
