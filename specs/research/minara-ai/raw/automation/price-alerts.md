> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/price-alerts.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Price alerts

Get notified in real time when a price crosses or stays beyond your level.

{% hint style="info" %}
Automation is available only in the Minara desktop app. The web app and mobile app do not support it yet.
{% endhint %}

A price alert watches a live price and notifies you when your condition is met. Real-time monitoring runs as a simple price check rather than an AI query, so a frequent alert does not burn credits on analysis.

## Two kinds of alerts

| You say                                  | Alert type               | What happens                                                                                                                                                                      |
| ---------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "breaks", "crosses above", "drops below" | **When a price crosses** | Notifies you the moment the price moves across your level. If the price is already past the level when you create the alert, it waits for the next crossing.                      |
| "is above", "is below", "higher than"    | **While a price holds**  | Notifies you whenever the price is on your side of the level, including right away if it already is. You choose the minimum time between alerts, or ask for it to fire only once. |

If your wording could mean either, Minara asks which one you want. When you create the alert, Minara also checks the current price and tells you whether it would fire immediately.

## What you can watch

* **Binance** pairs, such as BTC or ETH.
* **Hyperliquid** markets, including crypto, and tokenized stocks and commodities listed there.
* **On-chain tokens** on Ethereum, Base, BSC, Solana, Arbitrum, Optimism, Polygon, and Avalanche. For these, give the chain and the token's contract address.

For assets outside these sources, or for conditions such as "moves more than 5% in a day", Minara can check on a schedule instead. See [Scheduled briefs and reports](https://minara.ai/docs/automation/scheduled-briefs-and-reports.md).

## Example prompts

* *"Tell me when BTC breaks $120,000."*
* *"Alert me on Telegram if ETH drops below $3,000. Just once."*
* *"While SOL is above $250, remind me every hour."*
* *"Notify me when this Base token 0x... crosses $0.05."*
* *"Alert me when Bitcoin drops more than 5% in a day."*

## Set it up

1. In the desktop app, open **Automations** and describe the alert in the **Chat** tab.
2. Include the asset, the level, the direction, and the channel. For on-chain tokens, include the chain and contract address.
3. Confirm the alert type if Minara asks.
4. Minara saves the alert and turns it on. You can pause it at any time from **Manage**.

## Tips

* **Double-check small tokens.** Copycat tokens with the same name are common. Always confirm the chain and contract address.
* **Use "once" for one-off targets.** An alert that fires once pauses itself afterwards, so you don't get repeated messages.
* **Add context if you want it.** Ask for *"and explain what might have caused the move"* to add a short AI note to each alert. This step uses credits.

## Limitations

* The desktop app must be running to watch prices. Alerts can be missed while it is closed or offline.
* Real-time alerts cover Binance, Hyperliquid, and the on-chain DEX chains listed above.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/price-alerts.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
