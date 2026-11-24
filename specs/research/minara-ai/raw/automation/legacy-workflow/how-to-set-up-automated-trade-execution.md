> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/legacy-workflow/how-to-set-up-automated-trade-execution.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Automated trade execution (Legacy)

By setting order triggers, Minara place trades automatically when your target triggers are hit.

{% hint style="warning" %}
**Legacy.** This page describes Workflow in the Minara web app, which is being retired. It is kept for reference only and may not reflect current behavior. For new automations, see [Automated trading plans](https://minara.ai/docs/automation/automated-trading-plans.md) in the Minara desktop app.
{% endhint %}

Minara can watch for specific price conditions and automatically place orders when they're met, perfect for buying the dip, taking profits, or setting stop-losses without constant manual monitoring.

***

### What you'll build

A workflow that:

* Monitors the **absolute price** of a token (≥ or ≤ a set value)
* Executes **buy, sell, or both** when the condition is met, including **take-profit (TP)** and/or **stop-loss (SL)** strategies
* Sends you a notification confirming the execution

> Price monitoring is handled by our monitor system: real-time and reliable, but only for supported tokens on supported chains.

***

### Example prompts

You can simply describe the order logic you want. Minara will translate it into a workflow that uses our dedicated monitor system for high-precision execution.

1. **Simple Buy/Sell Trigger**

   > "If ETH price falls to 4,000 USDT, buy $500 worth of ETH."
   >
   > "If BTC price reaches 130,000 USDT, sell 0.1 BTC."
   >
   > "If gold (XAU) drops to $2,900, buy $200 worth."
2. **Buy + TP/SL Strategy**

   > "Buy 200 USDT of SOL if price ≤ 175 USDT, then take profit at 200 USDT and stop loss at 160 USDT."
   >
   > "If NVDA hits $1,000, buy $300 worth with a 5% stop-loss and 15% take-profit."
3. **Laddered Buy**

   > "Buy $200 ETH at 4,000 USDT, $200 at 4,150 USDT, and $200 at 4,250 USDT."
   >
   > "Buy $100 of AAPL at $200, $100 at $195, and $100 at $190."
4. **Partial Exit**

   > "If DOGE price hits 0.25 USDT, sell half my position."

***

### Best practices

* Use **limit orders with TP/SL** for better risk management.
* Keep your telegram account linked and [Minara notification bot](https://t.me/MinaraNotificationBot) enabled to get real-time execution updates.
* Check spam folder first if you didn't receive the execution result email that you should've received.
* Avoid unnecessarily small TP/SL gaps. Sudden price wicks can trigger premature exits.
* For small‑cap meme tokens, copycats and same‑name lookalikes are common, especially during hype. To avoid mistakes, always specify and double‑check the chain and the token's contract address.

> Mainstream assets like BTC, ETH, or SOL are already disambiguated by contract.

***

### Future developments

* Percentage-based triggers (e.g., +5% in 24h)
* Futures, leverage, and advanced strategies for order triggers
* Multi-condition orders (e.g., trigger only if price condition + volume spike)
* Auto-adjusting stop-loss (trailing SL)
* More trigger types (e.g. news trigger for sell-the-news strategy)


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/legacy-workflow/how-to-set-up-automated-trade-execution.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
