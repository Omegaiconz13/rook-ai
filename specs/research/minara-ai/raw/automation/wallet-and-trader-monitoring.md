> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/wallet-and-trader-monitoring.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Wallet and trader monitoring

Follow on-chain wallets and Hyperliquid or Lighter traders, and get notified when they trade.

{% hint style="info" %}
Automation is available only in the Minara desktop app. The web app and mobile app do not support it yet.
{% endhint %}

Monitoring automations watch public addresses and notify you when they trade. You can follow any address: smart money, a fund, a trader you admire, or your own wallets.

## On-chain wallets

Watch one or more wallets on **Solana, Ethereum, Base, or BSC**. When a wallet's token balances change in a way that looks like a swap, Minara sends you the details: the address, the tokens and amounts in and out, and the transaction.

* One automation can watch several addresses on the same chain.
* You can filter by token, for example only alert when a wallet trades a specific token.
* You can name a Fomo profile instead of an address. Minara looks up the wallets linked to that profile first and confirms them with you.

{% hint style="warning" %}
These alerts show a **possible swap**, detected from balance changes. They are not a confirmed buy or sell. Check the transaction before acting on it.
{% endhint %}

## Hyperliquid and Lighter traders

Watch any public address on **Hyperliquid** or **Lighter** and get notified when it trades perpetuals. Each alert can include the market, side, action (for example opening or adding to a long), size, price, and notional value.

You can narrow alerts to:

* Specific markets, such as BTC or ETH
* Specific actions, such as opening or closing positions
* A minimum trade size, such as fills above $10,000

Alerts are sent per fill. A single large order can fill in several parts, so it may produce several alerts. If you want one message per order, tell Minara how you want fills grouped.

## Example prompts

* *"Watch this Solana wallet and message me whenever it swaps more than $5,000."*
* *"Alert me in-app when 0x... opens or adds to a BTC long on Hyperliquid above $10,000."*
* *"Track these three Base wallets and tell me when any of them buys a new token."*
* *"When this Lighter trader closes a position, send me the details on Telegram and a one-line take on the trade."*

## Set it up

1. In the desktop app, open **Automations** and pick the **Wallet monitor** template, or describe what you want in the **Chat** tab.
2. Give Minara the address (or Fomo profile), the chain or venue, any filters, and the notification channel.
3. Review the flow and save it. Monitoring starts as soon as the automation is on.
4. To check the message format before a real trade happens, click **Test**. The test uses a sample event.

Want to act on these trades automatically? See [Automated trading plans](https://minara.ai/docs/automation/automated-trading-plans.md).

## Limitations

* The desktop app must be running. Hyperliquid alerts can recover only recent trades after a reconnect, and Lighter alerts cannot recover trades that happened while the app was offline.
* On-chain wallet monitoring currently covers Solana, Ethereum, Base, and BSC mainnet.
* Perpetuals monitoring covers trade fills only. Placing or canceling an order, deposits, and transfers do not trigger an alert.
* Problems with a monitor, and events that arrive too late to act on, appear in the notification center.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/wallet-and-trader-monitoring.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
