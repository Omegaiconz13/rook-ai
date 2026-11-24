> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/legacy-workflow/how-to-create-a-price-alert-bot.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Price alert bot (Legacy)

Build a reliable alert that watches prices and pings you the moment conditions hit.

{% hint style="warning" %}
**Legacy.** This page describes Workflow in the Minara web app, which is being retired. It is kept for reference only and may not reflect current behavior. For new automations, see [Price alerts](https://minara.ai/docs/automation/price-alerts.md) in the Minara desktop app.
{% endhint %}

With Minara's monitor system, you can set high-precision, real-time alerts for token prices without worrying about delays or missed triggers. When the set price condition is met, Minara can instantly notify you without consuming any credits.

***

### What to expect

* High-precision, real-time monitoring for **token absolute prices**\
  (e.g., "Alert me when SOL hits $150").
* Works for **on-chain tokens** and **tokenized stocks**.\
  Non-tokenized stock prices and price change percentage alerts are **not yet supported** in real-time mode.
* Alerts can be sent via telegram or email.
* **No credit consumption**: the monitoring is done on our backend, not by repeated AI queries.

***

### Example prompts

* *"Alert me when **ETH** drops to **$4,000**."*
* *"Email me if **SOL** rises above **$180**."*
* *"When **DOGE** hits **$0.28**, send me an alert."*
* *"Notify me when **BTC** crosses $100,000."*
* *"Alert me when **gold (XAU)** drops below $3,000."*
* *"Send me a Telegram message when **NVDA** reaches $1,200."*
* *"Alert me if **AAPL** falls below $200."*

***

### How it works

1. **You tell Minara the asset and target price**.
2. Minara registers your alert in the monitor system.
3. The monitor system continuously tracks the token price in real time.
4. Once the price crosses your target, the monitor will trigger the workflow to send you an alert immediately.

***

### Best practice

* **Use absolute price triggers** (≥ / ≤). Real-time % change tracking is not yet available.
* Keep your telegram account linked and [Minara notification bot](https://t.me/MinaraNotificationBot) enabled to ensure delivery.
* Check spam folder first if you didn't receive the alert email.
* For small‑cap meme tokens, copycats and same‑name lookalikes are common, especially during hype. To avoid mistakes, always specify and double‑check the chain and the token's contract address.

> Mainstream assets like BTC, ETH, or SOL are already disambiguated by contract.

***

### Future developments

Minara is planning to support:

* Percentage-based alerts (e.g., ±5% in 1h)
* Non-tokenized stock prices in real time
* Browser Push notifications
* Auto-recurring notification bots: monitors and alerts will run continuously

You *can* still track these via workflows by scheduling periodic checks, but each check will be conducted by Minara AI and consume credits, which can become costly for high-frequency setups.

\
We recommend reserving this approach for low-frequency use cases. For example:

* **Weekly market health check**: review market cap trends and macro indicators every Friday.
* **Monthly asset performance review**: pull 30-day price change data for your top 5 holdings on the first day of each month.
* **Long-term target tracking**: every Friday, evaluate our market bias by reviewing all bull- and bear-market top indicators.

To explore more about the use cases above, please check out [Scheduled analysis (Legacy)](https://minara.ai/docs/automation/legacy-workflow/how-to-run-analysis-on-a-schedule.md).


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/legacy-workflow/how-to-create-a-price-alert-bot.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
