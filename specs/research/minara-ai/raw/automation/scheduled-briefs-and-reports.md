> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/automation/scheduled-briefs-and-reports.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Scheduled briefs and reports

Get market briefs, portfolio reports, and reminders delivered on a schedule you choose.

{% hint style="info" %}
Automation is available only in the Minara desktop app. The web app and mobile app do not support it yet.
{% endhint %}

A scheduled automation runs at the times you choose and sends you the result. Use it to stay informed without opening Minara: a morning market brief, an end-of-day P\&L report, a weekly macro summary, or a simple reminder.

## Example prompts

* *"Every morning, summarize my portfolio and the market."*
* *"At 5 PM each trading day, send my portfolio P\&L report to Telegram."*
* *"30 minutes before the U.S. market opens, pick 4 stocks and email me their tickers, entry prices, and a short note."*
* *"Every day, track my top 3 wallet holdings and message me their moves and on-chain activity."*
* *"Every Sunday evening, email me a summary of the week's major economic events and how they moved the market."*
* *"Remind me to review my positions every Friday afternoon."*

## Set it up

1. In the desktop app, open **Automations** and describe the report in the **Chat** tab.
2. Tell Minara:
   * **When**: the time, the days, and your time zone. For example, *"weekdays at 8:00 AM Singapore time"*.
   * **What**: the assets, metrics, or topics to cover.
   * **How**: the format, length, and language you want.
   * **Where**: in-app, Telegram, email, or another connected channel.
3. Review the flow on the canvas and click **Test** to preview the message you will receive.
4. Leave **Automatic execution** on. The report arrives on schedule.

To change the timing later, open the automation and click **Edit schedule**. You can pick a preset interval (every 5, 15, or 30 minutes, every hour, every 4 hours, every day) or a calendar schedule.

## Tips

* **Be specific.** "BTC, ETH, and SOL: overnight move, key levels, and risk flags" gives a better report than "crypto update".
* **Match the channel to the length.** Email suits long reports. Telegram and in-app notifications suit short updates.
* **Pick a sensible frequency.** Each AI-written report consumes credits. A daily or weekly brief is usually enough; save high frequencies for simple price checks.
* **One-time reminders work too.** Ask for *"remind me tomorrow at 3 PM to check my ETH position"* and the automation runs once.

## Limitations

* Runs happen on your computer. Keep the desktop app open and online at the scheduled time.
* Reports reflect the data available when the run starts. Verify important figures before acting on them.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/automation/scheduled-briefs-and-reports.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
