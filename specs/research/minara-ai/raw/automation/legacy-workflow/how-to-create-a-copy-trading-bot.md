> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/legacy-workflow/how-to-create-a-copy-trading-bot.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Copy trading bot (Legacy)

Automatically mirror trusted wallet buy and sell strategies with Minara workflows, no manual effort needed.

{% hint style="warning" %}
**Legacy.** This page describes Workflow in the Minara web app, which is being retired. It is kept for reference only and may not reflect current behavior. For new automations, see [Wallet and trader monitoring](https://minara.ai/docs/automation/wallet-and-trader-monitoring.md) and [Automated trading plans](https://minara.ai/docs/automation/automated-trading-plans.md) in the Minara desktop app.
{% endhint %}

### What you’ll build

* A workflow that monitors target wallets on-chain
* Auto-executes the same buy/sell trades with your Minara wallet
* Supports spot tokens on supported chains

***

### Step-by-step

1. **Pick wallets to follow**
   * Get the wallet address you want to copy (e.g., `0x1234...abcd`).
   * Make sure this is an active trader with real volume — copying inactive or “spam” wallets won’t help.
   * You may select mutiple wallets to monitor and mirror in one workflow.
2. **Create a workflow in Minara**
   * Prompt example:

     > “Watch this wallet DbrdV2...(a wallet address) on the Solana chain, and copy each buy/sell action with $50 per trade.”
3. **Set execution rules**
   * Use fixed trade amounts (e.g., $50 per order) for predictability and easier risk control.
4. **Choose notification method**
   * Receive trade execution notification via email or telegram.
5. **Deploy and monitor**
   * The bot will monitor the wallet’s on-chain activity.
   * When a supported trade is detected, Minara will mirror it following your rules.
   * You’ll receive a notification each time a trade is executed.

***

### Best Practices

* **Vet before you follow**: Many wallets belong to insiders or short-term memecoin players — research before copying.
* **Start small**: Test with small balances first to check execution accuracy.
* **Asset whitelist/blacklist:** only copy certain tokens, or exclude risky memecoins.

***

### Current Limitations

* Only spot token trades are supported.
* Copying is limited to supported chains detected by the Monitor system.

***

### Future Developments

* Proportional trade sizing (e.g., match 10% of their position size).
* Risk Control (e.g. setting daily/weekly spend limits)
* Smarter filters (e.g., copy only if trade > $10,000, or exclude tokens under $1M market cap)
* Portfolio mirroring (not just individual trades)
* Futures and leverage support


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/legacy-workflow/how-to-create-a-copy-trading-bot.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
