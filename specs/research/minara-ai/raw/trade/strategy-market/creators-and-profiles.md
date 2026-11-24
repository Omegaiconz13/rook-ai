> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market/creators-and-profiles.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Creators and profiles

Every published strategy belongs to a creator profile. Open the creator name from a strategy card or detail page to learn who published it and to review their other public strategies.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-1e9ee9f16c5a1bded48db56770af523fcda5c33b%2Fstrategy-market-creator-profile.png?alt=media" alt="Creator profile with verification status, follow control, publication count, Top Strategies count, and public strategies"><figcaption><p>A creator profile groups identity and publication history; each strategy still needs its own review.</p></figcaption></figure>

## What a profile shows

A public profile can include:

* Display name, avatar, banner, and bio.
* Verification status.
* Links to public social channels.
* Number of strategies published.
* Number currently appearing on Top Strategies.
* Public strategy cards with their current measurements.

Select `Follow` to follow the creator. Select a strategy card to open its detail page, or use `Run` after you have completed your review.

## How to interpret verification

A verification badge is a profile-level status. It does not verify future returns, remove market risk, or guarantee that every strategy from that creator will perform similarly.

Check each publication separately. Two strategies from the same creator can trade different markets, use different rules, and carry different drawdown or concentration risk.

## Compare a creator's strategies

When a creator has multiple public strategies:

1. Compare the markets and strategy categories first.
2. Check whether the records overlap in time.
3. Compare maximum drawdown and live-forward performance, not only annualized return.
4. Look for concentration in the same assets or market regime.

Following a creator does not subscribe your wallet to their strategies or start an Autopilot run.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market/creators-and-profiles.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
