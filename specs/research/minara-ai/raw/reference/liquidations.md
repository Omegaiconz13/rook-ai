> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/reference/liquidations.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Liquidations

Liquidation happens when your account equity falls below the maintenance margin required to hold a position. The system closes the position to prevent your balance from going negative.

## How liquidation works

Each open position has a **liquidation price** — the asset price at which your margin is insufficient. This price is displayed on every open position in the positions panel. As the market moves against you, your margin ratio decreases. When it reaches the maintenance margin threshold, liquidation is triggered.

The position is closed by Hyperliquid's liquidation engine, typically at or near the liquidation price. Any remaining margin after the close is returned to your account. If the position size is large relative to available liquidity, there may be slippage.

## Auto-deleveraging

In extreme market conditions — sharp moves with insufficient liquidity to fill liquidation orders — Hyperliquid's auto-deleveraging (ADL) system may activate. ADL matches the liquidated position against profitable traders on the opposite side, closing their positions at the bankruptcy price. If your position is selected for ADL, you receive notification and your position is reduced or closed.

ADL is rare and is a last-resort mechanism. It does not incur additional fees.

## How to avoid liquidation

**Set a stop-loss**: place a stop trigger order below (for longs) or above (for shorts) your entry price. This exits the position before it reaches the liquidation price. See [Order types](https://minara.ai/docs/reference/order-types.md) for how stop triggers work.

**Use lower leverage**: higher leverage brings the liquidation price closer to your entry. At 2x leverage, the asset must drop 50% before liquidation. At 20x, it only needs to drop 5%.

**Monitor your margin ratio**: the positions panel shows your current margin ratio per position. Watch it during volatile periods.

**Use Autopilot's AI Stop-loss**: when running Autopilot, enable the AI Stop-loss feature. It adjusts the stop dynamically based on market conditions and exits positions before they approach the liquidation price.

{% hint style="info" %}
You cannot recover a liquidated position — once triggered, it's closed. The best approach is prevention: lower leverage and a stop-loss set at your maximum acceptable loss.
{% endhint %}


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/reference/liquidations.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
