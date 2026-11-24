> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/reference/order-types.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Order types

Minara's trading panel supports two primary order types, with modifiers that change how they execute. The same order types are available for crypto, stocks, and commodities.

## Market order

A market order executes immediately at the best available price on the order book. You get filled quickly, but the exact price depends on current liquidity.

Use a market order when speed of execution matters more than price precision — for example, closing a position quickly during volatile conditions.

## Trigger order

A trigger order waits until the asset reaches a price you specify, then executes. There are two sub-types:

**Limit trigger**: when the trigger price is reached, the order is placed as a limit order at your specified price. You will be filled at that price or better, but the order may not fill at all if the market moves away.

**Stop trigger**: when the asset crosses a threshold price, the order is placed as a market order. Used for stop-losses. The order will fill at the best available price once triggered, which can differ significantly from the trigger price in fast-moving or thinly-traded markets. There is no guaranteed exit price.

## Order modifiers

**Reduce Only**: the order will only reduce an existing position, never increase it or open a new one. Useful when placing stop-loss or take-profit orders to ensure they don't accidentally flip your position.

**Post Only**: the order will only be placed as a maker order (added to the order book). If it would execute immediately as a taker, it is cancelled instead. Use this to avoid taker fees.

## Take-profit and stop-loss (TP/SL)

You can attach take-profit and stop-loss levels to an open position directly from the positions panel. These are stored as conditional trigger orders that activate when the price reaches your target.

* **Take-profit**: closes the position (fully or partially) when price moves in your favor to the target level
* **Stop-loss**: closes the position when price moves against you to the threshold level

{% hint style="info" %}
Autopilot and Strategy Studio manage TP/SL automatically. When trading manually via Copilot, Minara's signal cards suggest TP and SL levels — you set them yourself when placing the order.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/reference/order-types.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
