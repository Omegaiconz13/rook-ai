> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/manage-your-strategies.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Manage your strategies

Your profile is the control center for strategies you have created and published. Use it to find a strategy, update its public listing, manage who can subscribe, review subscriber and profit-share information, or return to Strategy Studio to change the strategy itself.

<figure><img src="https://1883420886-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fs9Vk1qEmVro82gX4lWvL%2Fuploads%2Fgit-blob-f73b6c0198b15ea455aa85f6ac553e2397e9cbc3%2Fmanage-my-strategies.png?alt=media" alt="My Strategies tab showing the creator&#x27;s strategy library, filters, publication status, and strategy controls"><figcaption></figcaption></figure>

## Start from your profile

Open your profile and select `My Strategies`. This tab contains every strategy attached to your account, including both public and non-public strategies. The number beside the tab is the total in the current library.

The management flow has three parts:

1. [Find, review, and edit a strategy](https://minara.ai/docs/academy/manage-your-strategies/your-strategy-library.md) in My Strategies, including its name, description, style, risk profile, and displayed backtest.
2. [Manage visibility and subscriptions](https://minara.ai/docs/academy/manage-your-strategies/visibility-subscribers-and-earnings.md), then open the owner view for subscriber information and available profit-share data.
3. [Update your creator profile](https://minara.ai/docs/academy/manage-your-strategies/edit-your-creator-profile.md) so traders can understand who published the strategy.

## Choose the correct edit path

Publication settings and strategy logic are edited in different places.

| What you want to change                                                         | Where to change it                    |
| ------------------------------------------------------------------------------- | ------------------------------------- |
| Strategy name, description, style, risk profile, or public backtest             | `Edit` on the published strategy page |
| Public, subscribable, profit-share rate, investment limits, or subscriber limit | `Edit` → `Visibility`                 |
| Trading logic, parameters, asset or universe, and strategy code                 | `Edit in Strategy Studio`             |
| Banner, avatar, display name, bio, website, or social links                     | Profile pencil → `Edit Profile`       |

Changing a Marketplace listing does not rewrite the strategy logic. Use Strategy Studio when the trading rules need to change.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/manage-your-strategies.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
