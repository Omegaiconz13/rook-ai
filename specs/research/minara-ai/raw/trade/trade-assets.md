> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/trade-assets.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Assets

Minara supports three categories of tradable assets: crypto perpetuals, tokenized stock perpetuals, and commodity perpetuals, all settled in USDC on Lighter's or Hyperliquid's on-chain order book depending on which wallet you trade from.

***

## Crypto perpetuals

Minara trades crypto perpetuals on Lighter and Hyperliquid, both high-performance on-chain order books. Perpetuals are futures contracts with no expiry date. You hold them as long as you want, and the contract price tracks the underlying asset via a funding rate mechanism.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-aff7a1c2602d17da69490a05506c93a01c47be21%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

**Supported assets**: the perpetuals listed on Lighter and Hyperliquid are available in Minara, including Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and many others. Popular pairs include BTC/USDC, ETH/USDC, and SOL/USDC. You can also trade hundreds of altcoin perpetuals from the same interface. The full list appears in the asset selector at `/app/trade/perps`.

**No expiry**: unlike traditional futures, perpetuals don't settle on a fixed date. You open a position and hold it indefinitely, or until you close it or get liquidated.

**Funding rates**: to keep the perpetual price close to the spot price, a funding payment is exchanged between long and short holders periodically. When funding is positive, longs pay shorts; when negative, shorts pay longs. The current funding rate is shown in the trading interface.

**Leverage**: Minara supports up to 25x leverage on crypto perpetuals. Leverage multiplies both gains and losses. See [Margin and leverage](https://minara.ai/docs/reference/margin-and-leverage.md) for how margin requirements work.

The trading panel is on the right side of the screen. Two order types are available: **Market** (executes immediately at the best available price) and **Trigger** (executes when the asset reaches a price you specify). Both Autopilot and Copilot use this same underlying interface.

{% hint style="info" %}
Minara routes orders through Lighter's or Hyperliquid's on-chain order book, depending on the wallet selected. Execution is non-custodial: your funds stay in your exchange account, not held by Minara.
{% endhint %}

***

## Stocks

{% hint style="danger" %}
**Stock perpetuals are not actual shares.** You do not receive dividends, voting rights, or any equity ownership. You are taking a leveraged position on price movement only. Positions can be liquidated. Closing a position ends your exposure; there is no settlement or delivery.
{% endhint %}

Minara gives you access to tokenized stocks as perpetual contracts on the supported perps exchanges. You can trade Apple (AAPL), Tesla (TSLA), NVIDIA (NVDA), Amazon (AMZN), Microsoft (MSFT), and other major equities using the same USDC-based interface as crypto. Availability varies by exchange; check the asset selector for the active wallet.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-34409329f0e55db607f56f4f0e21ee605105f5fe%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

These are perpetual contracts whose price tracks the underlying stock. Trading is available 24/7, including outside traditional market hours, though liquidity and spreads may vary when the underlying exchange is closed.

The trading mechanics are identical to crypto perpetuals: positions are denominated in USDC, funding rates apply, leverage is available (at lower maximums than crypto perps), and orders can be placed as market or trigger orders. Filter by **Stocks** in the asset selector to see all available instruments.

***

## Commodities

Minara supports trading commodity perpetuals including gold (XAU), silver (SILVER), and crude oil where the active exchange lists them.

* **Gold (XAU)**: trade gold perpetuals as XAUUSDC, priced in USDC, 24/7 without a brokerage account.
* **Silver (SILVER)**: silver futures perpetual, priced in USDC.
* **Crude oil**: available as a perpetual contract.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-0cc6c2c0a7db5d1d9ff9c3863a38d4d18791b3e7%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

More commodities may be added as exchange listings expand. Filter by **Commodities** in the asset selector to see the current list.

Commodity perpetuals work the same way as crypto perpetuals: no expiry, funding rates, and leverage available. Commodities are available 24/7, though liquidity varies by session.

{% hint style="info" %}
Commodity perpetuals track the underlying commodity price via oracle feeds. You are not taking delivery of physical goods.
{% endhint %}

***

## Fees

Trading fees apply to all perpetual trades and vary by asset class. See [Trading fees](https://minara.ai/docs/trade/trading-fees.md) for the current rate schedule.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/trade-assets.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
