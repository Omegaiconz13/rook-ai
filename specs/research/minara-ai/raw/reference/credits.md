> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/reference/credits.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Credits

Credits are Minara's metering unit for AI usage. You spend credits whenever Minara's models do work for you: chat, research, scheduled analyses, API calls. Trades themselves are charged separately as trading fees, not in credits.

## How you get credits

Credits come with a Minara subscription. Each paid plan tops up your balance on its renewal cycle, and annual billing is available.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-850a304e882aebc591810794532b6085c6af5c72%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

If your subscription expires, your balance resets to the Free plan's 300 credits.

## Plans

Individual plans are available from the **Manage** dialog (top-right account menu in the web app, or ask Minara in chat to "manage credits"):

| Plan    | Price     | Credits | Active workflows | Agent          | Notes                                           |
| ------- | --------- | ------- | ---------------- | -------------- | ----------------------------------------------- |
| Free    | $0        | 300     | —                | —              | —                                               |
| Lite    | $19 / mo  | 1,400   | 5                | Smarter Agent  | 190 bonus Sparks                                |
| Starter | $49 / mo  | 4,000   | 20               | Smarter Agent  | Standard priority; 490 bonus Sparks             |
| Pro     | $199 / mo | 20,000  | 50               | Smartest Agent | API access; higher priority; 1,990 bonus Sparks |

All paid plans include unlimited Copilot and Autopilot, custom strategy deploy and run, and full feature access. Business plans are available in the same dialog under the **Business** tab.

Bonus Sparks are a separate reward currency for ecosystem perks (badges, NFT whitelists, event entry).

## What consumes credits

* Chat queries, research reports, and Crypto Picks.
* Workflow nodes marked with the Minara logo ("Minara Call" nodes). Other workflow components such as price-alert triggers and conditions run on the backend and do not consume credits.
* Scheduled analyses. Each scheduled run consumes credits, so pick a frequency that matches how often you actually need fresh output.
* All [Agent API](https://minara.ai/docs/trade/agent-api/api-key.md) calls authenticated with an API key.

## What doesn't consume credits

* The trades themselves. Trading is metered as [trading fees](https://minara.ai/docs/trade/trading-fees.md), separately from credits.
* Wallet operations: deposits, withdrawals, balance checks.
* Price-alert monitoring, which runs on Minara's backend rather than as AI queries.

## When credits run out

For Agent API requests, calls pause until your balance is replenished, either at your next renewal or after upgrading your plan.

## Refunds and plan changes

**Can I get a refund?**

Subscription fees are charged at the start of each billing cycle and are not refundable, except where required by applicable law. Top-Up Credits are also non-refundable and do not carry over to the next billing cycle.

**How do I downgrade my plan?**

Open the **Manage** dialog (top-right account menu, or ask Minara "manage credits") and select a lower plan. The change takes effect at the start of your next billing cycle. Until then, you keep full access to your current plan's features.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/reference/credits.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
