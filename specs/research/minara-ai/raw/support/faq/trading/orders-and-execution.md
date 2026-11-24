> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/support/faq/trading/orders-and-execution.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Orders and execution

**My order didn't execute.** Before execution, Minara checks account balance, gas fees, and slippage settings. If the order failed:

* Check that your wallet has sufficient balance (including gas).
* Review the slippage tolerance — low tolerance on volatile pairs can prevent fills.
* Check the Activity log (Asset → Activity) for the error details.

If the order shows as executed but you don't see it in your position, check the correct wallet and chain.

**How does Minara handle failed trades?** Minara uses a multi-layer retry mechanism. If network congestion or price volatility occurs during execution, it adjusts gas fees and retries automatically. If the trade ultimately fails, you'll see a detailed error in the Activity log.

**Can I manually stop or pause an automated strategy?** Yes. You can pause, modify parameters, or stop any strategy at any time — including active Autopilot strategies or limit orders. This is by design; Minara's philosophy is "AI automation + human control."

**Where can I view my trade history?** Go to Asset → Activity to view all transactions and account activity.

**My Autopilot stopped running unexpectedly.** Common causes: credits ran out (Minara Call nodes consume credits), wallet connector disconnected, or the strategy hit a configured stop condition. Check your credit balance and verify the wallet connector is still active.

**My manually placed order was closed unexpectedly.** Check whether you have an Autopilot strategy running. Autopilot's order management takes priority over manually placed orders — when it adjusts or closes positions to manage risk, it can affect positions you opened manually. If you need manual orders to stay open, pause or stop any running Autopilot strategies first.

**What are the trading fees on Minara?** Minara charges a fee on each executed perpetual trade. For the current fee schedule, see the [trading fees page](https://minara.ai/docs/guide/managing-funds-and-trading/trading-fees) in the Minara documentation. Spot trading fees vary by asset and chain.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/support/faq/trading/orders-and-execution.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
