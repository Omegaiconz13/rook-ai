> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/legacy-workflow/how-to-run-analysis-on-a-schedule.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Scheduled analysis (Legacy)

Minara makes you stay informed without any manual check.

{% hint style="warning" %}
**Legacy.** This page describes Workflow in the Minara web app, which is being retired. It is kept for reference only and may not reflect current behavior. For new automations, see [Scheduled briefs and reports](https://minara.ai/docs/automation/scheduled-briefs-and-reports.md) in the Minara desktop app.
{% endhint %}

Whether it's weekly market health checks, monthly portfolio reviews, or periodic strategy evaluations, this workflow keeps you in the loop consistently.

### Best practice

* Choose a reasonable frequency. Avoid unnecessarily high-frequency checks to save credits.
* Clearly specify the **topics (e.g. assets**, **metrics**, and **indicators)** you want in the analysis.
* Use consistent scheduling patterns (e.g., every Friday, 9 AM) for easier tracking.
* Email is recommended for long analysis reports and telegram is more suitable for shorter messages.

### Example prompts

1. **Weekly market health check**: every Friday at 10:00 AM, analyze global crypto market cap trends, BTC/ETH dominance, and top DeFi protocol activity.
2. **Monthly asset performance review**: on the 1st of every month at 9:00 AM, pull the 30-day price change, trading volume, and on-chain activity for BTC, ETH, SOL, and my other top holdings.
3. **Long-term target tracking**: every Friday at 8:00 AM, evaluate the market using all bull- and bear-market top indicators and send a summary to my email.
4. **Ecosystem watch**: every Monday at 11:00 AM, review Solana's top 10 active projects by daily wallet interaction growth.
5. **Sector rotation signal**: every 2 weeks, compare performance of L1s, L2s, and DeFi tokens, and suggest a rebalance strategy.
6. **Stock & macro digest**: every Monday morning, summarize the prior week's performance for NVDA, AAPL, TSLA, AMZN, and MSFT alongside any major macro developments.
7. **Gold and commodities watch**: every Wednesday, pull gold (XAU) price, crude oil price, and any macro drivers affecting commodity markets.

### Future developments

* Integration with more **data sources** for richer, multi-domain analysis.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/legacy-workflow/how-to-run-analysis-on-a-schedule.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
