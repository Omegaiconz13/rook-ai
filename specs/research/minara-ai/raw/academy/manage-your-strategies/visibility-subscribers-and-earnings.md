> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/manage-your-strategies/visibility-subscribers-and-earnings.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Visibility, subscribers, and earnings

The `Visibility` tab controls whether other users can find a strategy and whether they can subscribe to run it. It also sets the commercial limits for the publication.

<figure><img src="https://1883420886-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fs9Vk1qEmVro82gX4lWvL%2Fuploads%2Fgit-blob-82b7a4d762ee2e83963e79e8c15c8a1c4ec678d3%2Fupdate-publication-visibility.png?alt=media" alt="Update publication Visibility tab with Public and Subscribable controls, profit-share rate, investment limits, and subscriber limit"><figcaption></figcaption></figure>

## Public and subscribable

`Public` makes the strategy visible to other users. Turn on `Subscribable` when users should be able to become Subscribers and run it. A public strategy can remain viewable without accepting subscriptions.

When subscriptions are enabled, review each limit before saving:

| Setting                   | What it controls                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Profit share rate         | The percentage of a Subscriber's strategy profit allocated to the creator.                                      |
| Minimum investment amount | The smallest allocation accepted from one Subscriber. It cannot be lower than the platform minimum of **$500**. |
| Maximum investment amount | The largest allocation accepted from one Subscriber.                                                            |
| Maximum Subscribers       | The total number of Subscribers the publication can accept.                                                     |

Choose limits that match the strategy's intended capacity and risk. You may set the minimum investment above **$500**, but not below it. Select `Save changes` when the visibility and subscription terms are correct.

## Review subscribers and profit share

Return to the published strategy page and open `Subscriber Overview`. This opens the owner view for that publication's subscriber information. Review any available profit-share data there before changing the profit-share rate, investment limits, or subscriber cap.

Subscriber data belongs to a specific publication. Check that you opened the correct strategy when you manage several public strategies.

## Unpublish a strategy

To remove a strategy from public discovery, open `Visibility` and turn off `Public`. The editor explains that saving will unpublish the strategy, and the primary action changes to `Unpublish`.

<figure><img src="https://1883420886-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fs9Vk1qEmVro82gX4lWvL%2Fuploads%2Fgit-blob-939afb57e9ee706158efac54618c47ebb374bbff%2Funpublish-strategy.png?alt=media" alt="Visibility tab with Public turned off and the Unpublish confirmation action highlighted"><figcaption></figcaption></figure>

Review `Subscriber Overview` before confirming so you understand the strategy's current subscription state. Review your own live runs separately from the publication settings.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/manage-your-strategies/visibility-subscribers-and-earnings.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
