> For the complete documentation index, see [llms.txt](https://minara.ai/docs/llms.txt). Markdown versions of documentation pages are available by appending `.md` to page URLs; this page is available as [Markdown](https://minara.ai/docs/academy/manage-your-strategies/edit-your-creator-profile.md). Agents can also search and read this documentation through its [MCP server](https://minara.ai/docs/~gitbook/mcp).

# Edit your creator profile

Your creator profile appears beside the strategies you publish. Keep it specific enough that prospective Subscribers can identify you, understand your approach, and find the public channels you choose to share.

{% embed url="<https://cdn.jsdelivr.net/gh/Minara-AI/Documentation@academy-video-assets/.gitbook/assets/academy-edit-creator-profile.mp4>" %}

Open your profile and select the pencil button in the header. The `Edit Profile` dialog contains the public identity fields.

<figure><img src="https://1883420886-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2Fs9Vk1qEmVro82gX4lWvL%2Fuploads%2Fgit-blob-e251ac739859fd7f05942df0e07cc101b9672cc4%2Fedit-creator-profile.png?alt=media" alt="Edit Profile dialog with banner, avatar, display name, bio, website, and linked social accounts"><figcaption></figcaption></figure>

## Profile fields

| Field             | What appears publicly                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| Banner and avatar | The visual identity shown in your profile header and creator references.    |
| Display name      | The name attached to your creator profile and published strategies.         |
| Bio               | A short description of your trading approach or the strategies you publish. |
| Website           | A public site where users can learn more about you.                         |
| Linked socials    | Connected X, Discord, Telegram, or other supported accounts.                |

Only connect channels you want visitors to use. Review the profile as a public visitor after saving, especially after changing a display name, website, or social connection.

## What the profile summary shows

The profile header also reports how many strategies you have published and how many are currently on Top Strategies. Social links, follow controls, and verification status appear here when available.

These profile-level statistics are different from strategy-level subscriber and profit-share data. Open the relevant strategy's `Subscriber Overview` when you need publication-specific information.


---

# Agent Instructions
This documentation is published with GitBook. GitBook is the documentation platform designed so that both humans and AI agents can read, navigate, and reason over technical content effectively. Learn more at gitbook.com.

## Querying This Documentation
If you need additional information that is not directly available in this page, you can query the documentation by asking a question.

Perform an HTTP GET request on the following URL with the `ask` and `goal` query parameters:

```
GET https://minara.ai/docs/academy/manage-your-strategies/edit-your-creator-profile.md?ask=<question>&goal=<user_goal>
```

`ask` is the immediate question: it should be specific, self-contained, and written in natural language.
`goal` is what the user is ultimately trying to achieve, the reason they need the answer. Sharing it helps GitBook give you a better, more relevant answer. A goal is most helpful when it describes the outcome the user wants rather than restating the question. For example, with `ask=how do I create an API token`, a goal like `automate deployments from our CI pipeline` lets GitBook tailor the answer to that use case.

The response will contain a direct answer to the question and relevant excerpts and sources from the documentation.

Use this mechanism when the answer is not explicitly present in the current page, you need clarification or additional context, or you want to retrieve related documentation sections.
