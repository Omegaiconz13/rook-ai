> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/trade/strategy-market/publish-and-manage.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Publish and manage

Creators use Strategy Studio to build the trading logic and Strategy Market to present and distribute the published version. Your profile's `My Strategies` tab is the starting point for managing those publications.

Select `Publish my strategies` from Marketplace or Top Strategies to open the creator flow, or open your profile and go directly to `My Strategies`.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-24a94c09c3645440ab80c8d5945001a8c4b9a743%2Fstrategy-market-my-strategies.png?alt=media" alt="My Strategies tab showing the creator&#x27;s strategy library, filters, public labels, and Edit and Run controls"><figcaption><p>My Strategies contains both public and non-public strategies attached to your account.</p></figcaption></figure>

## Find the strategy

Open your profile and select `My Strategies`. Use search and filters to find the strategy you want to manage.

Each card can show its current measurements, publication status, and controls:

* `Public` marks a strategy that other users can discover.
* `Edit` opens the publication editor.
* `Run` starts the strategy in one of your own wallets.
* The star icon saves the strategy to your Starred list.

Publishing and running are separate actions. Publishing makes a strategy discoverable; it does not start a live run in your account.

## Edit the market listing

Open `Edit` from My Strategies or use the pencil button on the owner view of a strategy page.

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-3b909ddaf502b36435af387fd95a586a9f8b7b01%2Fstrategy-market-edit-about.png?alt=media" alt="Strategy publication editor on the About tab with name, description, style, risk profile, and Edit in Strategy Studio link"><figcaption><p>The About tab changes the listing, not the underlying trading logic.</p></figcaption></figure>

The `About` tab controls how the strategy is presented:

<table><thead><tr><th width="154.11566162109375">Field</th><th>What to include</th></tr></thead><tbody><tr><td>Strategy name</td><td>A specific name that distinguishes the publication from your other strategies.</td></tr><tr><td>Description</td><td>The market, main signal or factor, trading cadence, and intended risk behavior.</td></tr><tr><td>Style</td><td>The closest trading behavior, such as mean reversion, trend following, swing, breakout, arbitrage, or market making.</td></tr><tr><td>Risk profile</td><td>The classification that best matches the strategy and its backtest.</td></tr></tbody></table>

Use the `Backtest` tab to review the result attached to the publication. The description and the displayed backtest should refer to the same strategy version.

Select `Edit in Strategy Studio` when you need to change code, signals, parameters, asset universe, timeframe, or execution rules. Run a new backtest after changing the trading logic.

## Set visibility and availability

<figure><img src="https://2791910906-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fkz0StyE54EpnCuzTSwSy%2Fuploads%2Fgit-blob-a3c1a207c57c3723675db2fff5ac293fe954edf6%2Fstrategy-market-edit-visibility.png?alt=media" alt="Strategy publication editor on the Visibility tab with Public, Subscribable, and Open source settings"><figcaption><p>Visibility settings determine how other traders can access the publication.</p></figcaption></figure>

<table><thead><tr><th width="134.47491455078125">Setting</th><th>Effect</th></tr></thead><tbody><tr><td>Public</td><td>Other users can find and view the strategy.</td></tr><tr><td>Subscribable</td><td>Eligible users can subscribe and run it. The source remains private unless <code>Open source</code> is also enabled.</td></tr><tr><td>Open source</td><td>Other users can view and fork the source code.</td></tr></tbody></table>

When `Subscribable` is enabled, review the profit-share rate, minimum and maximum investment amounts, and Subscriber limit shown by the editor. The platform minimum for one Subscriber is **$500**; a creator may set a higher minimum for an individual strategy. The profit-share rate is the percentage of a Subscriber's strategy profit allocated to the creator.

To remove the strategy from public discovery, turn off `Public` and save. Review its existing subscribers and live-run state before unpublishing.

## Review subscribers and creator earnings

Open the published strategy's owner view, then select `Subscriber Overview`. Use it to review the subscriber information and profit-share data available for that publication.

Subscriber data belongs to a specific strategy publication. Check the strategy name before changing its profit-share rate, investment limits, or subscriber cap.

## Keep your creator profile current

The pencil control on your profile opens profile editing. You can update the banner, avatar, display name, bio, website, and supported social links. These details help prospective Subscribers identify the creator behind a strategy, but they do not replace a clear strategy description or a complete performance record.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/trade/strategy-market/publish-and-manage.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
