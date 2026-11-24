> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/wallet-and-security/wallet-basics.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Wallet and balance

**My balance shows $0 or won't refresh. Are my funds missing?** A $0 balance is often a temporary data-loading issue, not proof that your funds have moved. Check your network connection and API rate limits first.

Hyperliquid rate-limits API requests. Keeping several Minara Perps windows open alongside Hyperliquid windows can send too many concurrent requests. When this happens, the Minara front end may be unable to fetch the latest account data and can temporarily show $0 or a stale balance.

1. Close extra Minara Perps and Hyperliquid windows.
2. Wait a few minutes, then refresh a single Minara window.
3. Confirm that you're viewing the correct wallet: EVM Spot Wallet, Solana Spot Wallet, or Perps wallet.
4. If the balance still does not load, open a [Discord](https://discord.com/invite/minaraai) ticket with your wallet address, a screenshot, and the approximate time the issue started.

If the balance changed after a deposit or withdrawal, also check Asset → Activity and include the transaction hash in your support ticket.

**Will Minara execute trades without my authorization?** No. Every trade requires your explicit confirmation. Large transactions trigger a secondary confirmation step. Automated strategies (Autopilot, Workflow) only execute after you have explicitly activated them.

**What kind of wallet does Minara use?** Minara creates a non-custodial smart contract wallet for each user, built on the ERC-4337 standard (powered by [Privy](https://www.privy.io/)). It is an on-chain wallet — not stored in Minara's internal database. Minara can manage funds in the wallet but cannot hide, delete, or blacklist it. Every transaction is publicly verifiable on-chain.

**I sent assets to the wrong chain. Can I get them back?** If you sent to a supported chain you didn't intend (for example, USDC on Ethereum instead of USDC on Base), contact support on [Discord](https://discord.com/invite/minaraai) immediately with your transaction hash. Recovery options depend on the specific situation, but assets sent to a supported chain can often be accessed.

If you sent to an unsupported chain entirely, see below.

**I deposited from an unsupported chain. Can I recover my funds?** Contact us on Discord immediately with your transaction hash. Recovery is not guaranteed — common reasons for unrecoverable deposits are unsupported blockchains or incorrect recipient addresses.

**How do I export my private key?** See [Export your private key](https://minara.ai/docs/support/faq/wallet-and-security/export-private-key.md).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/wallet-and-security/wallet-basics.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
