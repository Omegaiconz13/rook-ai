> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/reference/personalization.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Personalization

Minara's personalization system adapts analysis and responses to your trading habits, portfolio context, and stated preferences. Rather than returning the same generic output to every user, Minara uses information you provide and patterns it observes over time to make responses more relevant to how you actually work.

All personalization modules are enabled by default. You can disable any of them at any time.

## Where to find personalization settings

Click your avatar in the top-left corner of the app and select **Personalization** from the profile menu. The sections below (Trading summary, Custom Prompt, Tags, and Memories) each appear as separate panels on that page.

***

## Trading summary

### Minara wallet context

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-4c441338c214d04b098ca8ced744d1e4bfec8f16%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

Minara incorporates your Minara spot wallet holdings into its analysis. When you ask market questions, Minara can factor in:

* The assets you currently hold
* Your exposure concentration
* Risk distribution across the portfolio
* Unrealized positions

This means analysis is relative to your current situation, not answered in isolation.

The context of Minara perpetual wallets is not yet integrated.

### External portfolio

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-fe822669bd396aafcaf7b493d2a2a942decf6e7c%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

You can import wallet addresses outside Minara. Minara summarizes your trading activity across those wallets, including:

* Typical holding duration
* Preferred trading pairs
* Observed strategy patterns
* Historical performance tendencies

This gives Minara a broader picture of how you trade, beyond what happens inside the platform.

***

## Custom prompt

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-82d18b6d1dc22e19be9193e7718ec418953e7c25%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

Custom Prompt lets you write system-level instructions that apply to all your Minara interactions. Use it to specify:

* Preferred analysis depth or style
* Indicators or frameworks you want Minara to prioritize
* Response format (concise summary vs. detailed breakdown)
* Assets or markets to focus on
* Tone and how you want Minara to address you

These instructions persist across sessions and take precedence over default behavior.

***

## Tags

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-b5dcb8d08e65726ff1f1c62351f18346dce37ff4%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>

Tags represent structured dimensions of your trading profile. Each dimension has a set of possible labels. Examples:

* **Risk profile:** Aggressive / Balanced / Conservative
* **Decision-making style:** Data-Driven / Narrative-Driven / Community-Driven / Tech-Driven
* **Trading frequency:** Passive Holder / Market Watcher

Minara may automatically infer and update tags based on your conversations over time. You can also set any tag manually. Once a tag is manually set, Minara will not overwrite it automatically. If a tag does not apply to you, set it to N/A.

Tags help Minara calibrate how it frames analysis, suggestions, and explanations.

***

## Memories

{% columns %}
{% column %}

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-f401cacc8cda5c3d251a79547b6d9400e5c129a1%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>
{% endcolumn %}

{% column %}

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-10648c95e6bd05ce1b507d2e5e0a7586210b3e90%2Fimage.png?alt=media" alt=""><figcaption></figcaption></figure>
{% endcolumn %}
{% endcolumns %}

Memories are specific facts Minara stores about your preferences, strategies, and past interactions. Examples:

* Preferred trading timeframe
* Preferred analysis approach
* Typical risk tolerance

Memories allow Minara to maintain continuity across conversations — you do not need to re-explain your context each time. You can delete any memory you do not want Minara to retain.

### How Minara uses memory

Beyond preferences, Minara can also remember earlier research, the reasoning behind past decisions, investment theses you're tracking, and lessons from past tasks. A trade history shows *what* happened; memory can also keep *why* a decision made sense at the time, and what happened afterwards.

Over time, Minara turns useful experience into better working habits: **Observe → Reflect → Distill → Reuse**. A profitable trade doesn't automatically mean the reasoning was right, and a losing trade doesn't automatically mean the idea was wrong. Minara looks at the reasoning, not just the outcome.

What memory does not do:

* **It is not permission.** A remembered preference or an earlier approval never counts as approval for a new trade. See [Safety and approvals](https://minara.ai/docs/technology/safety-and-approvals.md).
* **It does not replace fresh data.** Minara still checks current market and account information.
* **It only covers what Minara can see.** Trades or accounts outside Minara aren't included unless you've connected them.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/reference/personalization.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
